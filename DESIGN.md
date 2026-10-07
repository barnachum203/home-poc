# Design System

## Theme

Bright residential daylight with an established insurer's calm authority. A pure white canvas keeps the task clear; a measured honey-gold primary adds warmth while deep petrol blue supplies trust and legibility. The color strategy is restrained.

## Colors

- `--color-bg: oklch(1 0 0)`
- `--color-surface: oklch(0.975 0.006 91.3)`
- `--color-ink: oklch(0.22 0.025 245)`
- `--color-muted: oklch(0.46 0.025 245)`
- `--color-primary: oklch(0.7 0.155 91.3)`
- `--color-primary-strong: oklch(0.53 0.135 91.3)`
- `--color-accent: oklch(0.31 0.09 230)`
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
