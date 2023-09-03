"use strict";
import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { Bundler, WasmDiagnosticInformation } from "./bundler";
import { ProjectJson } from "./project";

const readProjectJson = (
  projectPath: string
): Pick<ProjectJson, "router" | "module"> => {
  const projectJson = JSON.parse(fs.readFileSync(projectPath, "utf-8"));
  if (!projectJson.router) {
    throw new Error("router not found in project.json");
  }

  return {
    router: String(projectJson.router),
    module: projectJson.module,
  };
};

let crashed: any = false;

let bundler: Bundler | null = null;

export function activate(context: vscode.ExtensionContext) {
  // const workspacePath = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
  // if (!workspacePath) {
  //   throw new Error("No workspace folder found");
  // }
  // const collection = vscode.languages.createDiagnosticCollection("test");
  // const projectPath = path.join(workspacePath, "bff.json");
  // const projectJson = readProjectJson(projectPath);
  // bundler = new Bundler(true);
  // const router = projectJson.router;
  // const entryPoint = path.join(path.dirname(projectPath), router);
  // updateDiagnostics(entryPoint, collection);
  // const watcher = vscode.workspace.createFileSystemWatcher(
  //   new vscode.RelativePattern(workspacePath, "**/*.ts")
  // );
  // const observingExtensions = [".ts", ".tsx", ".d.ts", ".cts", ".mts"];
  // const crashPopup = () =>
  //   vscode.window.showErrorMessage(
  //     `BFF WASM CRASHED. Please reload VSCode. ${crashed}`
  //   );
  // watcher.onDidChange((e) => {
  //   if (crashed) {
  //     crashPopup();
  //     return;
  //   }
  //   console.log("File changed1: ", e.fsPath);
  //   if (!observingExtensions.includes(path.extname(e.fsPath))) {
  //     return;
  //   }
  //   const newContent = fs.readFileSync(e.fsPath, "utf-8");
  //   try {
  //     bundler?.updateFileContent(e.fsPath, newContent);
  //     updateDiagnostics(entryPoint, collection);
  //   } catch (e) {
  //     if (!crashed) {
  //       crashed = e;
  //     }
  //     crashPopup();
  //   }
  // });
  // vscode.workspace.onDidChangeTextDocument((e) => {
  //   if (crashed) {
  //     crashPopup();
  //     return;
  //   }
  //   console.log("File changed2: ", e.document.uri.fsPath);
  //   if (!observingExtensions.includes(path.extname(e.document.uri.fsPath))) {
  //     return;
  //   }
  //   const newContent = e.document.getText();
  //   try {
  //     bundler?.updateFileContent(e.document.uri.fsPath, newContent);
  //     updateDiagnostics(entryPoint, collection);
  //   } catch (e) {
  //     if (!crashed) {
  //       crashed = e;
  //     }
  //     crashPopup();
  //   }
  // });
}

const getFileNameFromDiag = (diag: WasmDiagnosticInformation) => {
  if (diag.KnownFile) {
    return diag.KnownFile.file_name;
  }
  return diag.UnknownFile.current_file;
};

const relatedInformation = (
  cause: WasmDiagnosticInformation
): vscode.DiagnosticRelatedInformation => {
  if (cause.KnownFile) {
    const diag = cause.KnownFile;
    return {
      message: diag.message,
      location: new vscode.Location(
        vscode.Uri.file(diag.file_name),
        new vscode.Range(
          new vscode.Position(diag.line_lo - 1, diag.col_lo),
          new vscode.Position(diag.line_hi - 1, diag.col_hi)
        )
      ),
    };
  } else {
    const diag = cause.UnknownFile;
    return {
      message: diag.message,
      location: new vscode.Location(
        vscode.Uri.file(diag.current_file),
        new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 0))
      ),
    };
  }
};

function updateDiagnostics(
  entryPoint: string,
  collection: vscode.DiagnosticCollection
): void {
  // collection.clear();
  // const diags = bundler?.diagnostics(entryPoint);
  // let acc: Record<string, vscode.Diagnostic[]> = {};
  // const pushDiag = (k: string, v: vscode.Diagnostic) => {
  //   if (acc[k] == null) {
  //     acc[k] = [];
  //   }
  //   acc[k].push(v);
  // };
  // (diags?.diagnostics ?? []).forEach((data) => {
  //   console.log(data);
  //   const cause = data.cause;
  //   if (cause.KnownFile) {
  //     const diag = cause.KnownFile;
  //     pushDiag(getFileNameFromDiag(cause), {
  //       message: diag.message,
  //       range: new vscode.Range(
  //         new vscode.Position(diag.line_lo - 1, diag.col_lo),
  //         new vscode.Position(diag.line_hi - 1, diag.col_hi)
  //       ),
  //       severity: vscode.DiagnosticSeverity.Error,
  //       relatedInformation: (data.related_information ?? []).map(
  //         relatedInformation
  //       ),
  //     });
  //   } else {
  //     const diag = cause.UnknownFile;
  //     pushDiag(diag.current_file, {
  //       message: diag.message,
  //       range: new vscode.Range(
  //         new vscode.Position(0, 0),
  //         new vscode.Position(0, 0)
  //       ),
  //       severity: vscode.DiagnosticSeverity.Error,
  //     });
  //   }
  //   data.related_information?.forEach((related) => {
  //     if (related.KnownFile) {
  //       const diag = related.KnownFile;
  //       pushDiag(getFileNameFromDiag(related), {
  //         message: diag.message,
  //         range: new vscode.Range(
  //           new vscode.Position(diag.line_lo - 1, diag.col_lo),
  //           new vscode.Position(diag.line_hi - 1, diag.col_hi)
  //         ),
  //         severity: vscode.DiagnosticSeverity.Warning,
  //       });
  //     } else {
  //       const diag = related.UnknownFile;
  //       pushDiag(diag.current_file, {
  //         message: diag.message,
  //         range: new vscode.Range(
  //           new vscode.Position(0, 0),
  //           new vscode.Position(0, 0)
  //         ),
  //         severity: vscode.DiagnosticSeverity.Warning,
  //       });
  //     }
  //   });
  // });
  // Object.keys(acc).forEach((k) => {
  //   const documentUri = vscode.Uri.file(k);
  //   collection.set(documentUri, acc[k]);
  // });
}
