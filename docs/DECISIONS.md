# Decisions

Choices made where `IMPLEMENTATION_PLAN.md` left something open or where the repo deliberately differs from the original plan. One line each, newest last.

- Product name is **seal** (not "VK"). CLI binary `seal`; token prefixes `seal_live_` (service) and `seald_` (device); session cookie `seal_session`.
- Internal workspace packages use the `@repo/*` scope from the Turborepo starter. Published packages are `seal-cli` and `seal-sdk`.
- Toolchain versions are whatever the starter installed (Node 24, TypeScript 7, Next 16, ESLint 10). Dependencies are pinned to exact versions, matching the starter.
- Shared tsconfig presets live in `@repo/typescript-config` instead of a root `tsconfig.base.json`.
- `apps/web` uses a `src/` directory (`src/app`, `src/components`, `src/lib`).
- Email provider is not chosen. Sending goes through an `EmailSender` interface; dev and tests use a console sender. Must be decided before Phase 2 ends.
- Postgres driver is `pg` (node-postgres) with Drizzle's `node-postgres` adapter. It works with Neon's pooled connection string and with a plain local Postgres for integration tests.
- IDs are UUIDv7 generated in application code by `newId()` in `@repo/core` (no dependency), not by the database.
- Signup returns the same `201` whether or not the email is already registered, so it cannot be used to find accounts. An existing unverified account gets a fresh verification email.
- Login and device-login hash against a dummy hash when the email is unknown, to keep response timing similar. Both require a verified email.
- Password reset also marks the email verified (the user proved ownership) and deletes all sessions. Devices are not revoked, as the plan only mentions sessions.
- Cookie-authenticated writes require an `Origin` header equal to `WEB_ORIGIN`. The web app's server must send that header when it forwards a session cookie to the API (Phase 5).
- Client IP comes from `x-forwarded-for` (set by Vercel), falling back to the socket address in local dev. Do not expose the API behind another proxy without revisiting this.
- Service token IP allowlists match exact IP strings (no CIDR) for now.
- Emails are awaited inline, so the forgot-password response for a registered address is slightly slower than for an unknown one. Revisit when the email provider is chosen.
- Unhandled errors are logged as the error type plus request id only, never the message, because driver messages can contain row data.
- Integration tests (Phases 2 onward) are deferred until a test database is set up; unit tests are written but have not been run yet. Typecheck, lint and tests have not been run on any phase so far.
- `IMPLEMENTATION_PLAN.md` is intentionally untracked (listed in `.gitignore`).
- Commits are small and prefixed with the phase, e.g. `phase-0: Add Hono API skeleton`.
