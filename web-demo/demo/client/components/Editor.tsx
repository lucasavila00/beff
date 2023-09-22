import React, { FC, useRef, useState, useEffect } from "react";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import styles from "./Editor.module.css";
import * as wasm from "../../pkg";
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";
import { initialText } from "./initialText";

type WritableModules = {
  js_validators: string;
  js_server_meta: string | undefined;
  js_client_meta: string | undefined;
  json_schema: string | undefined;
  js_built_parsers: string | undefined;
};

type KnownFile = {
  message: string;
  file_name: string;

  line_lo: number;
  col_lo: number;
  line_hi: number;
  col_hi: number;
};
type UnknownFile = {
  message: string;
  current_file: string;
};
type WasmDiagnosticInformation =
  | { KnownFile: KnownFile; UnknownFile?: never }
  | { UnknownFile: UnknownFile; KnownFile?: never };

type WasmDiagnosticItem = {
  cause: WasmDiagnosticInformation;
  related_information: WasmDiagnosticInformation[] | undefined;
  message?: string;
};
type WasmDiagnostic = {
  diagnostics: WasmDiagnosticItem[];
};

type BundleToStringResult =
  | {
      _tag: "WasmDiagnostic";

      data: WasmDiagnostic;
    }
  | {
      _tag: "WritableModules";
      data: WritableModules;
    };

const parseSchema = (json_schema: string | undefined): unknown => {
  try {
    if (json_schema != null) {
      return JSON.parse(json_schema);
    }
  } catch (e) {
    console.error(e);
  }
};

const useEditorState = () => {
  const [editor, setEditor] =
    useState<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoEl = useRef(null);
  const [schema, setSchema] = useState<string | undefined>(undefined);

  const emit_diagnostic = (it: WasmDiagnostic) => {
    console.log(it);
    let m = editor?.getModel();

    if (m != null) {
      monaco.editor.setModelMarkers(
        m,
        "beff",
        it.diagnostics.flatMap((d) => {
          if (d.cause.KnownFile == null) {
            return [];
          }
          return [
            {
              startLineNumber: d.cause.KnownFile.line_lo,
              startColumn: d.cause.KnownFile.col_lo,
              endLineNumber: d.cause.KnownFile.line_hi,
              endColumn: d.cause.KnownFile.col_hi,
              message: d.cause.KnownFile.message,
              severity: monaco.MarkerSeverity.Error,
            },
          ];
        })
      );
    }
  };

  const updateContent = (new_content: string) => {
    const res: BundleToStringResult | string =
      wasm.bundle_to_string(new_content);
    if (typeof res === "string") {
      console.error(res);
      return;
    }
    if (res._tag === "WritableModules") {
      setSchema(res.data.json_schema);
      emit_diagnostic({ diagnostics: [] });
      return;
    }
    if (res._tag === "WasmDiagnostic") {
      emit_diagnostic(res.data);
      return;
    }
    console.error(res);
    throw new Error("unreachable");
  };
  useEffect(() => {
    if (monacoEl) {
      setEditor((editor) => {
        if (editor) return editor;
        wasm.init(false);

        const e = monaco.editor.create(monacoEl.current!, {
          value: initialText,
          language: "typescript",
          minimap: { enabled: false },
        });

        return e;
      });
    }

    return () => editor?.dispose();
  }, [monacoEl.current]);

  useEffect(() => {
    updateContent(initialText);

    const disposable = editor?.onDidChangeModelContent(() => {
      const text = editor?.getValue();
      if (text != null) {
        updateContent(text);
      }
    });

    return () => disposable?.dispose();
  }, [editor]);

  return {
    monacoEl,
    schema,
  };
};

export const Editor: FC = () => {
  const { monacoEl, schema } = useEditorState();

  const parsedSchema = parseSchema(schema);
  return (
    <div
      style={{
        display: "flex",
      }}
    >
      <div className={styles.Editor} ref={monacoEl}></div>
      <div className={styles.Docs}>
        {parsedSchema != null && <SwaggerUI spec={parsedSchema} />}
      </div>
    </div>
  );
};
