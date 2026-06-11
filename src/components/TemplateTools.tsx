import { useMemo, useState } from "react";
import { Check, Copy, Hash, Type, Wrench, ChevronDown, ChevronUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function stripHtml(html: string) {
  if (typeof document === "undefined") {
    return html.replace(/<[^>]*>/g, " ");
  }
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
}

function countStats(text: string) {
  const trimmed = text.replace(/\s+/g, " ").trim();
  const words = trimmed ? trimmed.split(" ").length : 0;
  const chars = text.length;
  const charsNoSpaces = text.replace(/\s+/g, "").length;
  const sentences = (text.match(/[^.!?]+[.!?]+/g) || []).length;
  const readingMin = Math.max(1, Math.round(words / 200));
  return { words, chars, charsNoSpaces, sentences, readingMin };
}

export function TemplateTools(_: { html?: string }) {
  const [open, setOpen] = useState(true);
  const [slugInput, setSlugInput] = useState("");
  const [counterInput, setCounterInput] = useState("");
  const [stripTags, setStripTags] = useState(false);
  const [copied, setCopied] = useState(false);

  const slug = useMemo(() => slugify(slugInput), [slugInput]);
  const counterText = useMemo(
    () => (stripTags ? stripHtml(counterInput) : counterInput),
    [counterInput, stripTags],
  );
  const stats = useMemo(() => countStats(counterText), [counterText]);

  const copySlug = async () => {
    if (!slug) return;
    try {
      await navigator.clipboard.writeText(slug);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* noop */
    }
  };

  return (
    <div className="border-b border-border bg-card/30 px-4 py-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mb-2 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
      >
        <Wrench className="h-3.5 w-3.5" /> Tools
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {open && (
        <div className="grid gap-2 md:grid-cols-2">
          {/* Slug generator */}
          <div className="rounded-md border border-border bg-background/40 p-2">
            <div className="mb-1.5 inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
              <Hash className="h-3.5 w-3.5" /> Slug generator
            </div>
            <div className="flex items-center gap-1.5">
              <Input
                value={slugInput}
                onChange={(e) => setSlugInput(e.target.value)}
                placeholder="Type a title…"
                className="h-8"
              />
              <Button
                size="sm"
                variant="outline"
                className="h-8 min-w-[88px]"
                onClick={copySlug}
                disabled={!slug}
              >
                {copied ? (
                  <>
                    <Check className="mr-1 h-3.5 w-3.5" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="mr-1 h-3.5 w-3.5" /> Copy
                  </>
                )}
              </Button>
            </div>
            <code className="mt-1.5 block truncate rounded bg-secondary/60 px-2 py-1 font-mono text-xs text-foreground/80">
              {slug || <span className="text-muted-foreground">your-slug-here</span>}
            </code>
          </div>

          {/* Word counter */}
          <div className="rounded-md border border-border bg-background/40 p-2">
            <div className="mb-1.5 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                <Type className="h-3.5 w-3.5" /> Word counter
              </span>
              <label className="ml-auto inline-flex cursor-pointer items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                <input
                  type="checkbox"
                  checked={stripTags}
                  onChange={(e) => setStripTags(e.target.checked)}
                  className="h-3 w-3 accent-primary"
                />
                Strip HTML
              </label>
              {counterInput && (
                <button
                  type="button"
                  onClick={() => setCounterInput("")}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Clear"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <Textarea
              value={counterInput}
              onChange={(e) => setCounterInput(e.target.value)}
              placeholder="Paste text or HTML to count…"
              className="min-h-[72px] text-xs"
            />
            <div className="mt-1.5 grid grid-cols-5 gap-1.5 text-center">
              <Stat label="Words" value={stats.words} />
              <Stat label="Chars" value={stats.chars} />
              <Stat label="No spaces" value={stats.charsNoSpaces} />
              <Stat label="Sentences" value={stats.sentences} />
              <Stat label="Read min" value={stats.readingMin} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded bg-secondary/50 px-1.5 py-1">
      <div className="font-mono text-sm font-semibold text-foreground">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}
