# Storefront

E-commerce storefront, frontend only. The backend is mocked in the browser with MSW. The full plan and wireframes: https://claude.ai/artifact/DA7CFYDZjwZVNFdKGTUhCo

## Commands

- `pnpm dev` - dev server on 5173
- `pnpm check` - typecheck, lint, format check, unit tests. Must pass before every commit.
- `pnpm e2e` - Playwright against a dev server on port 5317
- `pnpm format` - Prettier write

pnpm only, never npm or npx (use `pnpm exec` / `pnpm dlx`).

## Versions - read before writing code

Training data mixes old APIs for these libraries. Check `package.json` and use the current major only.

- React 19. No `forwardRef` in new code (ref is a prop), no `React.FC`.
- React Router v7 in data mode: `createBrowserRouter` + `RouterProvider`, imported from `react-router` (not `react-router-dom`).
- TanStack Query v5: object signatures only, `isPending` not `isLoading` for first load, `queryOptions()` factories, `placeholderData: keepPreviousData`.
- Tailwind v4: CSS-first config in `src/index.css`. There is no `tailwind.config.js`; don't create one.
- shadcn/ui (radix-nova style): add components with `pnpm dlx shadcn@latest add <name>`, never hand-write them. They import `cn` from the `cn` package. Don't edit files in `src/components/ui` unless fixing a real bug there.
- MSW v2: `http.get(...)` and `HttpResponse.json(...)`, not `rest` / `res(ctx...)`.
- Vitest 5, Playwright, oxlint (not ESLint).

## Folder layout

- `src/features/<feature>/` - everything for one feature: `api.ts` (query options, fetchers, mutations), components, hooks, tests next to the code.
- `src/components/ui/` - shadcn primitives only. `src/components/` - shared app components.
- `src/lib/` - cross-feature utilities (http client, query client, money formatting).
- `src/mocks/` - MSW handlers, in-memory db, seed data.
- `src/test/` - test setup and helpers. `e2e/` - Playwright specs.

Features may import from `components`, `lib` and their own folder. Cross-feature imports go through the other feature's public `api.ts` only.

## Code rules

- Named exports only. No default exports outside config files.
- No `any`, no non-null `!`. `as` casts only for `as const`. Narrow with zod or type guards instead.
- Every API response is parsed with its zod schema at the fetch boundary. Types come from `z.infer`, never written by hand alongside a schema.
- Server state lives in TanStack Query only. Zustand is for UI state (drawer open, toasts); never copy API data into it.
- Route loaders don't fetch directly. They call `queryClient.ensureQueryData(xQueryOptions(...))` and components read the same options with `useSuspenseQuery`.
- Query keys come from the feature's key factory and include every input that changes the result.
- Filter, sort, page and search state lives in the URL, parsed through a zod schema.
- Money is integer cents everywhere. Format only at render via the shared formatter. Totals come from one pure function.
- Every view that loads data has designed loading, empty and error states. No bare spinners on full pages; use skeletons that match the layout.
- Accessibility is part of done: semantic elements, labels on every input, visible focus, keyboard support, focus management for drawers, dialogs and step changes.
- No dead code, unused exports, commented-out code or TODOs.

## Tests

- Unit and component tests with Vitest + Testing Library. Query by role and accessible name, assert what the user sees. Don't test implementation details.
- Network goes through MSW handlers in tests too. Never mock `fetch` or query hooks directly.
- Each user flow gets a Playwright spec in `e2e/`.
- Bugs: write a failing test or Playwright repro first, then fix the root cause, then confirm the repro passes.

## Git

Work on `dev`. Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `ref:`), one small change per commit. Never commit to `main`; `pnpm release` handles that. `CHANGELOG.md`, if it ever exists, is generated - don't edit it.

## Pilot log

`docs/pilot-log.md` records every time the AI had to be corrected: what it did, why it was wrong, and what fixed it. Add an entry whenever that happens.
