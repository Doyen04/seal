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
- `environment_access` overrides apply to editors and viewers only. Admins and owners always have admin access, so an override can never lock a workspace manager out.
- Non-members get `404 NOT_FOUND` for workspace and project routes (existence is not revealed); members with too low a role get `403 FORBIDDEN`. Unknown and foreign project ids return the same message.
- Archived projects are hidden everywhere (`404`) and `resolveAccess` returns `none` for their environments. Their slug stays reserved.
- Invitations can grant `admin`, `editor` or `viewer` only; `owner` is never assignable. They expire after 7 days, and acceptance requires the signed-in user's email to match the invited email. The owner cannot be removed or have their role changed.
- The plan's API list has no endpoints for deleting a workspace, transferring ownership, or managing `environment_access` overrides, so none exist yet (override UI is Phase 10).
- Every write route writes its audit entry in the same transaction as the change. Audit timestamps are set by the app at millisecond precision so pagination cursors are exact.
- Project and workspace creation require an explicit `slug`; it is not derived from the name.
- `IMPLEMENTATION_PLAN.md` is intentionally untracked (listed in `.gitignore`).
- Commits are small and prefixed with the phase, e.g. `phase-0: Add Hono API skeleton`.
