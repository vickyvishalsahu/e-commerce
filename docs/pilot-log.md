# Pilot log

Every time the AI needed a correction, or a tool did something surprising that the AI had to catch. Newest phase first.

## Phase 3 - Catalog

**The first real bug was invisible to the unit tests.** All tests passed, but the home page crashed in the browser with a TanStack `CancelledError`. Under StrictMode the header's category query mounted, unmounted and remounted. Because the query function consumed the abort signal, the unmount cancelled the fetch the route loader was awaiting. The tests didn't render in StrictMode, so they never saw it. Fix order: render tests in StrictMode, watch the home test fail with the same error, then stop passing `signal` from query functions. Lesson: the test harness has to match how the app actually boots, or "green" is about a different app. Looking at the running app caught what 124 tests didn't.

**The AI committed a broken fix commit.** It chained `pnpm check ; git commit` with `;` instead of `&&`, so the commit happened even though the check failed. The commit also swept in unrelated staged changes (a file deletion from earlier work). Caught by checking the committed tree in a clean git worktree; rebuilt the commit before anything was pushed. Every commit since then is verified in a throwaway worktree, which checks exactly what was committed rather than the working directory.

**Flaky tests had two separate causes.** Some tests asserted right after the URL changed, before React rendered the new page; those now wait for the UI. The rest were timeouts: full-page route tests in StrictMode under parallel load take 1-5s, past Testing Library's 1s default and, once, Vitest's 5s. Raised both limits, then confirmed with 12 consecutive green runs instead of trusting one.

**Screenshots caught a UX problem.** An empty search showed a price filter of 0–0 and a sort dropdown with nothing to sort. Filters and sort now only appear when there is something to narrow, or when filters caused the empty result.

**The safety net worked as intended.** A cleanup command `rm -f $SP/*.png` was blocked because an unset variable would make it dangerous. The AI used a fresh folder instead of finding a way around the block.

**Known limitation.** Product photos come from picsum.photos, which serves random scenery, so a pendant light may show a bridge. Fine for a mock; real product images are out of scope.

## Phase 2 - App shell

**React Router is on v8, not v7.** Same story as MSW: the plan and CLAUDE.md both said v7. Checking the registry before writing any routing code showed v8, so the AI read the changelog first. The changes that matter here: `RouterProvider` moved to `react-router/dom` and `react-router-dom` is gone. Lesson: pin "check the installed major" as a step, not a hope. Version drift has now hit two of the first three phases.

**The obvious folder for the layout broke the project's own import rule.** The header composes features (category nav, cart badge), and CLAUDE.md says `components/` must not import features. Putting the layout in `components/layout` would have quietly broken that rule. The fix was a new `src/app` layer, the only place allowed to compose features. It's now documented.

**A failing e2e test was a test bug, not an app bug.** "Tab reaches the skip link first" failed. The app mounts only after the mock service worker starts, so the test pressed Tab on an empty page. Waiting for the header fixed it. Worth checking a hypothesis before "fixing" the app.

**Mutation testing found a gap again.** Four deliberate bugs went into the shell. Three were caught; the cart badge's singular label ("1 item" vs "1 items") wasn't. Added a test.

**Small tooling surprises.** shadcn's toast component pulls in `next-themes` (harmless without a provider). jsdom lacks `matchMedia` (sonner needs it) and `scrollTo` (ScrollRestoration logs on every render), so both are stubbed in test setup to keep output clean enough to notice real warnings.

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
