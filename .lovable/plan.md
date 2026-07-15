## Problem

When pasting content in the Visual or HTML editor, the pasted text is large enough that the browser scrolls the caret into view — which jumps the page to the bottom of the newly-taller editor. This happens because both editors auto-grow with content and the browser's default caret-scroll behavior kicks in after paste.

## Fix

Preserve the window scroll position across paste events in both editors in `src/routes/index.tsx`.

**VisualEditor (contentEditable div, ~line 1099):**
- Add an `onPaste` handler on the contentEditable div that captures `window.scrollY` before the paste settles, then restores it on the next two animation frames (covers React re-render + browser caret-scroll).

**CodeEditor (react-simple-code-editor textarea, ~line 1141):**
- Attach a `paste` event listener to the underlying textarea inside the existing `useEffect`. Same pattern: capture `window.scrollY` on paste, restore it after the value update repaints.

No changes to paste content, cleaning logic, formatting, or state — only scroll position is preserved.

## Verification

- Paste a long HTML block into Visual view → page stays at current scroll position, editor content updates.
- Paste into HTML view → same behavior.
- Normal typing, Undo/Redo, and Clean button unaffected.
- Build passes.