JODAKSHAR FONT DIRECTORY
========================

To activate the custom Jodakshar Devanagari font:
Place your licensed font files here:
- public/fonts/Jodakshar.woff2
- public/fonts/Jodakshar.ttf

The CSS @font-face rule in src/index.css is already configured to automatically load them with zero code changes.
When these files are absent, the system gracefully falls back to Google's 'Noto Serif Devanagari' with full OpenType conjunct and matra shaping support.
