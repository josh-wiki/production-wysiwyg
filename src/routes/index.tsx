import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Editor from "react-simple-code-editor";
// prismjs's default entry registers `markup` (HTML) — no extra component import needed,
// and importing `prismjs/components/prism-markup` directly breaks SSR (expects global Prism).
import Prism from "prismjs";
import {
  Code2,
  Copy,
  Check,
  ChevronDown,
  Columns2,
  Download,
  Eraser,
  Pencil,
  Plus,
  Trash2,
  FlaskConical,
  Hash,
  Lock,
  MousePointerClick,
  Paintbrush,
  Replace,
  RotateCcw,
  Scissors,
  SquareStack,
  Type,
  Undo2,
  Redo2,
  Unlock,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  cleanWhitespace,
  countStats,
  slugify,
  stripDirLtr,
  stripDomain,
  stripInlineStyles,
  stripSpans,
  toAPATitleCase,
} from "@/lib/text-tools";


const STARTER_HTML = "";

type Snippet = { label: string; html: string };

const DEFAULT_SNIPPETS: Snippet[] = [
  {
    label: "Page",
    html: `<div style="max-width: 1400px; margin: auto; padding: 5px;">\n\n</div>`,
  },
  {
    label: "Post",
    html: `<div style="max-width: 1000px; margin: auto; padding: 5px;">\n\n</div>`,
  },
  {
    label: "Img",
    html: `<div style="width: 100%; height: 100%; min-height: 100%; overflow: hidden; display: flex; justify-content: center; align-items: center;">\n  <img src="[replace]" alt="[replace]" style="width: 100%; height: 100%; object-fit: cover;">\n</div>`,
  },
];

const SNIPPETS_KEY = "html-sandbox.snippets.v1";

const ctaSnippet = (bg: string, text: string) =>
  `<div style="text-align: center; display: flex; flex-wrap: wrap; justify-content: center;"><a class="btn btn-primary" href="[replace]" style="text-decoration: none; border: none; box-shadow: none; margin: 10px; color: ${text}; background-color: ${bg}; min-width: fit-content; padding: 10px 20px; flex: 1 1 auto;">View Inventory</a> <a class="btn btn-primary" href="[replace]" style="text-decoration: none; border: none; box-shadow: none; margin: 10px; color: ${text}; background-color: ${bg}; min-width: fit-content; padding: 10px 20px; flex: 1 1 auto;">Financing</a> <a class="btn btn-primary" href="[replace]" style="text-decoration: none; border: none; box-shadow: none; margin: 10px; color: ${text}; background-color: ${bg}; min-width: fit-content; padding: 10px 20px; flex: 1 1 auto;">About Us</a></div>`;

const STORAGE_KEY = "html-sandbox.v2";

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

type View = "visual" | "html" | "split";

// ---------- History (undo/redo) ----------
function useHistory<T>(initial: T, limit = 100) {
  const [state, setState] = useState<T>(initial);
  const past = useRef<T[]>([]);
  const future = useRef<T[]>([]);
  const isTimeTravel = useRef(false);

  const set = useCallback((next: T | ((prev: T) => T)) => {
    setState((prev) => {
      const value = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      if (Object.is(value, prev)) return prev;
      if (!isTimeTravel.current) {
        past.current.push(prev);
        if (past.current.length > limit) past.current.shift();
        future.current = [];
      }
      isTimeTravel.current = false;
      return value;
    });
  }, [limit]);

  const undo = useCallback(() => {
    setState((prev) => {
      if (past.current.length === 0) return prev;
      const previous = past.current.pop()!;
      future.current.push(prev);
      isTimeTravel.current = true;
      return previous;
    });
  }, []);

  const redo = useCallback(() => {
    setState((prev) => {
      if (future.current.length === 0) return prev;
      const next = future.current.pop()!;
      past.current.push(prev);
      isTimeTravel.current = true;
      return next;
    });
  }, []);

  // Replace value silently (used for localStorage hydration without polluting history)
  const reset = useCallback((value: T) => {
    past.current = [];
    future.current = [];
    isTimeTravel.current = true;
    setState(value);
  }, []);

  return { state, set, undo, redo, reset };
}

function SandboxPage() {
  const { state: html, set: setHtml, undo, redo, reset: resetHtml } = useHistory<string>(STARTER_HTML);
  const [view, setView] = useState<View>("visual");
  const [editable, setEditable] = useState(true);
  const [copied, setCopied] = useState(false);
  const [domain, setDomain] = useState("");
  const [ctaColor, setCtaColor] = useState("#000000");
  const [ctaTextColor, setCtaTextColor] = useState("#ffffff");
  const [snippets, setSnippets] = useState<Snippet[]>(DEFAULT_SNIPPETS);
  const [editSnippets, setEditSnippets] = useState(false);

  // Track caret position in the HTML code editor for insert-at-cursor
  const codeCaretRef = useRef<number | null>(null);
  const codeTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SNIPPETS_KEY);
      if (saved) setSnippets(JSON.parse(saved));
    } catch {
      /* noop */
    }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(SNIPPETS_KEY, JSON.stringify(snippets));
    } catch {
      /* noop */
    }
  }, [snippets]);

  const updateSnippet = (i: number, patch: Partial<Snippet>) =>
    setSnippets((arr) => arr.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  const deleteSnippet = (i: number) =>
    setSnippets((arr) => arr.filter((_, idx) => idx !== i));
  const addSnippet = () =>
    setSnippets((arr) => [...arr, { label: "New", html: "" }]);
  const resetSnippets = () => {
    if (confirm("Reset snippets to defaults?")) setSnippets(DEFAULT_SNIPPETS);
  };

  // Load/save to localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) resetHtml(saved);
    } catch {
      /* noop */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, html);
    } catch {
      /* noop */
    }
  }, [html]);

  // Global keyboard shortcuts for undo/redo
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const key = e.key.toLowerCase();
      if (key === "z" && !e.shiftKey) {
        // Let the native textarea handle its own undo when it's focused
        const t = e.target as HTMLElement | null;
        if (t && (t.tagName === "TEXTAREA" || t.tagName === "INPUT" || t.isContentEditable)) return;
        e.preventDefault();
        undo();
      } else if ((key === "z" && e.shiftKey) || key === "y") {
        const t = e.target as HTMLElement | null;
        if (t && (t.tagName === "TEXTAREA" || t.tagName === "INPUT" || t.isContentEditable)) return;
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

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
    if (!confirm("Clear the sandbox HTML?")) return;
    setHtml(STARTER_HTML);
  };

  const insertSnippet = (snippet: string) => {
    // Insert at the code editor caret when we have one and the code editor is visible
    const pos = codeCaretRef.current;
    const codeVisible = view === "html" || view === "split";
    if (codeVisible && pos !== null) {
      setHtml((prev) => {
        const safe = Math.max(0, Math.min(pos, prev.length));
        return prev.slice(0, safe) + snippet + prev.slice(safe);
      });
      // Move caret to end of inserted snippet
      const newPos = (pos ?? 0) + snippet.length;
      codeCaretRef.current = newPos;
      requestAnimationFrame(() => {
        const ta = codeTextareaRef.current;
        if (ta) {
          ta.focus();
          try {
            ta.setSelectionRange(newPos, newPos);
          } catch {
            /* noop */
          }
        }
      });
      return;
    }
    setHtml((prev) => (prev.trim() ? `${prev}\n${snippet}` : snippet));
  };

  // Compute [replace] token count for badge
  const replaceCount = useMemo(() => (html.match(/\[replace\]/g) || []).length, [html]);

  const applyReplacements = (values: string[]) => {
    setHtml((prev) => {
      let i = 0;
      return prev.replace(/\[replace\]/g, () => {
        const v = values[i++];
        return v != null && v !== "" ? v : "[replace]";
      });
    });
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
      </header>

      <CollapsibleSection title="Clean & actions" icon={<Eraser className="h-3.5 w-3.5" />}>
        <div className="flex flex-wrap items-center gap-2 px-4 py-2.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setHtml((prev) => stripInlineStyles(prev))}
            title="Remove all inline style attributes"
          >
            <Paintbrush className="mr-1.5 h-3.5 w-3.5" /> Clean styles
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setHtml((prev) => stripSpans(prev))}
            title="Unwrap all <span> tags"
          >
            <Eraser className="mr-1.5 h-3.5 w-3.5" /> Clean spans
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setHtml((prev) => cleanWhitespace(prev))}
            title="Collapse blank lines and extra spaces"
          >
            <SquareStack className="mr-1.5 h-3.5 w-3.5" /> Clean spaces
          </Button>
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
      </CollapsibleSection>

      <CollapsibleSection title="Strip domain" icon={<Scissors className="h-3.5 w-3.5" />}>
        <DomainStripper domain={domain} setDomain={setDomain} onStrip={handleStripDomain} />
      </CollapsibleSection>

      <CollapsibleSection title="Text tools" icon={<Wand2 className="h-3.5 w-3.5" />}>
        <TextTools />
      </CollapsibleSection>

      <CollapsibleSection
        title={`Fill [replace] tokens${replaceCount ? ` (${replaceCount})` : ""}`}
        icon={<Replace className="h-3.5 w-3.5" />}
        defaultOpen={replaceCount > 0}
      >
        <ReplaceTokens count={replaceCount} onApply={applyReplacements} />
      </CollapsibleSection>

      <CollapsibleSection
        title="Insert snippets"
        icon={<SquareStack className="h-3.5 w-3.5" />}
        defaultOpen
      >
        <div className="flex flex-wrap items-center gap-2 px-4 py-2.5">
          {snippets.map((s, i) => (
            <Button
              key={i}
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => insertSnippet(s.html)}
              title={`Insert ${s.label} snippet at cursor`}
            >
              {s.label}
            </Button>
          ))}
          <span className="mx-1 h-5 w-px bg-border" />
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Background
            </span>
            <div className="flex items-center gap-1.5">
              <input
                type="color"
                value={ctaColor}
                onChange={(e) => setCtaColor(e.target.value)}
                className="h-7 w-8 cursor-pointer rounded border border-border bg-transparent p-0"
                title="CTA background color"
              />
              <Input
                value={ctaColor}
                onChange={(e) => setCtaColor(e.target.value)}
                className="h-8 w-24 px-2 font-mono text-xs"
                placeholder="#000000"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Text
            </span>
            <div className="flex items-center gap-1.5">
              <input
                type="color"
                value={ctaTextColor}
                onChange={(e) => setCtaTextColor(e.target.value)}
                className="h-7 w-8 cursor-pointer rounded border border-border bg-transparent p-0"
                title="CTA text color"
              />
              <Input
                value={ctaTextColor}
                onChange={(e) => setCtaTextColor(e.target.value)}
                className="h-8 w-24 px-2 font-mono text-xs"
                placeholder="#ffffff"
              />
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => insertSnippet(ctaSnippet(ctaColor, ctaTextColor))}
            title="Insert CTAs with chosen colors"
          >
            CTAs
          </Button>
          <span className="mx-1 h-5 w-px bg-border" />
          <Button
            variant={editSnippets ? "default" : "ghost"}
            size="sm"
            className="h-8"
            onClick={() => setEditSnippets((v) => !v)}
            title="Edit snippet buttons"
          >
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            {editSnippets ? "Done" : "Edit"}
          </Button>
          <span className="ml-2 text-[11px] text-muted-foreground">
            Inserts at cursor when HTML/Split view is active.
          </span>
        </div>
        {editSnippets && (
          <div className="flex flex-col gap-2 border-t border-border bg-background/40 px-4 py-3">
            {snippets.map((s, i) => (
              <div key={i} className="flex flex-col gap-1.5 rounded border border-border bg-card/40 p-2">
                <div className="flex items-center gap-2">
                  <Input
                    value={s.label}
                    onChange={(e) => updateSnippet(i, { label: e.target.value })}
                    className="h-7 max-w-[180px] text-xs"
                    placeholder="Label"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto h-7 text-destructive hover:text-destructive"
                    onClick={() => deleteSnippet(i)}
                    title="Delete snippet"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <Textarea
                  value={s.html}
                  onChange={(e) => updateSnippet(i, { html: e.target.value })}
                  className="min-h-[80px] font-mono text-xs"
                  placeholder="HTML snippet…"
                />
              </div>
            ))}
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" className="h-8" onClick={addSnippet}>
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Add snippet
              </Button>
              <Button variant="ghost" size="sm" className="h-8" onClick={resetSnippets}>
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reset to defaults
              </Button>
            </div>
          </div>
        )}
      </CollapsibleSection>

      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-card/20 px-4 py-2.5">
        <div className="ml-auto flex flex-wrap items-center gap-2">
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
          <span className="mx-1 h-5 w-px bg-border" />
          <Button
            variant="ghost"
            size="sm"
            onClick={undo}
            title="Undo (Ctrl/Cmd+Z)"
            className="h-8 px-2"
          >
            <Undo2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={redo}
            title="Redo (Ctrl/Cmd+Shift+Z)"
            className="h-8 px-2"
          >
            <Redo2 className="h-3.5 w-3.5" />
          </Button>
          <span className="mx-1 h-5 w-px bg-border" />
          <Tabs value={view} onValueChange={(v) => setView(v as View)}>
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
              <TabsTrigger
                value="split"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Columns2 className="mr-1 h-3.5 w-3.5" /> Split
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <main className="flex-1 overflow-auto bg-background p-4">
        {view === "visual" ? (
          <VisualEditor html={html} editable={editable} onChange={setHtml} />
        ) : view === "html" ? (
          <CodeEditor
            html={html}
            editable={editable}
            onChange={setHtml}
            caretRef={codeCaretRef}
            textareaRef={codeTextareaRef}
          />
        ) : (
          <div className="grid h-full gap-4 lg:grid-cols-2">
            <VisualEditor html={html} editable={editable} onChange={setHtml} />
            <CodeEditor
              html={html}
              editable={editable}
              onChange={setHtml}
              caretRef={codeCaretRef}
              textareaRef={codeTextareaRef}
            />
          </div>
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

function ReplaceTokens({
  count,
  onApply,
}: {
  count: number;
  onApply: (values: string[]) => void;
}) {
  const [values, setValues] = useState<string[]>([]);

  // Resize values array to match token count
  useEffect(() => {
    setValues((prev) => {
      if (prev.length === count) return prev;
      const next = prev.slice(0, count);
      while (next.length < count) next.push("");
      return next;
    });
  }, [count]);

  if (count === 0) {
    return (
      <div className="px-4 py-2.5 text-[11px] text-muted-foreground">
        No <code>[replace]</code> tokens in the HTML yet. Insert a snippet to add some.
      </div>
    );
  }

  const apply = () => {
    onApply(values);
    setValues((vs) => vs.map(() => ""));
  };

  return (
    <div className="flex flex-col gap-2 px-4 py-2.5">
      <div className="grid gap-2 sm:grid-cols-2">
        {values.map((v, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary/15 text-[10px] font-semibold text-primary">
              {i + 1}
            </span>
            <Input
              value={v}
              onChange={(e) =>
                setValues((vs) => vs.map((x, idx) => (idx === i ? e.target.value : x)))
              }
              placeholder={`Replacement #${i + 1}`}
              className="h-8 text-xs"
              onKeyDown={(e) => {
                if (e.key === "Enter") apply();
              }}
            />
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" className="h-8" onClick={apply}>
          <Replace className="mr-1.5 h-3.5 w-3.5" /> Fill tokens
        </Button>
        <span className="text-[11px] text-muted-foreground">
          Empty inputs leave that <code>[replace]</code> in place.
        </span>
      </div>
    </div>
  );
}

const APA_WORDS_KEY = "html-sandbox.apa-words.v1";
const DEFAULT_APA_WORDS = ["SUVs", "Pre-Owned", "GMC", "BMW"];

function TextTools() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [outputLabel, setOutputLabel] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [editApa, setEditApa] = useState(false);
  const [apaWords, setApaWords] = useState<string[]>(DEFAULT_APA_WORDS);

  // Load persisted custom APA words
  useEffect(() => {
    try {
      const raw = localStorage.getItem(APA_WORDS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setApaWords(parsed.filter((x) => typeof x === "string"));
      }
    } catch {
      /* noop */
    }
  }, []);

  // Persist custom APA words
  useEffect(() => {
    try {
      localStorage.setItem(APA_WORDS_KEY, JSON.stringify(apaWords));
    } catch {
      /* noop */
    }
  }, [apaWords]);

  const stats = useMemo(() => countStats(input), [input]);

  const runSlug = () => {
    setOutput(slugify(input));
    setOutputLabel("Slug");
  };
  const runAPA = () => {
    setOutput(toAPATitleCase(input, apaWords));
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
            <Button
              size="sm"
              variant={editApa ? "secondary" : "ghost"}
              onClick={() => setEditApa((v) => !v)}
              title="Edit always-capitalized words (abbreviations, brands)"
            >
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              {editApa ? "Done" : "Edit words"}
            </Button>
          </div>
          {editApa && (
            <div className="rounded border border-border bg-background/60 p-2">
              <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
                Always-capitalized words (comma-separated). Casing here is preserved exactly — e.g. SUVs, Pre-Owned, GMC, BMW.
              </label>
              <Textarea
                value={apaWords.join(", ")}
                onChange={(e) =>
                  setApaWords(
                    e.target.value
                      .split(/[,\n]/)
                      .map((s) => s.trim())
                      .filter(Boolean),
                  )
                }
                placeholder="SUVs, Pre-Owned, GMC, BMW"
                className="min-h-[60px] text-xs"
              />
              <div className="mt-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => setApaWords(DEFAULT_APA_WORDS)}
                  className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="h-3 w-3" /> Reset
                </button>
              </div>
            </div>
          )}
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
  caretRef,
  textareaRef,
}: {
  html: string;
  editable: boolean;
  onChange: (v: string) => void;
  caretRef?: React.MutableRefObject<number | null>;
  textareaRef?: React.MutableRefObject<HTMLTextAreaElement | null>;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Find the underlying textarea inside react-simple-code-editor and track caret
  useEffect(() => {
    const ta = wrapperRef.current?.querySelector("textarea") as HTMLTextAreaElement | null;
    if (!ta) return;
    if (textareaRef) textareaRef.current = ta;
    const updateCaret = () => {
      if (caretRef) caretRef.current = ta.selectionStart;
    };
    ta.addEventListener("keyup", updateCaret);
    ta.addEventListener("click", updateCaret);
    ta.addEventListener("focus", updateCaret);
    ta.addEventListener("select", updateCaret);
    return () => {
      ta.removeEventListener("keyup", updateCaret);
      ta.removeEventListener("click", updateCaret);
      ta.removeEventListener("focus", updateCaret);
      ta.removeEventListener("select", updateCaret);
    };
  }, [caretRef, textareaRef]);

  return (
    <div ref={wrapperRef} className="overflow-hidden rounded-lg border border-border bg-[#0b1020] shadow-sm">
      {!editable && (
        <div className="flex items-center gap-2 border-b border-border bg-secondary/40 px-3 py-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
          <Lock className="h-3 w-3" /> Read-only
        </div>
      )}
      <Editor
        value={html}
        onValueChange={(v) => editable && onChange(v)}
        highlight={(code) => {
          const highlighted = Prism.highlight(code, Prism.languages.markup, "markup");
          return highlighted.replace(
            /\[replace\]/g,
            '<span class="replace-token">[replace]</span>',
          );
        }}
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

function CollapsibleSection({
  title,
  icon,
  defaultOpen = false,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="border-b border-border bg-card/30">
      <CollapsibleTrigger className="flex w-full items-center gap-2 px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground">
        {icon}
        <span>{title}</span>
        <ChevronDown
          className={`ml-auto h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>{children}</CollapsibleContent>
    </Collapsible>
  );
}
