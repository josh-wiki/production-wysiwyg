## Goal
Make the Clean button additionally strip all `<br>` tags and remove empty container elements like `<div></div>`, `<p></p>`, `<span></span>`, etc.

## Changes

### 1. `src/lib/text-tools.ts` — add two helpers

- **`stripAllBreaks(html)`** — remove every `<br>` / `<br/>` / `<br />` tag (not just consecutive/leading/trailing ones like the existing `stripExtraBreaks`).
- **`removeEmptyElements(html)`** — iteratively remove elements with no content or only whitespace/`&nbsp;`, applied to common containers: `div, p, span, h1-h6, li, ul, ol, section, article, figure, figcaption, blockquote, td, th, tr, thead, tbody`. Skip void/self-meaningful tags (`img`, `hr`, `br`, `iframe`, `video`, `input`). Loop until no more matches (handles nesting like `<div><p></p></div>`).

### 2. `src/routes/index.tsx` — wire into Clean button

In the Clean `onClick` chain (lines 483–497), replace `stripExtraBreaks` with the new `stripAllBreaks`, and wrap the result with `removeEmptyElements` before `cleanWhitespace` / `formatBlockHtml`. Update the button `title` tooltip to mention removing all `<br>` and empty containers. Update the imports at the top to include the two new helpers (and drop `stripExtraBreaks` from Clean; keep the export in text-tools since nothing else appears to use it — safe to leave).

## Technical notes
- `removeEmptyElements` uses a regex loop: `/<(tag)\b[^>]*>\s*(?:&nbsp;\s*)*<\/\1>/gi` across the allowed tag list, repeating until the string stops changing, so nested empties collapse in one pass.
- Order in the chain: strip styles/attrs/spans first, then `stripAllBreaks`, then `removeEmptyElements` (so containers left empty after span/br removal get cleaned), then `cleanWhitespace`, then `formatBlockHtml`.

## Verification
- Build passes.
- Paste HTML containing `<br>`, `<div></div>`, `<p> </p>`, `<div><span></span></div>` in the preview, click Clean, confirm all removed.