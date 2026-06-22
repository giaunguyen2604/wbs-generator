# Phase 01 — Project Setup & Tooling

## Context Links
- Requirements §19 (tech stack), §20 (folder structure).
- Plan overview: ./plan.md

## Overview
- **Priority:** P1 (blocker)
- **Status:** pending
- **Description:** Scaffold Vite + React + TS app, Tailwind, deps, base folder structure, lint/format, scripts.

## Key Insights
- Greenfield, no git repo yet — init git too.
- Stack is decided; do not re-evaluate. zundo provides temporal undo/redo for zustand.

## Requirements
- Functional: `npm run dev` serves blank app; `npm run build` compiles clean; Tailwind classes work.
- Non-functional: strict TS, path alias `@/` → `src/`.

## Architecture
Standard Vite SPA. No router (single screen). Tailwind via PostCSS.

## Related Code Files
**Create:**
- `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`
- `tailwind.config.ts`, `postcss.config.js`, `index.html`
- `src/main.tsx`, `src/app/app.tsx`, `src/index.css`
- `.gitignore`, `.eslintrc.cjs`, `.prettierrc`
- Empty dirs per §20: `src/components/{project-config,task-table,import-sheet,schedule-board,role-settings}`, `src/domain/{schedule,import}`, `src/storage`, `src/types`, `src/utils`

## Implementation Steps
1. `npm create vite@latest . -- --template react-ts` (or manual scaffold in existing dir).
2. Install deps: `zustand zundo @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities nanoid`.
3. Install dev deps: `tailwindcss postcss autoprefixer vitest @testing-library/react @testing-library/user-event jsdom @types/node eslint prettier`.
4. `npx tailwindcss init -p`; configure `content` globs + `darkMode` off.
5. Add `@/` alias in `vite.config.ts` + `tsconfig.json` paths.
6. Set tsconfig strict: `strict`, `noUncheckedIndexedAccess`, `noUnusedLocals`.
7. Add Tailwind directives to `src/index.css`; render minimal `<App/>` placeholder.
8. Add npm scripts: `dev`, `build`, `preview`, `lint`, `test`.
9. `git init`; commit scaffold.

## Todo List
- [ ] Scaffold Vite React-TS
- [ ] Install runtime + dev deps
- [ ] Configure Tailwind + PostCSS
- [ ] Configure `@/` alias + strict TS
- [ ] Create §20 folder skeleton
- [ ] Add scripts; `npm run build` passes
- [ ] git init + initial commit

## Success Criteria
- `npm run dev` shows placeholder; `npm run build` exits 0 with no TS errors; Tailwind utility renders.

## Risk Assessment
- Tailwind v4 config drift → pin Tailwind v3 (stable PostCSS flow) to match req CSS examples.

## Security Considerations
- No secrets; `.gitignore` excludes `node_modules`, `dist`, `.env*`.

## Next Steps
- Phase 02 (types/utils/sample data).
