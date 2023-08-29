use anyhow::anyhow;
use anyhow::Context;
use anyhow::Result;
use bff_cli::diag::print_errors;
use bff_cli::printer::ToModule;
use bff_cli::writer;
use bff_cli::BundleResult;
use bff_cli::Bundler;
use bff_cli::ParsedModule;
use clap::Parser;
use notify::RecursiveMode;
use notify_debouncer_mini::new_debouncer;
use notify_debouncer_mini::DebouncedEventKind;
use serde::Deserialize;
use std::collections::HashMap;
use std::time::Duration;
use std::time::Instant;
use std::{fs, path::PathBuf};
use swc_common::collections::AHashMap;
use swc_common::FileName;

#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
struct Args {
    #[arg(short, long, default_value=None)]
    project: Option<String>,

    #[arg(long, short, action)]
    watch: bool,

    #[arg(long, short, action)]
    no_shared_runtime: bool,
}

impl Args {
    fn resolve(self) -> Result<ResolvedArgs> {
        let cwd = std::env::current_dir()?;
        let r = match self.project {
            Some(project) => {
                let project_json_path: PathBuf = project.into();
                if project_json_path.is_absolute() {
                    ResolvedArgs {
                        project_json_path,
                        watch: self.watch,
                        no_shared_runtime: self.no_shared_runtime,
                    }
                } else {
                    let project_json_path = cwd.join(project_json_path);
                    ResolvedArgs {
                        project_json_path,
                        watch: self.watch,
                        no_shared_runtime: self.no_shared_runtime,
                    }
                }
            }
            None => {
                let project_json_path = cwd.join("bff.json");
                ResolvedArgs {
                    project_json_path,
                    watch: self.watch,
                    no_shared_runtime: self.no_shared_runtime,
                }
            }
        };
        if r.project_json_path.exists() {
            Ok(r)
        } else {
            Err(anyhow!(
                "Could not find bff file.\nCould not find a file at {}.",
                r.project_json_path.display()
            ))
        }
    }
}

#[derive(Debug, Deserialize)]
struct Project {
    router: String,
    #[serde(rename = "outputDir")]
    output_dir: String,
}

#[derive(Debug)]
struct ResolvedArgs {
    project_json_path: PathBuf,
    watch: bool,
    no_shared_runtime: bool,
}

impl ResolvedArgs {
    fn project(&self) -> Result<Project> {
        let the_file = fs::read_to_string(&self.project_json_path)?;
        let project: Project = serde_json::from_str(&the_file)?;
        Ok(project)
    }
    fn output_dir(&self) -> Result<PathBuf> {
        let project = self.project()?;
        let output_dir = self
            .project_json_path
            .parent()
            .expect("parent should exist")
            .join(&project.output_dir);
        Ok(output_dir)
    }
    fn entry_point(&self) -> Result<String> {
        let project = self.project()?;

        let mut entry_file: &str = &project.router;

        if entry_file.starts_with("./") {
            entry_file = &entry_file[2..];
        }

        let entry_point = self
            .project_json_path
            .parent()
            .expect("parent should exist")
            .join(entry_file)
            .to_str()
            .map(|x| x.to_string());

        match entry_point {
            Some(x) => Ok(x),
            None => Err(anyhow!(
                "Could not resolve entry point: {:?}",
                project.router
            )),
        }
    }
}

fn write_bundle(
    res: BundleResult,
    bundler_files: &AHashMap<FileName, ParsedModule>,
    args: &ResolvedArgs,
) -> Result<()> {
    let project_root = args
        .project_json_path
        .parent()
        .expect("folder should exist")
        .to_str()
        .expect("is valid utf8");
    if res.errors.is_empty() {
        let (ast, write_errs) = res.to_module();
        if write_errs.is_empty() {
            writer::write_bundled_module(&args.output_dir()?, &ast, args.no_shared_runtime)?;
            return Ok(());
        }
        print_errors(write_errs, bundler_files, project_root);
        return Err(anyhow!("Failed to write bundle"));
    }
    print_errors(res.errors, bundler_files, project_root);
    Err(anyhow!("Failed to bundle"))
}

struct BffWatcher<'a> {
    input_files: Vec<PathBuf>,
    entry_point: String,
    args: &'a ResolvedArgs,
    watched_files: HashMap<PathBuf, Instant>,
}
impl<'a> BffWatcher<'a> {
    fn watch(mut self) -> Result<()> {
        let (tx, rx) = std::sync::mpsc::channel();
        let mut debouncer = new_debouncer(Duration::from_millis(50), tx)
            .expect("should be possible to create debouncer");

        for path in self.input_files {
            debouncer
                .watcher()
                .watch(path.as_ref(), RecursiveMode::NonRecursive)?;
            self.watched_files.insert(path, Instant::now());
        }

        for res in rx {
            match res {
                Ok(events) => {
                    log::debug!("Watch Change: {events:?}");
                    for event in events {
                        match &event.kind {
                            DebouncedEventKind::Any => {
                                let start = Instant::now();

                                let mut bundler = Bundler::new();
                                let res = bundler
                                    .bundle(FileName::Real(self.entry_point.clone().into()))
                                    .and_then(|res| write_bundle(res, &bundler.files, self.args));

                                match res {
                                    Ok(_) => {
                                        let dur = start.elapsed();
                                        println!("Success! Finished in {dur:?}");
                                        for path in bundler.files.keys() {
                                            let path: PathBuf = path.to_string().into();
                                            #[allow(clippy::map_entry)]
                                            if !self.watched_files.contains_key(&path) {
                                                debouncer.watcher().watch(
                                                    path.as_ref(),
                                                    RecursiveMode::NonRecursive,
                                                )?;
                                                self.watched_files.insert(path, Instant::now());
                                            }
                                        }
                                    }
                                    Err(err) => {
                                        log::error!("ERROR: {}", err);
                                        err.chain()
                                            .skip(1)
                                            .for_each(|cause| log::error!("because: {}", cause));
                                    }
                                }
                            }
                            DebouncedEventKind::AnyContinuous => {}
                            _ => {}
                        }
                    }
                }
                Err(error) => log::error!("Watch Error: {error:?}"),
            }
        }

        Ok(())
    }
}
fn main() -> Result<()> {
    env_logger::init();
    log::debug!("started");

    // if args resolves, we have a valid bffconfig.json path
    let args = Args::parse().resolve()?;
    let watch = args.watch;
    log::debug!("resolved args: {:?}", args);

    // parse bffconfig.json, read entrypoint, return entrypoint
    let entry_point = args
        .entry_point()
        .context("Could not get entrypoint from bffconfig.json")?;
    log::debug!("using entry_point: {:?}", entry_point);

    let mut bundler = Bundler::new();
    let res = bundler
        .bundle(FileName::Real(entry_point.clone().into()))
        .context(format!("Could not bundle {:?}", &entry_point))?;
    let start = Instant::now();
    let res = write_bundle(res, &bundler.files, &args);
    if watch {
        let w = BffWatcher {
            input_files: bundler.files.keys().map(|x| x.to_string().into()).collect(),
            entry_point,
            args: &args,
            watched_files: HashMap::new(),
        };
        w.watch()
    } else {
        if res.is_ok() {
            let dur = start.elapsed();
            println!("Success! Finished in {dur:?}");
        }
        res
    }
}
