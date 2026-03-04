---
name: inf-02-prettier
description: This skill should be used when the user asks to "configure Prettier", "add Tailwind class sorting", "set up the code formatter", "add .prettierrc", or "add prettier-plugin-tailwindcss".
version: 0.1.0
---

# INF-02: Prettier config + Tailwind class sorting

Configure Prettier with consistent settings and Tailwind CSS class sorting plugin.

## Inputs

- `printWidth` (optional): defaults to `100`
- `semi` (optional): defaults to `true`
- `singleQuote` (optional): defaults to `true`
- `tailwind` (required): `true` to add `prettier-plugin-tailwindcss`

## Outputs

Creates:

- `.prettierrc` — Prettier configuration
- `.prettierignore` — files excluded from formatting

Modifies:

- `package.json` — adds `"format": "prettier --write ."` and `"format:check": "prettier --check ."` scripts

## Preconditions

- Prettier v3+ installed

## Workflow

1. Install if not present:

```bash
pnpm add -D prettier prettier-plugin-tailwindcss
```

2. Create `.prettierrc` at the monorepo root (or at the scope package root):

```json
{
  "printWidth": 100,
  "singleQuote": true,
  "semi": true,
  "trailingComma": "all",
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

> Remove `prettier-plugin-tailwindcss` from `plugins` if `tailwind: false`.

3. Create `.prettierignore`:

```
dist/
node_modules/
.turbo/
pnpm-lock.yaml
```

4. Add format scripts to `package.json`:

```json
"format": "prettier --write .",
"format:check": "prettier --check ."
```

5. Run `pnpm format:check` — should report 0 differences on a freshly formatted codebase

## Error conditions

- `E_PRETTIER_PLUGIN_MISSING`: Tailwind plugin not found → run `pnpm add -D prettier-plugin-tailwindcss` and verify the plugin name in `.prettierrc` matches the installed package
- `E_FORMAT_CHECK_FAIL`: Files differ → run `pnpm format` to reformat, then re-run `pnpm format:check`

## Reference

See `docs/project-overview.md` → "INF-02 — Prettier config + Tailwind class sorting".
