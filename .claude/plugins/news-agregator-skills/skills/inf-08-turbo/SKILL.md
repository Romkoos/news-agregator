---
name: inf-08-turbo
description: This skill should be used when the user asks to "add Turborepo", "configure turbo.json", "set up the monorepo task graph", "add turbo caching", or "configure a Turborepo pipeline".
version: 0.1.0
---

# INF-08: Monorepo task graph (turbo.json)

Configure Turborepo to orchestrate lint/test/build/typecheck tasks across all workspace packages with caching.

## Inputs

- `packages` (required): array of workspace package paths (e.g., `['apps/frontend', 'apps/backend', 'packages/contracts']`)
- `tasks` (required): subset of `['build', 'lint', 'test', 'typecheck']`
- `outputsMap` (required): per-task output globs for cache (e.g., `{build: ['dist/**']}`)

## Outputs

Creates/modifies:

- `turbo.json` — task graph at the monorepo root
- `package.json` (root) — adds `turbo` dev dependency and top-level `lint`, `test`, `build`, `typecheck` scripts that delegate to `turbo run <task>`

## Preconditions

- `pnpm-workspace.yaml` exists and includes all packages from the `packages` input
- Each package has the requested task scripts in its own `package.json`

## Workflow

1. Install Turborepo as a root dev dependency:

```bash
pnpm add -D turbo -w
```

2. Create `turbo.json` at the monorepo root. Include only the tasks from the `tasks` input; use `outputsMap` to set cache globs:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "lint": {
      "dependsOn": [],
      "outputs": []
    },
    "typecheck": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "test": {
      "dependsOn": [],
      "outputs": ["coverage/**"]
    }
  }
}
```

> Remove task entries for any task not in the `tasks` input. Replace `dist/**` with the glob from `outputsMap.build` if provided.

3. Update root `package.json` scripts to delegate to Turborepo:

```json
"lint": "turbo run lint",
"test": "turbo run test",
"build": "turbo run build",
"typecheck": "turbo run typecheck"
```

4. Run `pnpm lint` from the monorepo root — verify Turborepo picks up both apps and logs each package's output

5. Run `pnpm lint` again — verify cache hits appear as `cache hit, replaying logs` in the output (`FULL TURBO`)

## Error conditions

- `E_TASK_CYCLE`: Circular `dependsOn` → remove the cycle; tasks within the same package cannot depend on each other via `^` — only cross-package dependency chains are supported
- `E_OUTPUTS_MISSING`: Cache invalidates on every run → ensure the `outputs` glob matches actual build artifacts (e.g., `dist/**` must match where the compiler writes output)

## Reference

See `docs/project-overview.md` → "INF-08 — Monorepo task graph (turbo.json)".
