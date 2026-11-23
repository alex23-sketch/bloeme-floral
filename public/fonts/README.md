# Font handoff

The Standard demo intentionally makes no external font requests so it renders offline and has no third-party network dependency.

The CSS already assigns the requested roles:

- Display: `Cormorant Garamond` → Iowan Old Style / Palatino / Didot / Georgia fallback
- Body: `DM Sans` → platform sans fallback

For a production resale installation, self-host the OFL-licensed Cormorant Garamond and DM Sans WOFF2 files here, add `@font-face` declarations to `src/styles/index.css`, and keep the existing fallback stack. The visual hierarchy and token names do not need to change.
