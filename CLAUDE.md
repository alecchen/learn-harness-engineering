# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Learn Harness Engineering is a project-based course on building reliable coding environments for AI agents. The repo contains a VitePress documentation site plus hands-on project code.

## Commands

```sh
# Documentation site
npm install
npm run docs:dev        # Dev server with hot reload (VitePress)
npm run docs:build      # Production build
npm run docs:preview    # Preview built site

# Run lecture code examples
npx tsx docs/en/lectures/<lecture-dir>/code/<file>.ts

# Project Electron apps (from each project directory)
cd projects/project-NN/starter  # or solution/
npm install
npm run dev              # Build + launch Electron (via scripts/dev.js)
npm run check            # Type-check both tsconfig.json and tsconfig.node.json
npm run test             # Vitest run (single run)
npm run test:watch       # Vitest watch mode
```

## Repository Structure

- `docs/` — VitePress documentation site (lectures, projects, resources)
- `docs/.vitepress/config.mts` — Nav/sidebar config for all 15 locales (en, zh, zh-TW, ja, ko, es, fr, ru, de, ar, vi, uz, tr, uk, pt-BR)
- `docs/<lang>/lectures/` — 14 lectures, each with `index.md` + `code/` examples
- `docs/<lang>/projects/` — 8 project descriptions
- `docs/<lang>/resources/` — localized templates, references, OpenAI advanced pack
- `docs-readme/` — localized README translations (one directory per locale)
- `projects/shared/` — Shared Electron + TypeScript + React foundation
- `projects/project-NN/` — Per-project `starter/` and `solution/` directories (project-01 through project-06; project-07 and project-08 are docs-only so far)

## Architecture

The course revolves around an Electron knowledge-base desktop app that evolves across the projects:
- **Main process** (`src/main/`): Window management, IPC handlers, service initialization
- **Preload** (`src/preload/`): contextBridge exposing typed API to renderer
- **Renderer** (`src/renderer/`): React UI with document list, Q&A panel, status bar
- **Services** (`src/services/`): DocumentService, IndexingService, QaService, PersistenceService
- **Shared types** (`src/shared/types.ts`): Cross-boundary interfaces and IPC channel constants

Each project's starter/solution is a complete copy of the Electron app at that evolutionary stage. P(N+1) starter is derived from P(N) solution. The shared foundation is in `projects/shared/`.

## Key Patterns

- IPC channels defined as constants in `src/shared/types.ts` (IPC_CHANNELS) — single source of truth
- All data stored locally as JSON/text files (no database)
- Mock Q&A returns structured answers with citations (no real LLM API)
- Harness files in project roots: AGENTS.md, CLAUDE.md, feature_list.json, init.sh, claude-progress.md
- Progressive disclosure: short AGENTS.md entrypoint linking to focused docs
- Each project has two tsconfigs: `tsconfig.json` (renderer) and `tsconfig.node.json` (main/preload)

## Multilingual Content

Course documentation is organized by locale under `docs/<lang>/`. Keep English as the structural source of truth, keep localized directories in sync, and preserve runnable code examples across languages.

### Heading anchors

Heading ids are locale-invariant English slugs so that a URL fragment survives a language switch (`#real-world-example` works on the English, Chinese, and Japanese pages of the same section). This is applied at build time by `docs/.vitepress/anchor-map.json`, generated from the English source by `scripts/build-anchor-map.ts` and enforced by `scripts/validate-anchors.ts` (`npm run anchors:check`, run in CI).

Consequences for anyone editing lecture or project pages:

- **Run `npm run anchors:build` after changing any English heading.** The validator fails the build if the map goes stale.
- **Keeping a locale's heading count equal to English is what enables cross-language links.** Ids are matched by position, not by title text, so translated titles are free but the order and number of headings must line up.
- **15 pages have known structure drift and intentionally keep localized ids** (lecture-11 and lecture-12 in 9 locales each, project-01 in 13, projects 02-06 in zh/zh-TW, six resources pages, harness-designs/codex in zh). Cross-language anchor links do not resolve on those pages. This is not a bug to fix: the translations are structurally different documents, and in the project pages the Chinese is more complete than the English stub. `npm run anchors:check` lists them.
- Reordering sections without changing the count is not detected by the validator; it would silently mis-map ids. Prefer reordering English and the locale together.
