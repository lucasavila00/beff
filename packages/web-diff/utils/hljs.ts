import hljs from "highlight.js/lib/core";
import typescript from "highlight.js/lib/languages/typescript";
import json from "highlight.js/lib/languages/json";
import "highlight.js/styles/atom-one-dark.css";

hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("json", json);

export { hljs };
