This is a small UI-only change in `src/routes/index.tsx`.

## What to change

1. **Section header rename**
   - Change the `CollapsibleSection` title from `"Strip domain"` to `"Strip domain or code"`.

2. **Remove duplicate inline label inside the expanded panel**
   - Inside `DomainStripper`, remove the duplicate inline icon + label (`<Scissors ... /> Strip domain`) that currently appears above the input field. The placeholder, input, and Remove button stay as-is.

3. **Remove duplicate inline label under Text tools**
   - Inside `TextTools`, remove the duplicate inline icon + label (`<Wand2 ... /> Text tools`) that appears above the text areas. The textarea, stats, output buttons, and all text-tool functionality stay as-is.

## What will remain intact

- All inputs, buttons, and behavior for both sections.
- `handleStripDomain` logic and `DomainStripper` props.
- All text-tool actions (slug, APA title case, word count, copy output, APA words editor).

## Verification

- Run the TypeScript/build check after the edits to confirm no regressions.
- Optionally verify the UI in the preview that the section header shows the new label and the duplicate icons/labels are gone.
