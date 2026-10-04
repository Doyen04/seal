# seal

A secrets manager for developers: a web dashboard, a CLI with an encrypted offline cache, a runtime SDK, and Vercel sync.

This is a pnpm + Turborepo monorepo.

## Layout

| Path                                                   | Purpose                                            |
| ------------------------------------------------------ | -------------------------------------------------- |
| `apps/web`                                             | Next.js dashboard                                  |
| `apps/api`                                             | Hono API (`/v1`)                                   |
| `apps/desktop`                                         | Placeholder, built later                           |
| `packages/core`                                        | Shared zod schemas, types, error codes, API client |
| `packages/crypto`                                      | Envelope encryption, `KeyProvider`, token helpers  |
| `packages/db`                                          | Drizzle schema and migrations                      |
| `packages/cli`                                         | The `seal` command                                 |
| `packages/sdk`                                         | Runtime library for deployed apps                  |
| `packages/ui`                                          | Shared React components                            |
| `packages/eslint-config`, `packages/typescript-config` | Shared tooling config                              |

Design decisions are in [`docs/DECISIONS.md`](docs/DECISIONS.md).

## Requirements

Node 24+ and pnpm (see `packageManager` in `package.json`).

## Commands

```sh
pnpm install
pnpm dev          # run everything in dev mode
pnpm build
pnpm lint
pnpm check-types
pnpm test
pnpm db:migrate   # apply Drizzle migrations to Neon
```

Filter to one package with `pnpm exec turbo <task> --filter=<package>`.

Local env lives in each app's `.env.local` (copy from `.env.example`). `pnpm db:migrate`
reads `apps/api/.env.local` through `dotenv`, so no shell exports are needed. On CI and
Vercel there is no env file, so set the variables in the environment instead.

## Deploy

`vercel.json` at the repo root defines one Vercel project with two services:

| Service | Root            | Public path  | Reached by                        |
| ------- | --------------- | ------------ | --------------------------------- |
| `web`   | `apps/web`      | `/`          | Browsers                          |
| `api`   | `apps/api`      | `/api/v1`    | The web app, over a service binding |

The web app holds the session cookie and proxies browser traffic to the API
through its own `/api/proxy` route, so the API is never called cross-origin by
the browser. It reaches the API server-side over the `API_URL` binding, which
means a preview deployment talks to its own API instance.

Set these once as project environment variables:

| Variable             | Used by | Notes                                                        |
| -------------------- | ------- | ------------------------------------------------------------ |
| `DATABASE_URL`       | `api`   | Neon pooled connection string                                 |
| `MASTER_KEYS`        | `api`   | JSON map of key id to base64 32-byte key                      |
| `MASTER_KEY_CURRENT` | `api`   | Key id used for new writes                                     |
| `EMAIL_FROM`         | `api`   | Sender for verification and reset email                        |
| `CRON_SECRET`        | `api`   | Optional; no cron routes exist yet                             |
| `WEB_ORIGIN`         | both    | The project's own domain, e.g. `https://seal.example.com`      |

`API_URL` is not set by hand. The binding in `vercel.json` injects it at
request time; `apps/web/.env.example` only needs it for local development.

Run migrations by hand against Neon, not in the build:

```sh
DATABASE_URL_UNPOOLED=<neon-direct-connection-string> pnpm --filter @repo/db db:migrate
```

To exercise the service routing locally, use `vercel dev` instead of `pnpm dev`.
