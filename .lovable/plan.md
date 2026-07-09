## Goal

After running Clean, the output HTML currently comes out as one long inline string. Reformat it so each block-level tag starts on its own line, making it easier to scan and paste snippets.

## Change

Add a new helper `formatBlockHtml(html)` in `src/lib/text-tools.ts` and call it as the final step inside the Clean action (in `src/routes/index.tsx`), after all existing cleanup passes.

### Formatting rules

Insert a newline **before** each opening block tag and **after** each closing block tag, for this set:

- Headings: `h1`–`h6`
- Paragraph: `p`
- Lists: `ul`, `ol`, `li`
- Media / embeds: `img`, `figure`, `figcaption`, `video`, `iframe`
- Structural: `blockquote`, `pre`, `hr`, `table`, `thead`, `tbody`, `tr`, `th`, `td`, `section`, `article`, `div`

Inline tags (`a`, `strong`, `em`, `span`, `sup`, `sub`, `code`, `br`, etc.) stay on the same line as their surrounding text — snippets like a link inside a paragraph remain intact.

Then collapse any resulting runs of blank lines to a single newline and trim leading/trailing whitespace. No indentation nesting (keeps diffs and copy-paste simple); each block just starts flush-left on its own line.

### Where it plugs in

In the Clean handler in `src/routes/index.tsx`, after the existing chain (strip styles/spans/dir/list attrs/superscript/breaks/whitespace/domain), pipe the result through `formatBlockHtml` before writing it back to the editor state.

## Out of scope

- No changes to the input paste behavior, the WYSIWYG rendering, or any other action button.
- No full HTML parser / prettier dependency — a targeted regex pass keeps the bundle unchanged.

Want me to build this?