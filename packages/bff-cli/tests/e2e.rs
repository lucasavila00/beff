use std::{io::Write, path::PathBuf};

use assert_cmd::Command;
#[test]
fn test_failures() {
    let mut failures_folder = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    failures_folder.push("errors");

    // read folders in failures folder
    let failures = std::fs::read_dir(failures_folder).unwrap();

    for f in failures {
        match f {
            Ok(dir_entry) => {
                let path = dir_entry.path();
                let dir_entry_str = path.to_str().unwrap();
                let mut cmd = Command::cargo_bin(env!("CARGO_PKG_NAME")).unwrap();
                let assert = cmd
                    .arg("-p")
                    .arg(format!("{dir_entry_str}/bff.json"))
                    .assert();

                let out = assert.get_output();

                let stdout_path = format!("{dir_entry_str}/stdout.log");
                let mut stdout_file = std::fs::File::create(stdout_path).unwrap();
                stdout_file.write_all(&out.stdout).unwrap();

                let stderr_path = format!("{dir_entry_str}/stderr.log");
                let mut stderr_file = std::fs::File::create(stderr_path).unwrap();
                stderr_file.write_all(&out.stderr).unwrap();

                assert.failure();
            }
            Err(_) => todo!(),
        }
    }
}
#[test]
fn test_samples() {
    let mut samples_folder = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    samples_folder.push("samples");

    let samples = std::fs::read_dir(samples_folder).unwrap();

    for it in samples {
        match it {
            Ok(dir_entry) => {
                let path = dir_entry.path();
                let dir_entry_str = path.to_str().unwrap();
                let mut cmd = Command::cargo_bin(env!("CARGO_PKG_NAME")).unwrap();
                let assert = cmd
                    .arg("-p")
                    .arg(format!("{dir_entry_str}/bff.json"))
                    .arg("--no-shared-runtime")
                    .assert();

                let out = assert.get_output();

                if !out.stderr.is_empty() {
                    let std_out = String::from_utf8(out.stdout.clone()).unwrap();
                    dbg!(std_out);
                    let std_err = String::from_utf8(out.stderr.clone()).unwrap();
                    dbg!(std_err);
                    dbg!(&dir_entry);
                    panic!("stderr is not empty")
                }

                assert.success();
            }
            Err(_) => todo!(),
        }
    }
}

#[test]
fn test_vitest() {
    let mut samples_folder = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    samples_folder.push("vitest");

    let samples = std::fs::read_dir(samples_folder).unwrap();

    for it in samples {
        match it {
            Ok(dir_entry) => {
                let is_file = dir_entry.file_type().unwrap().is_file();
                if is_file {
                    continue;
                }
                let path = dir_entry.path();
                let dir_entry_str = path.to_str().unwrap();
                let mut cmd = Command::cargo_bin(env!("CARGO_PKG_NAME")).unwrap();
                let assert = cmd
                    .arg("-p")
                    .arg(format!("{dir_entry_str}/bff.json"))
                    .assert();

                let out = assert.get_output();

                if !out.stderr.is_empty() {
                    let std_out = String::from_utf8(out.stdout.clone()).unwrap();
                    dbg!(std_out);
                    let std_err = String::from_utf8(out.stderr.clone()).unwrap();
                    dbg!(std_err);
                    dbg!(&dir_entry);
                    panic!("stderr is not empty")
                }

                assert.success();
            }
            Err(_) => todo!(),
        }
    }
}
