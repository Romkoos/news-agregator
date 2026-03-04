---
name: inf-08-turbo
description: This skill should be used when the user asks to "add Turborepo", "configure turbo.json", "set up the monorepo task graph", "add turbo caching", or "configure a Turborepo pipeline".
version: 0.1.0
---

# INF-08: Monorepo task graph (turbo.json)

Configure Turborepo to orchestrate lint/test/build/typecheck tasks across all workspace packages with caching.

## Inputs

- `packages` (required): array of workspace package paths (e.g., `['apps/frontend', 'apps/backend', 'packages/contracts']`) — verify each is listed in `pnpm-workspace.yaml`
- `tasks` (required): subset of `['build', 'lint', 'test', 'typecheck']` — only generate task entries for these
- `outputsMap` (required): per-task output globs for cache (e.g., `{build: ['dist/**'], test: ['coverage/**']}`) — substitute into each task's `outputs` array

## Outputs

Creates/modifies:

- `turbo.json` — task graph at the monorepo root
- `package.json` (root) — adds `turbo` dev dependency and top-level `lint`, `test`, `build`, `typecheck` scripts that delegate to `turbo run <task>`

## Preconditions

- `pnpm-workspace.yaml` exists and lists all paths from the `packages` input
- Each package listed in `packages` has the task scripts from the `tasks` input in its own `package.json`

## Workflow

1. Verify each path in the `packages` input is listed in `pnpm-workspace.yaml`. If a path is missing, add it to `pnpm-workspace.yaml` before continuing.

2. Install Turborepo as a root dev dependency:

```bash
pnpm add -D turbo -w
```

3. Create `turbo.json` at the monorepo root. **Include only the task entries listed in the `tasks` input.** For each task, substitute the output glob from `outputsMap.<taskName>` (omit `outputs` if `outputsMap` has no entry for that task):

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

> Remove any task block not present in the `tasks` input. Replace each `outputs` value with the corresponding entry from `outputsMap` — for example, `outputsMap.build` → `["dist/**"]` and `outputsMap.test` → `["coverage/lcov.info"]`. For `lint` and `typecheck`, the `outputs` array stays `[]` since they produce no cacheable artifacts (unless `outputsMap` provides values for them).

4. Update root `package.json` scripts to delegate to Turborepo (add only the tasks from the `tasks` input):

```json
"lint": "turbo run lint",
"test": "turbo run test",
"build": "turbo run build",
"typecheck": "turbo run typecheck"
```

5. Run `pnpm lint` from the monorepo root — verify Turborepo picks up all apps and logs each package's output

6. Run `pnpm lint` again — verify cache hits appear as `cache hit, replaying logs` (FULL TURBO)

## Error conditions

- `E_TASK_CYCLE`: Circular `dependsOn` → remove the cycle; tasks within the same package cannot depend on each other via `^` — only cross-package dependency chains are supported
- `E_OUTPUTS_MISSING`: Cache invalidates on every run → ensure the `outputs` glob from `outputsMap` matches the actual build artifact paths emitted by the compiler

## Reference

See `docs/project-overview.md` → "INF-08 — Monorepo task graph (turbo.json)".
