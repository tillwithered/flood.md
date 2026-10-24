import { Fragment, useEffect, useRef, useState, type CSSProperties } from "react";
import { Check, Copy, FileCode2 } from "lucide-react";
import { Button, IconSlot } from "@flood-md/react";
import type { HighlighterCore, ThemedToken } from "shiki/core";
import "./code-block.css";

const theme = "github-dark-default";
const languageLoaders = {
  tsx: () => import("shiki/langs/tsx.mjs"),
  jsx: () => import("shiki/langs/jsx.mjs"),
  typescript: () => import("shiki/langs/typescript.mjs"),
  javascript: () => import("shiki/langs/javascript.mjs"),
  css: () => import("shiki/langs/css.mjs"),
  json: () => import("shiki/langs/json.mjs"),
  shellscript: () => import("shiki/langs/bash.mjs"),
  markdown: () => import("shiki/langs/markdown.mjs"),
};
type SupportedLanguage = keyof typeof languageLoaders;
const languageAliases: Record<string, SupportedLanguage> = {
  tsx: "tsx", jsx: "jsx", ts: "typescript", typescript: "typescript",
  js: "javascript", javascript: "javascript", css: "css", json: "json",
  sh: "shellscript", bash: "shellscript", shell: "shellscript", shellscript: "shellscript",
  md: "markdown", markdown: "markdown",
};
const languageLabels: Record<SupportedLanguage, string> = {
  tsx: "TSX", jsx: "JSX", typescript: "TypeScript", javascript: "JavaScript",
  css: "CSS", json: "JSON", shellscript: "Shell", markdown: "Markdown",
};

let highlighterPromise: Promise<HighlighterCore> | undefined;
const languagePromises = new Map<SupportedLanguage, Promise<void>>();

/** A single local engine; Vite splits only these explicitly listed grammars. */
function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = Promise.all([
      import("shiki/core"),
      import("shiki/engine/oniguruma"),
      import("shiki/themes/github-dark-default.mjs"),
    ]).then(([core, engine, selectedTheme]) => core.createHighlighterCore({
      themes: [selectedTheme.default],
      langs: [],
      engine: engine.createOnigurumaEngine(import("shiki/wasm")),
    })).catch((error: unknown) => {
      highlighterPromise = undefined;
      throw error;
    });
  }
  return highlighterPromise;
}

async function tokenize(code: string, language: SupportedLanguage) {
  const highlighter = await getHighlighter();
  let pending = languagePromises.get(language);
  if (!pending) {
    pending = highlighter.loadLanguage(languageLoaders[language]()).catch((error: unknown) => {
      languagePromises.delete(language);
      throw error;
    });
    languagePromises.set(language, pending);
  }
  await pending;
  return highlighter.codeToTokens(code, { lang: language, theme }).tokens;
}

function tokenStyle(token: ThemedToken): CSSProperties {
  const font = Math.max(0, token.fontStyle ?? 0);
  const decoration = [font & 4 ? "underline" : "", font & 8 ? "line-through" : ""].filter(Boolean).join(" ");
  return {
    color: token.color,
    fontStyle: font & 1 ? "italic" : undefined,
    fontWeight: font & 2 ? 700 : undefined,
    textDecoration: decoration || undefined,
  };
}

export interface CopyButtonProps {
  value: string;
  label?: string;
}

/** Copies the original value, independently of highlighted/rendered output. */
export function CopyButton({ value, label = "Copy code" }: CopyButtonProps) {
  const [state, setState] = useState<"idle" | "copying" | "copied" | "failed">("idle");
  const mounted = useRef(true);
  const operation = useRef(0);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      operation.current++;
      if (resetTimer.current !== null) clearTimeout(resetTimer.current);
    };
  }, []);
  useEffect(() => {
    operation.current++;
    setState("idle");
    if (resetTimer.current !== null) clearTimeout(resetTimer.current);
  }, [value]);

  async function copy() {
    if (state === "copying") return;
    const current = ++operation.current;
    if (resetTimer.current !== null) clearTimeout(resetTimer.current);
    setState("copying");
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(value);
      if (!mounted.current || current !== operation.current) return;
      setState("copied");
      resetTimer.current = setTimeout(() => {
        if (mounted.current && current === operation.current) setState("idle");
      }, 2200);
    } catch {
      if (mounted.current && current === operation.current) setState("failed");
    }
  }

  const announcement = state === "copied" ? "Copied to clipboard."
    : state === "failed" ? "Copy unavailable. Select the code and copy it manually." : "";
  return (
    <span className="site-copy-control">
      <Button className="site-copy-control__button" variant="ghost" size="sm" loading={state === "copying"}
        aria-label={label} onClick={copy}>
        {state !== "copying" && <IconSlot size="sm">{state === "copied" ? <Check /> : <Copy />}</IconSlot>}
        Copy
      </Button>
      <span role="status" className={state === "failed" ? "site-copy-control__error" : "site-code-visually-hidden"}>
        {announcement}
      </span>
    </span>
  );
}

export interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  label?: string;
}

export function CodeBlock({ code, language = "plaintext", filename, label = "Code example" }: CodeBlockProps) {
  const normalizedLanguage = language.toLowerCase().trim();
  const canonical = Object.hasOwn(languageAliases, normalizedLanguage) ? languageAliases[normalizedLanguage] : undefined;
  const displayLanguage = canonical ? languageLabels[canonical] : "Plain text";
  const [highlighted, setHighlighted] = useState<{ code: string; language: string; tokens: ThemedToken[][] } | null>(null);

  useEffect(() => {
    let active = true;
    if (canonical) {
      void tokenize(code, canonical).then((tokens) => {
        if (active) setHighlighted({ code, language: canonical, tokens });
      }).catch(() => {
        // The unmodified plain code remains readable if a local chunk/engine fails.
        if (active) setHighlighted(null);
      });
    }
    return () => { active = false; };
  }, [code, canonical]);

  const tokens = highlighted?.code === code && highlighted.language === canonical ? highlighted.tokens : null;
  return (
    <figure className="site-code-block" aria-label={label} data-language={canonical ?? "plaintext"} data-highlighted={tokens ? "true" : "false"}>
      <figcaption className="site-code-block__toolbar">
        <span className="site-code-block__identity">
          <IconSlot size="sm"><FileCode2 /></IconSlot>
          <span className="site-code-block__filename">{filename || displayLanguage}</span>
          {filename && <span className="site-code-block__language">{displayLanguage}</span>}
        </span>
        <CopyButton value={code} />
      </figcaption>
      <pre className="site-code-block__pre" tabIndex={0} role="group" aria-label={filename ? `${filename} source code` : `${displayLanguage} source code`}>
        <code className="site-code-block__code">{tokens ? tokens.map((line, lineIndex) => (
          <Fragment key={lineIndex}>
            <span className="site-code-block__line">{line.map((token, tokenIndex) => (
              <span key={tokenIndex} className="site-code-block__token" style={tokenStyle(token)}>{token.content}</span>
            ))}</span>
            {lineIndex < tokens.length - 1 ? "\n" : null}
          </Fragment>
        )) : code}</code>
      </pre>
    </figure>
  );
}
