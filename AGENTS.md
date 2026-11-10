# Repository Guidelines

## Project Structure & Module Organization

This is a Next.js 15 App Router application using React 19, TypeScript, Tailwind CSS, and PostgreSQL through Prisma.

- `src/app/`: public routes (`/`, `/belgie`, `/vergelijk`) and administration pages.
- `src/components/`: charts, shared UI, and page sections.
- `src/server/`: database queries and administration logic.
- `src/data/`: source adapters, imports, mappings, derivations, and reviewed reference snapshots.
- `src/lib/`: shared utilities and financial formatters; `src/i18n/`: translations.
- `prisma/`: schema, migrations, and seeds; `scripts/`: imports, reconciliation, and deployment.
- `public/`: static assets; `docs/`: methodology and operational documentation.

## Build, Test, and Development Commands

- `npm ci`: install dependencies from the lockfile.
- `npm run db:generate`: regenerate `src/generated/prisma`; never edit generated files manually.
- `npm run dev`: start development against a separate development database.
- `npm run build` and `npm start`: build and serve production output.
- `npm run lint` and `npm run typecheck`: run ESLint and strict TypeScript checks.
- `npm test`: run Vitest; `npm run test:watch`: watch tests.
- `npm test -- src/data/reference/__tests__/complete-country-comparison.test.ts`: run focused source-reconciliation tests.

## Coding Style & Naming Conventions

Use two-space indentation, double quotes, semicolons, and explicit TypeScript types. Use kebab-case filenames, PascalCase React components, and camelCase functions. Import through `@/` where appropriate. Keep database access server-side and add `"use client"` only where needed. Reuse CSS tokens and `src/lib/format/money.ts` for financial formatting. ESLint uses Next.js and TypeScript rules; no dedicated formatter is configured.

## Testing Guidelines

Vitest runs `src/**/*.test.ts` in Node. Colocate tests in `__tests__/` directories. No coverage threshold is configured. Prioritize units, denominators, consolidation, missing values, and source flags. Run relevant tests and build checks; verify UI changes on desktop and mobile, including controls and overflow.

## Commit & Pull Request Guidelines

This checkout has no accessible Git history. Use concise imperative subjects, such as `Add inflation-adjusted cost comparison`. PRs should describe the change, link relevant issues, list validation, and include screenshots for UI changes. Explain source or methodology changes explicitly.

## Data Integrity, Configuration & Deployment

Preserve source URLs, years, definitions, and provisional flags. Missing data must not become zero. Update snapshots, explanations, and reconciliation tests together.

Keep `.env`, credentials, and database dumps private. Use `.env.example` for development configuration. This directory hosts production: consult `docs/migration-netcup-20261109.md` and `docs/COMPLETE_COUNTRY_COMPARISON.md` before deployment. Never start `docker-compose.source.yml` or run development migrations against production.
