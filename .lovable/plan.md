## Goal

Wrap the editor area (Visual / HTML / Split toolbar + editing surface) into a labeled, collapsible section, and reorder the panels so **Clean & actions** sits directly above it.

## Changes (all in `src/routes/index.tsx`)

1. **Wrap the editor in a `CollapsibleSection`**
   - Combine the current view-mode toolbar (lines ~716–783: Sandbox chip, Editing/Locked toggle, Undo/Redo, and the Visual/HTML/Split tabs) plus the `<main>` editor surface (lines ~785–808) inside a single `CollapsibleSection`.
   - Title: **"Editor"** with a small subtitle showing the active view (Visual / HTML / Split) reflected via the icon. Icon: `Code2` (or the icon matching current `view`).
   - `defaultOpen` so the editor is visible on load.
   - Keep the tabs and toolbar controls inside the section header row (below the collapsible header) so collapsing hides both the toolbar and the editing surface.

2. **Reorder sections** so the top-to-bottom order becomes:
   ```
   Header
   Sessions
   Strip domain or code
   Text tools
   Fill [replace] tokens
   Insert snippets
   Clean & actions        <-- moved here (was at top)
   Editor (collapsible)   <-- new wrapper around toolbar + main
   ```
   This puts Clean & actions immediately above the collapsible Editor, as requested.

3. **Layout tweaks**
   - The `<main>` inside the collapsible loses `flex-1` (CollapsibleSection isn't a flex child in the same way); give the editor container a sensible `min-h-[560px]` so it doesn't collapse to nothing while still growing with content.
   - Keep the outer page container as `flex min-h-screen w-full flex-col` — no structural changes outside the reorder + wrap.

## Out of scope

- No changes to editor behavior (paste handling, caret color, token replacement, snippets, cleaning logic).
- No new components or state; reusing existing `CollapsibleSection`.
