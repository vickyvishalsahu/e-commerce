# Pilot log

Every time the AI needed a correction, or a tool did something surprising that the AI had to catch. Newest phase first.

## Phase 1 - Mock backend

**MSW is on v3, not the v2 the plan assumed.** The AI checked the installed version before writing handlers, which mattered: `onUnhandledRequest` became `onUnhandledFrame`, and v3 ships a Vite plugin that serves the worker script. The rename was still missed once and only caught by the typechecker. Strict TypeScript is doing real work against version drift.

**First drafts needed cleanup the AI caught itself.** The product sort used no-op comparators for two of five sort modes and relied on a pre-sort; rewritten as one comparator per mode. The 99-item line limit was hardcoded in three places; now one constant. Neither was a bug yet, and both would have been next phase's bug.

**The linter caught weak tests.** oxlint flagged a conditional `expect` inside a loop (a test that could pass while asserting nothing) and tests with no assertions. The rewrite compares against a sorted copy instead.

**All 83 tests passed on the first run, so the tests got tested.** Six deliberate bugs went into the mock (search matching any term instead of all, merge ignoring stock, idempotency removed, cart not cleared after an order, existing quantity not counted against stock, simulation swallowing requests). Every one was caught. Without that check, first-run green says nothing.

**Clever git tooling went wrong three times.** To keep every commit green, the AI scripted stash-verify-commit cycles. A stashed new file conflicted on pop, then Prettier formatting created a second conflict, then a "park the other files" script moved `vite.config.ts` aside and ran the tests with no config. Nothing was lost because the full file was saved beforehand, but it took four attempts. Lesson: when a script does anything to git, ask how it backs out before letting it run.

**Known cost, deferred.** The mocks chunk (catalog JSON, msw, zod) is 280 KB gzipped and loads before first render. Fine for now; revisit in phase 9.

## Phase 0 - Bootstrap

**Scaffold ships oxlint, not ESLint.** The plan said ESLint with the react-hooks, jsx-a11y and @tanstack/query plugins. `create-vite` now generates oxlint. Kept it: oxlint covers rules-of-hooks, exhaustive-deps, jsx-a11y, no-explicit-any and consistent-type-imports, verified by linting a deliberately broken file. The tradeoff is losing `@tanstack/eslint-plugin-query`, so query key completeness is enforced by convention and review instead.

**shadcn wrote files into a literal `@/` folder and swapped the utils helper.** `shadcn init` reads the path alias from the root `tsconfig.json`, but Vite's template only declares it in `tsconfig.app.json`. Instead of failing, the CLI created `@/components/ui/button.tsx` at the project root. Fix: declare `paths` in the root tsconfig, roll back and rerun init. Also checked the unfamiliar `cn` dependency before trusting it: it's shadcn's own package (repo `shadcn-ui/cn`), replacing clsx + tailwind-merge. The generated `src/lib/utils.ts` re-export was unused, and `shadcn add` works without it, so it was deleted.

**Playwright tested the wrong app.** Another project's dev server was already on port 5173, and `reuseExistingServer` silently ran the smoke test against it (title "ai-testing"). Fix: e2e runs on its own port, 5317. Lesson: a passing e2e run means nothing until you know which server answered.

**The AI broke a house rule once.** It used `npm pkg set` to edit a package.json script despite the pnpm-only rule. No packages were installed through npm, but the rule is now spelled out in CLAUDE.md.

**A change slipped into the wrong commit.** The `--deny-warnings` lint flag got bundled into the Vitest commit. Caught before pushing and split into its own commit.
