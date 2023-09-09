import React, { FC, useRef, useState, useEffect } from "react";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import styles from "./Editor.module.css";
import * as wasm from "../pkg";
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

const router1 = `/**
* @title My API
* @version 1.0.0
* This is a sample server. Try changing me.
*/
export default {
 "/": {
   /**
    * @summary This is the summary or description of the endpoint
    * You can add its description here.
    */
   get: (c: Ctx, query_parameter: number) => {
     return { Hello: "World" };
   },
   post: (c: Ctx, requestBody: { a: string }) => {
     return { ok: true };
   },
 },
 "/items/{item_id}": {
   get: (
     c: Ctx,
     /**
      * This is a description of a parameter.
      */
     item_id: string,
     q?: string
   ) => {
     return { item_id, q };
   },
 },
};
















































// Context must be imported from the runtime, ie: import { Ctx } from "@beff/hono";
// but this demo does not support imports or dependencies.
type Ctx = any;
`;

(globalThis as any).resolve_import = () => {
  console.error("resolve_import not implemented");
  return undefined;
};

(globalThis as any).read_file_content = (file_name: string) => {
  if (file_name === "router.ts") {
    return router1;
  }

  console.error("read_file_content not implemented");
  return undefined;
};

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

const parseSchema = (json_schema: string | undefined): unknown => {
  try {
    if (json_schema != null) {
      return JSON.parse(json_schema);
    }
  } catch (e) {
    console.error(e);
  }
};

export const Editor: FC = () => {
  const [editor, setEditor] =
    useState<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoEl = useRef(null);
  const [schema, setSchema] = useState<string | undefined>(undefined);

  const updateContent = () => {
    const res: WritableModules | undefined = wasm.bundle_to_string(
      "router.ts",
      ""
    );
    if (res != null) {
      let m = editor?.getModel();
      if (m != null) {
        monaco.editor.setModelMarkers(m, "beff", []);
      }
    }
    setSchema((old) => res?.json_schema ?? old);
  };
  useEffect(() => {
    if (monacoEl) {
      setEditor((editor) => {
        if (editor) return editor;
        wasm.init(false);

        const e = monaco.editor.create(monacoEl.current!, {
          value: router1,
          language: "typescript",
          minimap: { enabled: false },
        });
        (globalThis as any).emit_diagnostic = (it: WasmDiagnostic) => {
          console.log(it);
          let m = e.getModel();

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
        return e;
      });
    }

    return () => editor?.dispose();
  }, [monacoEl.current]);

  useEffect(() => {
    updateContent();

    const disposable = editor?.onDidChangeModelContent(() => {
      const text = editor?.getValue();
      if (text != null) {
        wasm.update_file_content("router.ts", text);
        updateContent();
      }
    });

    return () => disposable?.dispose();
  }, [editor]);

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
