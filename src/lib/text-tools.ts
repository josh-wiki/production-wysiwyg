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

export function toAPATitleCase(input: string): string {
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

      const lower = core.toLowerCase();
      const isMinor = APA_MINOR.has(lower);
      const useCap = isFirst || isLast || forceCap || !isMinor || core.length >= 4;

      const cased = useCap
        ? core.charAt(0).toUpperCase() + core.slice(1).toLowerCase()
        : lower;

      return lead + cased + trail;
    })
    .join("");
}

export function stripDomain(html: string, domain: string): string {
  const d = domain.trim();
  if (!d) return html;
  // Normalize: strip protocol + trailing slash + leading www.
  const clean = d
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/+$/, "");
  if (!clean) return html;
  const escaped = clean.replace(/[.*+?^${}()|[\]\\]/g, "\\$1".replace("$1", "\\$&"));
  // safer escape:
  const safe = clean.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  void escaped;
  // Match optional protocol, optional www., domain, optional trailing slash
  const re = new RegExp(`(?:https?:\\/\\/)?(?:www\\.)?${safe}\\/?`, "gi");
  return html.replace(re, "");
}
