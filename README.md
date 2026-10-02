# seal

A secrets manager for developers: a web dashboard, a CLI with an encrypted offline cache, a runtime SDK, and Vercel sync.

This is a pnpm + Turborepo monorepo.

## Layout

| Path | Purpose |
| --- | --- |
| `apps/web` | Next.js dashboard |
| `apps/api` | Hono API (`/v1`) |
| `apps/desktop` | Placeholder, built later |
| `packages/core` | Shared zod schemas, types, error codes, API client |
| `packages/crypto` | Envelope encryption, `KeyProvider`, token helpers |
| `packages/db` | Drizzle schema and migrations |
| `packages/cli` | The `seal` command |
| `packages/sdk` | Runtime library for deployed apps |
| `packages/ui` | Shared React components |
| `packages/eslint-config`, `packages/typescript-config` | Shared tooling config |

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
```

Filter to one package with `pnpm exec turbo <task> --filter=<package>`.
