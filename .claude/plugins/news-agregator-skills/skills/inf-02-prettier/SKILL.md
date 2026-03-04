---
name: inf-02-prettier
description: This skill should be used when the user asks to "configure Prettier", "add Tailwind class sorting", "set up the code formatter", "add .prettierrc", or "add prettier-plugin-tailwindcss".
version: 0.1.0
---

# INF-02: Prettier config + Tailwind class sorting

Configure Prettier with consistent settings and Tailwind CSS class sorting plugin.

## Inputs

- `printWidth` (optional): defaults to `100` — substitute into `.prettierrc`
- `semi` (optional): defaults to `true` — substitute into `.prettierrc`
- `singleQuote` (optional): defaults to `true` — substitute into `.prettierrc`
- `tailwind` (required): `true` to install and add `prettier-plugin-tailwindcss`

## Outputs

Creates:

- `.prettierrc` — Prettier configuration
- `.prettierignore` — files excluded from formatting

Modifies:

- `package.json` — adds `"format": "prettier --write ."` and `"format:check": "prettier --check ."` scripts

## Preconditions

- Prettier v3+ installed

## Workflow

1. Install Prettier. **If `tailwind: true`**, include the Tailwind plugin:

```bash
# tailwind: true
pnpm add -D prettier prettier-plugin-tailwindcss

# tailwind: false — omit prettier-plugin-tailwindcss
pnpm add -D prettier
```

2. Create `.prettierrc`. Substitute `printWidth`, `semi`, and `singleQuote` from inputs. **If `tailwind: false`**, omit the `plugins` field:

```json
{
  "printWidth": 100,
  "singleQuote": true,
  "semi": true,
  "trailingComma": "all",
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

> Replace `100` with the `printWidth` input value; replace `true`/`false` for `semi` and `singleQuote` accordingly. Remove the `"plugins"` key if `tailwind: false`.

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
