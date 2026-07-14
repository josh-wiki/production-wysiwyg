## Increase dark mode text contrast

Bump foreground/muted text lightness in the dark theme tokens in `src/styles.css` so text pops harder against the midnight indigo background.

### Changes (`:root` block, dark theme)
- `--foreground`: `oklch(0.97 0.01 270)` → `oklch(0.99 0.005 270)` (near-white)
- `--muted-foreground`: `oklch(0.72 0.04 270)` → `oklch(0.86 0.03 270)` (much brighter secondary text)
- `--card-foreground` / `--popover-foreground` / `--accent-foreground` / `--secondary-foreground` / `--sidebar-foreground` / `--sidebar-accent-foreground`: raise to `oklch(0.99 0.005 270)` to match
- `--border`: `oklch(0.28 0.05 280)` → `oklch(0.36 0.05 280)` so bordered text/inputs read more clearly

Light mode tokens untouched.

### Verify
- Build passes
- Preview in dark mode: body copy, muted labels, and card text visibly brighter; no washed-out backgrounds
