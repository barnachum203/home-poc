# Design System

## Theme

A focused AIG Israel product surface based on the public digital identity: deep AIG navy, vivid action blue, white task surfaces, and cool blue-gray backgrounds. Orange appears only as a small supporting highlight. The color strategy is restrained and transactional.

## Colors

- `--color-bg: oklch(0.972 0.008 253.9)`
- `--color-surface: oklch(1 0 0)`
- `--color-ink: oklch(0.199 0.1 263)`
- `--color-muted: oklch(0.43 0.055 260)`
- `--color-primary: oklch(0.499 0.222 262.9)`
- `--color-primary-strong: oklch(0.277 0.153 263.7)`
- `--color-accent: oklch(0.499 0.222 262.9)`
- `--color-success: oklch(0.46 0.11 155)`
- `--color-error: oklch(0.49 0.17 28)`

## Typography

Use a single system sans-serif stack that renders Hebrew reliably. Headings use strong weight and compact spacing; body text remains at least 1rem with generous line height. UI hierarchy uses a fixed, modest scale appropriate for a transactional product.

## Components

Controls share 12px radii, strong focus rings, and clear hover, active, disabled, loading, and error states. Cards use either a subtle boundary or a compact shadow, never both decoratively. Confirmation overlays stay opaque enough for dependable map contrast.

## Layout

The address form is a narrow, centered task surface. The found-property state expands to a wider map canvas with the confirmation panel overlaid on desktop and placed below the map on smaller screens. Spacing follows a 4px base rhythm.

## Motion

Most interface transitions run 180 to 250ms with ease-out curves. The map camera uses a short stepped zoom; the marker pulse and confirmation entrance explain successful location. Reduced-motion mode removes pulsing and makes transitions effectively immediate.
