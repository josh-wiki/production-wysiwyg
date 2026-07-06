export function slugify(input: string): string {
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

export function countStats(text: string) {
  const trimmed = text.replace(/\s+/g, " ").trim();
  const words = trimmed ? trimmed.split(" ").length : 0;
  const chars = text.length;
  const charsNoSpaces = text.replace(/\s+/g, "").length;
  const sentences = (text.match(/[^.!?]+[.!?]+/g) || []).length;
  const readingMin = Math.max(1, Math.round(words / 200));
  return { words, chars, charsNoSpaces, sentences, readingMin };
}

// APA 7th-edition title case:
// - Capitalize the first and last word
// - Capitalize all "major" words (>=4 letters, plus nouns/verbs/adjectives/adverbs/pronouns)
// - Lowercase short conjunctions, articles, and prepositions of 3 letters or fewer
// - Capitalize the word after a colon/em dash
const APA_MINOR = new Set([
  "a", "an", "and", "as", "at", "but", "by", "for", "if", "in",
  "nor", "of", "off", "on", "or", "per", "so", "the", "to", "up",
  "via", "yet", "vs", "vs.",
]);

export function toAPATitleCase(input: string, customWords: string[] = []): string {
  // Build a lookup of user-defined exact-casing overrides (e.g. "SUVs", "BMW", "Pre-Owned")
  const overrides = new Map<string, string>();
  for (const w of customWords) {
    const trimmed = w.trim();
    if (trimmed) overrides.set(trimmed.toLowerCase(), trimmed);
  }

  const tokens = input.split(/(\s+)/); // keep whitespace
  let wordIndex = 0;
  const totalWords = tokens.filter((t) => !/^\s+$/.test(t) && t.length > 0).length;
  let capitalizeNext = false;

  return tokens
    .map((tok) => {
      if (!tok || /^\s+$/.test(tok)) return tok;

      const isFirst = wordIndex === 0;
      const isLast = wordIndex === totalWords - 1;
      const forceCap = capitalizeNext;
      wordIndex += 1;

      // detect trailing punctuation that should trigger capitalization next
      capitalizeNext = /[:\u2014\u2013?!]$/.test(tok);

      // Split off leading/trailing punctuation so "(hello)" still title-cases "hello"
      const m = tok.match(/^([^\p{L}\p{N}]*)(.*?)([^\p{L}\p{N}]*)$/u);
      if (!m) return tok;
      const [, lead, core, trail] = m;
      if (!core) return tok;

      // Whole-token override (e.g. "SUVs", "BMW")
      const lowerToken = core.toLowerCase();
      if (overrides.has(lowerToken)) {
        return lead + overrides.get(lowerToken)! + trail;
      }

      // Per-segment override for hyphen/slash compounds (e.g. "Pre-Owned", "AC/DC")
      if (/[-/]/.test(core)) {
        const rebuilt = core
          .split(/([-/])/)
          .map((seg) => {
            if (seg === "-" || seg === "/") return seg;
            const segLower = seg.toLowerCase();
            if (overrides.has(segLower)) return overrides.get(segLower)!;
            if (!seg) return seg;
            return seg.charAt(0).toUpperCase() + seg.slice(1).toLowerCase();
          })
          .join("");
        return lead + rebuilt + trail;
      }

      const isMinor = APA_MINOR.has(lowerToken);
      const useCap = isFirst || isLast || forceCap || !isMinor || core.length >= 4;

      const cased = useCap
        ? core.charAt(0).toUpperCase() + core.slice(1).toLowerCase()
        : lowerToken;

      return lead + cased + trail;
    })
    .join("");
}

export function stripDomain(html: string, domain: string): string {
  const d = domain.trim();
  if (!d) return html;
  // Normalize: strip protocol and leading www. only — keep trailing slashes exactly as entered
  const clean = d
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "");
  if (!clean) return html;

  const hasTrailingSlash = clean.endsWith("/");
  const base = hasTrailingSlash ? clean.slice(0, -1) : clean;
  const safe = base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const slash = hasTrailingSlash ? "\\/" : "";

  // Match optional protocol, optional www., then the domain (with trailing slash only if user included it)
  const re = new RegExp(`(?:https?:\\/\\/)?(?:www\\.)?${safe}${slash}`, "gi");
  return html.replace(re, "");
}

// Remove all inline style="..." attributes from HTML
export function stripInlineStyles(html: string): string {
  return html
    .replace(/\s+style\s*=\s*"[^"]*"/gi, "")
    .replace(/\s+style\s*=\s*'[^']*'/gi, "");
}

// Unwrap all <span ...>...</span> tags (keeps inner content, removes the span wrapper)
export function stripSpans(html: string): string {
  let prev = "";
  let next = html;
  // Loop in case of nested spans
  while (prev !== next) {
    prev = next;
    next = next
      .replace(/<span\b[^>]*>/gi, "")
      .replace(/<\/span\s*>/gi, "");
  }
  return next;
}

// Collapse extra whitespace: blank lines, runs of spaces between tags,
// and trim leading/trailing whitespace on each line.
export function cleanWhitespace(html: string): string {
  return html
    .replace(/>\s+</g, "><")           // remove whitespace between tags
    .replace(/[ \t]+/g, " ")           // collapse runs of spaces/tabs
    .replace(/\n\s*\n+/g, "\n")        // collapse blank lines
    .replace(/&nbsp;/g, " ")           // normalize nbsp
    .replace(/^\s+|\s+$/g, "")         // trim ends
    .trim();
}

// Remove dir="ltr" from paragraph and heading tags (common Google Docs paste artifact)
export function stripDirLtr(html: string): string {
  return html.replace(
    /<(p|h[1-6])\b[^>]*?\sdir=["']ltr["'][^>]*>/gi,
    (match) => match.replace(/\sdir=["']ltr["']/i, "")
  );
}

// Remove role="presentation", dir="ltr", and aria-level="1" from list tags
// (common Google Docs paste artifact on <ul>, <ol>, and <li>)
export function stripListAttrs(html: string): string {
  return html.replace(
    /<(ul|ol|li)\b[^>]*>/gi,
    (match) =>
      match
        .replace(/\srole=["']presentation["']/gi, "")
        .replace(/\sdir=["']ltr["']/gi, "")
        .replace(/\saria-level=["']1["']/gi, "")
  );
}

