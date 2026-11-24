# DeepL Pro switch could not be saved

## Context

The plugin settings form blocked a paid DeepL plan. "Use free DeepL API ?" is a boolean. With `required: true`, DatoCMS treats `false` (the switch off) as an empty value and shows "Field is required". The same rule applies to "Development mode".

## What we learned

- A required boolean in `datoCmsPlugin.parameters` cannot be saved as off. Leave `required` unset or `false`, and default the free-API switch to `false` so the Pro endpoint (`https://api.deepl.com`) is the saved state.
- The plugin iframe on `plugins-cdn.datocms.com` only loads scripts with paths relative to `dist/index.html`. Vite needs `base: './'`.
- `npm whoami` on this machine returned 401, and `npm publish` returned 404. The npm maintainer is `sklico`. A GitHub release does not by itself publish the package to npm.

## Decisions

- Moved the plugin onto the current DatoCMS SDK (Vite, React, TypeScript) and kept the same parameter ids so an upgrade still reads the existing key, proxy URL, and button label.
- Version bumped to 0.0.8. Build output stays out of git (`dist/`), same as the old `public/` bundle.

## Follow-ups

- After merge, tag `v0.0.8` and publish the GitHub release.
- In the DatoCMS project, accept the plugin update. Until that happens, the project keeps the old parameter definition and the switch stays required.
- Publishing 0.0.8 to npm still needs a login that can publish `datocms-plugin-deepl-translate-button`.
