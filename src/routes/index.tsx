import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import Editor from "react-simple-code-editor";
// prismjs's default entry registers `markup` (HTML) — no extra component import needed,
// and importing `prismjs/components/prism-markup` directly breaks SSR (expects global Prism).
import Prism from "prismjs";
import {
  Code2,
  Copy,
  Check,
  Columns2,
  Download,
  Eraser,
  FlaskConical,
  Hash,
  Lock,
  MousePointerClick,
  Paintbrush,
  RotateCcw,
  Scissors,
  SquareStack,
  Type,
  Unlock,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  cleanWhitespace,
  countStats,
  slugify,
  stripDomain,
  stripInlineStyles,
  toAPATitleCase,
} from "@/lib/text-tools";


const STARTER_HTML = `<section style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:linear-gradient(180deg,#ffffff,#f4f4fb);padding:72px 24px;text-align:center;color:#0f172a;">
  <div style="max-width:760px;margin:0 auto;">
    <p style="margin:0 0 16px;font-size:13px;letter-spacing:0.14em;text-transform:uppercase;font-weight:700;color:#4f46e5;">New release</p>
    <h1 style="margin:0 0 20px;font-size:48px;line-height:1.1;font-weight:800;letter-spacing:-0.02em;">Ship better pages, faster.</h1>
    <p style="margin:0 auto 36px;font-size:19px;line-height:1.55;color:#475569;max-width:620px;">A drop-in HTML sandbox you can paste into any CMS in seconds.</p>
    <a href="https://example.com/signup" style="display:inline-block;padding:14px 28px;border-radius:10px;background:linear-gradient(135deg,#4f46e5,#a78bfa);color:#ffffff;font-weight:600;font-size:16px;text-decoration:none;box-shadow:0 12px 30px -10px #4f46e580;">Start free trial</a>
  </div>
</section>`;

const STORAGE_KEY = "html-sandbox.v1";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HTML Sandbox — Visual & code editor with text tools" },
      {
        name: "description",
        content:
          "A focused HTML sandbox: visual editor, color-coded code view, domain stripper, slugify, word counter, and APA title case.",
      },
      { property: "og:title", content: "HTML Sandbox" },
      {
        property: "og:description",
        content: "Visual + color-coded HTML editor with domain stripper, slugify, word counter, and APA title case.",
      },
    ],
  }),
  component: SandboxPage,
});

type View = "visual" | "html";

function SandboxPage() {
  const [html, setHtml] = useState(STARTER_HTML);
  const [view, setView] = useState<View>("visual");
  const [editable, setEditable] = useState(true);
  const [copied, setCopied] = useState(false);
  const [domain, setDomain] = useState("");

  // Load/save to localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setHtml(saved);
    } catch {
      /* noop */
    }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, html);
    } catch {
      /* noop */
    }
  }, [html]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(html);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  };

  const handleDownload = () => {
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sandbox.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleStripDomain = () => {
    if (!domain.trim()) return;
    setHtml((prev) => stripDomain(prev, domain));
  };

  const handleReset = () => {
    if (!confirm("Reset sandbox HTML to the starter template?")) return;
    setHtml(STARTER_HTML);
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background text-foreground">
      <header className="flex flex-wrap items-center gap-3 border-b border-border bg-card/40 px-4 py-3 backdrop-blur">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-lg"
          style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
        >
          <FlaskConical className="h-4 w-4 text-primary-foreground" />
        </div>
        <div className="flex flex-col leading-tight">
          <h1 className="text-sm font-semibold">HTML Sandbox</h1>
          <p className="text-xs text-muted-foreground">
            Visual + color-coded HTML editor with handy text utilities.
          </p>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reset
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="mr-1.5 h-3.5 w-3.5" /> .html
          </Button>
          <Button size="sm" onClick={handleCopy} className="min-w-[110px]">
            {copied ? (
              <>
                <Check className="mr-1.5 h-3.5 w-3.5" /> Copied
              </>
            ) : (
              <>
                <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy HTML
              </>
            )}
          </Button>
        </div>
      </header>

      <DomainStripper domain={domain} setDomain={setDomain} onStrip={handleStripDomain} />

      <TextTools />

      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-card/20 px-4 py-2.5">
        <span className="inline-flex items-center gap-1 rounded border border-primary/50 bg-primary/15 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-primary">
          <FlaskConical className="h-3 w-3" /> Sandbox
        </span>
        <button
          type="button"
          onClick={() => setEditable((v) => !v)}
          className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wider transition-colors ${
            editable
              ? "border-primary/50 bg-primary/15 text-primary"
              : "border-border bg-secondary/70 text-muted-foreground hover:text-foreground"
          }`}
        >
          {editable ? (
            <>
              <Unlock className="h-3 w-3" /> Editing
            </>
          ) : (
            <>
              <Lock className="h-3 w-3" /> Locked
            </>
          )}
        </button>

        <Tabs value={view} onValueChange={(v) => setView(v as View)} className="ml-auto">
          <TabsList className="bg-secondary">
            <TabsTrigger
              value="visual"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <MousePointerClick className="mr-1 h-3.5 w-3.5" /> Visual
            </TabsTrigger>
            <TabsTrigger
              value="html"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Code2 className="mr-1 h-3.5 w-3.5" /> HTML
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <main className="flex-1 overflow-auto bg-background p-4">
        {view === "visual" ? (
          <VisualEditor html={html} editable={editable} onChange={setHtml} />
        ) : (
          <CodeEditor html={html} editable={editable} onChange={setHtml} />
        )}
      </main>
    </div>
  );
}

function DomainStripper({
  domain,
  setDomain,
  onStrip,
}: {
  domain: string;
  setDomain: (v: string) => void;
  onStrip: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border bg-card/30 px-4 py-2">
      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        <Scissors className="h-3.5 w-3.5" /> Strip domain
      </span>
      <Input
        value={domain}
        onChange={(e) => setDomain(e.target.value)}
        placeholder="example.com"
        className="h-8 max-w-xs"
        onKeyDown={(e) => {
          if (e.key === "Enter") onStrip();
        }}
      />
      <Button size="sm" variant="outline" className="h-8" onClick={onStrip} disabled={!domain.trim()}>
        <Eraser className="mr-1.5 h-3.5 w-3.5" /> Remove from HTML
      </Button>
      <span className="text-[11px] text-muted-foreground">
        Removes the domain (with optional <code>https://</code> and <code>www.</code>) from URLs in the HTML.
      </span>
    </div>
  );
}

function TextTools() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [outputLabel, setOutputLabel] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const stats = useMemo(() => countStats(input), [input]);

  const runSlug = () => {
    setOutput(slugify(input));
    setOutputLabel("Slug");
  };
  const runAPA = () => {
    setOutput(toAPATitleCase(input));
    setOutputLabel("APA title case");
  };
  const runCounts = () => {
    const s = countStats(input);
    setOutput(
      `Words: ${s.words}\nCharacters: ${s.chars}\nCharacters (no spaces): ${s.charsNoSpaces}\nSentences: ${s.sentences}\nReading time: ~${s.readingMin} min`,
    );
    setOutputLabel("Word count");
  };

  const copyOutput = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* noop */
    }
  };

  return (
    <div className="border-b border-border bg-card/30 px-4 py-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <Wand2 className="h-3.5 w-3.5" /> Text tools
        </span>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste text here — then run a tool on it…"
            className="min-h-[110px] text-xs"
          />
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded bg-secondary/60 px-1.5 py-0.5">
              <Type className="h-3 w-3" /> {stats.words} words
            </span>
            <span className="inline-flex items-center gap-1 rounded bg-secondary/60 px-1.5 py-0.5">
              <Hash className="h-3 w-3" /> {stats.chars} chars
            </span>
            <span className="inline-flex items-center gap-1 rounded bg-secondary/60 px-1.5 py-0.5">
              <Scissors className="h-3 w-3" /> {stats.charsNoSpaces} no-spaces
            </span>
            <span className="inline-flex items-center gap-1 rounded bg-secondary/60 px-1.5 py-0.5">
              <FlaskConical className="h-3 w-3" /> {stats.sentences} sentences
            </span>
            <span className="inline-flex items-center gap-1 rounded bg-secondary/60 px-1.5 py-0.5">
              <Wand2 className="h-3 w-3" /> ~{stats.readingMin} min read
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={runSlug} disabled={!input}>
              <Hash className="mr-1.5 h-3.5 w-3.5" /> Slugify
            </Button>
            <Button size="sm" variant="outline" onClick={runCounts} disabled={!input}>
              <Type className="mr-1.5 h-3.5 w-3.5" /> Word count
            </Button>
            <Button size="sm" variant="outline" onClick={runAPA} disabled={!input}>
              <Wand2 className="mr-1.5 h-3.5 w-3.5" /> APA title case
            </Button>
          </div>
          <div className="relative flex-1">
            {outputLabel && (
              <div className="absolute right-2 top-1 z-10 flex items-center gap-1">
                <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-primary">
                  {outputLabel}
                </span>
                <button
                  type="button"
                  onClick={copyOutput}
                  className="inline-flex items-center gap-1 rounded border border-border bg-background/80 px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-foreground"
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            )}
            <Textarea
              value={output}
              readOnly
              placeholder="Output will appear here…"
              className="min-h-[110px] bg-secondary/40 font-mono text-xs"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function VisualEditor({
  html,
  editable,
  onChange,
}: {
  html: string;
  editable: boolean;
  onChange: (v: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const lastExternal = useRef(html);

  useEffect(() => {
    if (!ref.current) return;
    if (html !== lastExternal.current || ref.current.innerHTML !== html) {
      ref.current.innerHTML = html;
      lastExternal.current = html;
    }
  }, [html]);

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
      {!editable && (
        <div className="flex items-center gap-2 border-b border-border bg-secondary/40 px-3 py-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
          <Lock className="h-3 w-3" /> Read-only preview
        </div>
      )}
      <div
        ref={ref}
        contentEditable={editable}
        suppressContentEditableWarning
        onInput={(e) => {
          const next = (e.target as HTMLDivElement).innerHTML;
          lastExternal.current = next;
          onChange(next);
        }}
        className={`min-h-[520px] bg-white text-black outline-none ${
          editable ? "ring-1 ring-primary/30 ring-inset" : ""
        }`}
        style={{ caretColor: "#4f46e5" }}
      />
    </div>
  );
}

function CodeEditor({
  html,
  editable,
  onChange,
}: {
  html: string;
  editable: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-[#0b1020] shadow-sm">
      {!editable && (
        <div className="flex items-center gap-2 border-b border-border bg-secondary/40 px-3 py-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
          <Lock className="h-3 w-3" /> Read-only
        </div>
      )}
      <Editor
        value={html}
        onValueChange={(v) => editable && onChange(v)}
        highlight={(code) => Prism.highlight(code, Prism.languages.markup, "markup")}
        padding={16}
        readOnly={!editable}
        className="prism-html-editor min-h-[520px] font-mono text-xs"
        style={{
          fontFamily:
            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
          color: "#e2e8f0",
          backgroundColor: "transparent",
          caretColor: "#a5b4fc",
        }}
      />
    </div>
  );
}
