# WBS Schedule Generator

A React/Vite single-page app for building weekly schedules from WBS task estimates.

The app is designed for project managers and tech leads who currently maintain WBS schedules in spreadsheets. Paste tasks from Google Sheets, enter per-role estimates, and the schedule board regenerates automatically.

## Features

- Editable WBS task table with spreadsheet-style keyboard navigation.
- TSV import from Google Sheets with preview, column mapping, replace, and append flows.
- Direct grid paste/copy for round trips with Sheets.
- Per-role estimates for Backend, Frontend, QC, BrS, and custom roles.
- Automatic task duration based on the max enabled role estimate.
- Weekly schedule board with month/week headers, task bars, group colors, and a today marker.
- Drag reorder for schedule order.
- Undo/redo for project and task changes.
- JSON export/import for backup and project transfer.
- Firestore persistence with IndexedDB offline cache.

## Tech Stack

- React 18
- Vite 5
- TypeScript
- Tailwind CSS
- Zustand and zundo
- Firebase Firestore
- Vitest and Testing Library

## Getting Started

Install dependencies:

```sh
npm install
```

Create a local environment file:

```sh
cp .env.example .env
```

Fill in the `VITE_FIREBASE_*` values from Firebase Console:

```sh
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Start the development server:

```sh
npm run dev
```

Then open the local Vite URL shown in the terminal, usually `http://localhost:5173`.

## Firebase Setup

This app stores projects in the Firestore `projects` collection. Each project is stored as one document keyed by `project.id`.

For a quick single-user setup:

1. Create a Firebase project.
2. Create a web app in Firebase Console.
3. Copy the web app config into `.env`.
4. Enable Firestore.
5. Deploy or paste the rules from `firestore.rules`.

The included `firestore.rules` are intentionally open for a no-auth setup:

```txt
allow read, write: if true;
```

Do not use those rules for shared or production data. Add Firebase Auth and owner-based rules before storing sensitive or multi-user project data.

## Scripts

```sh
npm run dev        # Start Vite in development mode
npm run build      # Type-check and build production assets
npm run preview    # Preview the production build locally
npm run lint       # Type-check without emitting files
npm run test       # Run Vitest tests once
npm run test:watch # Run Vitest in watch mode
```

Deployment is configured for Surge:

```sh
npm run predeploy
npm run deploy
```

`predeploy` currently uses `bun run build`, so install Bun or change that script to `npm run build` if you want an npm-only workflow.

## Project Structure

```txt
src/
  app/                 Root app shell
  components/          UI, task table, import dialog, toolbar, schedule board
  constants/           Default roles, config, sample data, column aliases
  domain/              Pure import and schedule generation logic
  firebase/            Firebase app and Firestore initialization
  hooks/               Autosave, Firestore bootstrap, undo/redo, derived schedule
  storage/             Firestore repository and JSON backup helpers
  store/               Zustand store and project/task actions
  types/               Task, role, project, and schedule types
  utils/               Number units, calendar helpers, colors, task factory
```

Generated schedule data is derived from project config and tasks. It is not stored directly.

## Documentation

- `docs/project-overview-pdr.md` explains product goals, MVP scope, and acceptance criteria.
- `docs/system-architecture.md` describes the original architecture and data flow.
- `docs/codebase-summary.md` summarizes modules and core algorithms.
- `docs/code-standards.md` documents coding rules and implementation conventions.

Some docs still describe the earlier localStorage persistence plan. The current code path uses Firestore with offline persistence.
