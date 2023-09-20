import React from "react";
import { createRoot } from "react-dom/client";
import { Editor } from "./components/Editor";
import "./userWorker";
import "./normalize.css";

const container = document.getElementById("root");
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <Editor />
  </React.StrictMode>
);
