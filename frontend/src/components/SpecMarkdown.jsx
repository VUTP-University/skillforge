import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CodeMirror from "@uiw/react-codemirror";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { python } from "@codemirror/lang-python";
import { javascript } from "@codemirror/lang-javascript";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";

/* Contract spec renderer — the same Markdown prose as Job descriptions, but
   fenced code blocks (the API signatures, examples) render as read-only,
   syntax-highlighted CodeMirror views instead of plain <pre> text. */

const LANG_EXT = {
  python:     () => [python()],
  py:         () => [python()],
  javascript: () => [javascript({ jsx: false })],
  js:         () => [javascript({ jsx: false })],
  java:       () => [java()],
  csharp:     () => [java()],
  cs:         () => [java()],
  cpp:        () => [cpp()],
  "c++":      () => [cpp()],
};

function CodeBlock({ code, lang }) {
  const ext = LANG_EXT[lang] ?? LANG_EXT.python;  // unlabelled blocks: contracts are Python
  return (
    <div style={{ margin: "0.9rem 0", borderRadius: "8px", overflow: "hidden", border: "1px solid var(--color-border-2)" }}>
      <CodeMirror
        value={code}
        theme={vscodeDark}
        extensions={ext()}
        editable={false}
        readOnly
        style={{ fontSize: "0.79rem" }}
        basicSetup={{ lineNumbers: false, foldGutter: false, highlightActiveLine: false, highlightActiveLineGutter: false }}
      />
    </div>
  );
}

const components = {
  // react-markdown wraps block code in <pre><code>; CodeBlock draws its own frame.
  pre: ({ children }) => <>{children}</>,
  code: ({ className, children }) => {
    const text  = String(children ?? "");
    const match = /language-([\w+#-]+)/.exec(className ?? "");
    const block = !!match || text.includes("\n");
    if (!block) return <code className={className}>{children}</code>;
    return <CodeBlock code={text.replace(/\n$/, "")} lang={(match?.[1] ?? "").toLowerCase()} />;
  },
};

export default function SpecMarkdown({ children }) {
  return (
    <div className="job-desc-prose">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
