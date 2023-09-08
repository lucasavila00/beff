import React, { FC, useRef, useState, useEffect } from "react";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import styles from "./Editor.module.css";
import * as wasm from "../pkg";

const router1 = `type RootResponse = { Hello: string };
type ItemsResponse = { item_id: string; q?: string };

export default {
  "/": {
    get: async (): Promise<RootResponse> => {
      return { Hello: "World" };
    },
  },
  "/items/{item_id}": {
    get: (c: Ctx, item_id: string, q?: string): ItemsResponse => {
      return { item_id, q };
    },
  },
};











































// Context must be imported from the runtime, ie: import { Ctx } from "@beff/hono";
// but this demo does not support imports or dependencies.
type Ctx = any;
`;

(globalThis as any).resolve_import = () => {
  throw new Error("resolve_import not implemented");
};
(globalThis as any).emit_diagnostic = console.log;
(globalThis as any).read_file_content = (file_name: string) => {
  if (file_name === "router.ts") {
    return router1;
  }

  throw new Error("read_file_content not implemented");
};

type WritableModules = {
  js_validators: string;
  js_server_meta: string | undefined;
  js_client_meta: string | undefined;
  json_schema: string | undefined;
  js_built_parsers: string | undefined;
};

export const Editor: FC = () => {
  const [editor, setEditor] =
    useState<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoEl = useRef(null);
  const [schema, setSchema] = useState<{ schema: unknown } | null>(null);

  useEffect(() => {
    if (monacoEl) {
      setEditor((editor) => {
        if (editor) return editor;
        wasm.init(true);
        const res: WritableModules = wasm.bundle_to_string("router.ts", "");
        try {
          if (res.json_schema != null) {
            setSchema({
              schema: JSON.parse(res.json_schema),
            });
          }
        } catch (e) {
          console.error(e);
        }
        return monaco.editor.create(monacoEl.current!, {
          value: router1,
          language: "typescript",
        });
      });
    }

    return () => editor?.dispose();
  }, [monacoEl.current]);

  console.log(schema);

  return (
    <div>
      <div className={styles.Editor} ref={monacoEl}></div>
      <div className={styles.Editor}></div>
    </div>
  );
};
