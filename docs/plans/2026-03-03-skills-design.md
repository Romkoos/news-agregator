# Design: Claude Code Skills for News Aggregator Project

**Date:** 2026-03-03
**Status:** Approved

---

## Goal

Create 26 Claude Code skill files (SKILL.md) covering all entries in the project skills catalog (BE-01…BE-10, FE-01…FE-08, INF-01…INF-08) so that Claude Code can scaffold code, enforce architecture, and automate developer workflows in this project.

---

## Approach

All 26 skills as lean SKILL.md files (Approach A). No bundled resources in v1 — skills route Claude to the right workflow; code templates are referenced from `docs/project-overview.md`.

---

## Plugin Structure

Skills live in a local project plugin with a minimal wrapper:

```
.claude/
├── settings.local.json          ← add "news-agregator-skills" to enabledPlugins
└── plugins/
    └── news-agregator-skills/
        ├── .claude-plugin/
        │   └── plugin.json
        └── skills/
            ├── be-01-scaffold-module/SKILL.md
            ├── be-02-add-usecase/SKILL.md
            ├── be-03-http-endpoint/SKILL.md
            ├── be-04-repo-port/SKILL.md
            ├── be-05-prisma-model/SKILL.md
            ├── be-06-error-taxonomy/SKILL.md
            ├── be-07-unit-tests/SKILL.md
            ├── be-08-integration-tests/SKILL.md
            ├── be-09-refactor-module/SKILL.md
            ├── be-10-shared-contracts/SKILL.md
            ├── fe-01-fsd-slice/SKILL.md
            ├── fe-02-feature-module/SKILL.md
            ├── fe-03-zustand-store/SKILL.md
            ├── fe-04-tanstack-query/SKILL.md
            ├── fe-05-react-router/SKILL.md
            ├── fe-06-unit-tests-rtl/SKILL.md
            ├── fe-07-msw-mocks/SKILL.md
            ├── fe-08-refactor-fsd/SKILL.md
            ├── inf-01-eslint/SKILL.md
            ├── inf-02-prettier/SKILL.md
            ├── inf-03-boundaries/SKILL.md
            ├── inf-04-dockerfile/SKILL.md
            ├── inf-05-docker-compose/SKILL.md
            ├── inf-06-github-actions/SKILL.md
            ├── inf-07-railway/SKILL.md
            └── inf-08-turbo/SKILL.md
```

### plugin.json (minimal)

```json
{
  "name": "news-agregator-skills",
  "version": "0.1.0",
  "description": "Project-specific dev skills for the news aggregator monorepo"
}
```

### settings.local.json update

```json
{
  "enabledPlugins": {
    "superpowers@claude-plugins-official": true,
    "news-agregator-skills": true
  }
}
```

---

## SKILL.md Anatomy

Every skill follows this template:

```markdown
---
name: <skill-id>-<short-name>
description: This skill should be used when the user asks to "<trigger 1>",
  "<trigger 2>", "<trigger 3>".
version: 0.1.0
---

# <ID>: <Full Name>

[1-2 sentence purpose]

## Inputs
- `param` (required/optional): description

## Outputs
[File tree or list of what gets created/modified]

## Preconditions
[What must be true before running]

## Workflow
1. Verify preconditions
2. [Core steps in order]
3. Run lint to verify no boundary violations

## Error conditions
- `E_CODE`: description → recovery action

## Reference
See `docs/project-overview.md` → "<ID>" for full spec and code templates.
```

**Style rules:**
- Description: third person, specific trigger phrases
- Body: imperative/infinitive form ("Create", "Scaffold", "Verify")
- Target length: 400–600 words per skill
- No second person ("you should…")

---

## Skill Catalog Summary

### Backend (BE)

| ID | Skill name | Priority | Key trigger phrases |
|----|-----------|----------|---------------------|
| BE-01 | scaffold-module | P0 | "scaffold backend module", "create hexagonal module", "add bounded context" |
| BE-02 | add-usecase | P0 | "add use-case", "create use case", "add orchestration skeleton" |
| BE-03 | http-endpoint | P0 | "add HTTP endpoint", "create Fastify route", "add API endpoint" |
| BE-04 | repo-port | P0 | "add repository port", "create Prisma adapter", "add repo interface" |
| BE-05 | prisma-model | P0 | "add Prisma model", "create migration", "add database model" |
| BE-06 | error-taxonomy | P0 | "add error taxonomy", "create error types", "add HTTP error mapping" |
| BE-07 | unit-tests | P0 | "add unit tests for domain", "generate unit tests", "test use-case" |
| BE-08 | integration-tests | P1 | "add integration tests", "Testcontainers", "test with real database" |
| BE-09 | refactor-module | P1 | "move code to module", "refactor to module", "update module public API" |
| BE-10 | shared-contracts | P1 | "create shared contract", "add Zod contract", "share types between FE and BE" |

### Frontend (FE)

| ID | Skill name | Priority | Key trigger phrases |
|----|-----------|----------|---------------------|
| FE-01 | fsd-slice | P0 | "scaffold FSD slice", "create feature slice", "add FSD layer" |
| FE-02 | feature-module | P0 | "create feature module", "add feature", "scaffold feature with ui/model/api" |
| FE-03 | zustand-store | P0 | "create Zustand store", "add store slice", "add persist store" |
| FE-04 | tanstack-query | P1 | "add TanStack query", "scaffold data fetching", "add useQuery hook" |
| FE-05 | react-router | P1 | "add route module", "scaffold React Router page", "add page route" |
| FE-06 | unit-tests-rtl | P0 | "add RTL tests", "add unit tests for component", "test React component" |
| FE-07 | msw-mocks | P1 | "add MSW mocks", "scaffold mock handlers", "add API mocks for tests" |
| FE-08 | refactor-fsd | P1 | "split feature FSD", "refactor FSD layers", "move component between layers" |

### Infrastructure (INF)

| ID | Skill name | Priority | Key trigger phrases |
|----|-----------|----------|---------------------|
| INF-01 | eslint | P0 | "configure ESLint", "add ESLint flat config", "set up TypeScript linting" |
| INF-02 | prettier | P0 | "configure Prettier", "add Tailwind class sorting", "set up formatter" |
| INF-03 | boundaries | P0 | "add boundary rules", "configure FSD eslint rules", "enforce import boundaries" |
| INF-04 | dockerfile | P1 | "create Dockerfile", "add multi-stage build", "containerize backend" |
| INF-05 | docker-compose | P1 | "create docker-compose", "add local dev stack", "spin up Postgres locally" |
| INF-06 | github-actions | P0 | "set up CI", "create GitHub Actions workflow", "add lint and test pipeline" |
| INF-07 | railway | P0 | "deploy to Railway", "configure Railway", "set up Railway deployment" |
| INF-08 | turbo | P1 | "add Turborepo", "configure turbo.json", "set up monorepo task graph" |

---

## Out of Scope (v1)

- Bundled assets (code templates) — reference `docs/project-overview.md` instead
- Reference files (references/) — add when real usage reveals gaps
- Scripts (validate, test-skill utilities)

---

## Success Criteria

- All 26 `SKILL.md` files exist and pass the validation checklist
- `plugin.json` is valid
- `settings.local.json` references the local plugin
- Each skill triggers on its key phrases
- Each skill's workflow matches the spec in `docs/project-overview.md`
