# Pilot log

Every time the AI needed a correction, or a tool did something surprising that the AI had to catch. Newest phase first.

## Phase 0 - Bootstrap

**Scaffold ships oxlint, not ESLint.** The plan said ESLint with the react-hooks, jsx-a11y and @tanstack/query plugins. `create-vite` now generates oxlint. Kept it: oxlint covers rules-of-hooks, exhaustive-deps, jsx-a11y, no-explicit-any and consistent-type-imports, verified by linting a deliberately broken file. The tradeoff is losing `@tanstack/eslint-plugin-query`, so query key completeness is enforced by convention and review instead.

**shadcn wrote files into a literal `@/` folder and swapped the utils helper.** `shadcn init` reads the path alias from the root `tsconfig.json`, but Vite's template only declares it in `tsconfig.app.json`. Instead of failing, the CLI created `@/components/ui/button.tsx` at the project root. Fix: declare `paths` in the root tsconfig, roll back and rerun init. Also checked the unfamiliar `cn` dependency before trusting it: it's shadcn's own package (repo `shadcn-ui/cn`), replacing clsx + tailwind-merge. The generated `src/lib/utils.ts` re-export was unused, and `shadcn add` works without it, so it was deleted.

**Playwright tested the wrong app.** Another project's dev server was already on port 5173, and `reuseExistingServer` silently ran the smoke test against it (title "ai-testing"). Fix: e2e runs on its own port, 5317. Lesson: a passing e2e run means nothing until you know which server answered.

**The AI broke a house rule once.** It used `npm pkg set` to edit a package.json script despite the pnpm-only rule. No packages were installed through npm, but the rule is now spelled out in CLAUDE.md.

**A change slipped into the wrong commit.** The `--deny-warnings` lint flag got bundled into the Vitest commit. Caught before pushing and split into its own commit.
