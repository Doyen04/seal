# Decisions

Choices made where `IMPLEMENTATION_PLAN.md` left something open or where the repo deliberately differs from the original plan. One line each, newest last.

- Product name is **seal** (not "VK"). CLI binary `seal`; token prefixes `seal_live_` (service) and `seald_` (device); session cookie `seal_session`.
- Internal workspace packages use the `@repo/*` scope from the Turborepo starter. Published packages are `seal-cli` and `seal-sdk`.
- Toolchain versions are whatever the starter installed (Node 24, TypeScript 7, Next 16, ESLint 10). Dependencies are pinned to exact versions, matching the starter.
- Shared tsconfig presets live in `@repo/typescript-config` instead of a root `tsconfig.base.json`.
- `apps/web` uses a `src/` directory (`src/app`, `src/components`, `src/lib`).
- Email provider is not chosen. Sending goes through an `EmailSender` interface; dev and tests use a console sender. Must be decided before Phase 2 ends.
- `IMPLEMENTATION_PLAN.md` is intentionally untracked (listed in `.gitignore`).
- Commits are small and prefixed with the phase, e.g. `phase-0: Add Hono API skeleton`.
