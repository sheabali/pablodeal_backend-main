# AGENTS.md — football-game

## Runtime & package manager
- **Bun** (not Node.js). All commands use `bun` / `bunx`.
- `bun install` to install deps. Lockfile: `bun.lock`.

## Two-entrypoint architecture
- `src/server.ts` — Express 5 API server (hot-reloads via `bun --watch`)
- `src/worker.ts` — Background worker (currently just email via BullMQ)
- `bun run dev` starts **both** concurrently via `scripts/dev-runner.ts`. Worker output is prefixed `[worker]`.
- `bun run build` → `bun build src/{server,worker}.ts --outdir dist --target bun`
- `bun run start` runs both from `dist/` using `.env.prod`.

## Available commands
| Command | Action |
|---|---|
| `bun run dev` | Dev server + worker (concurrent) |
| `bun run build` | Build both entrypoints to `dist/` |
| `bun run start` | Production server + worker from `dist/` |
| `bun run typecheck` | `tsc --noEmit` |
| `bun run lint` | `eslint . --fix` |
| `bun run format` | `prettier --write .` |
| `bun run test` | `jest` |
| `bun run email` | React Email dev server (port 3001) |

## Path aliases (tsconfig.json)
- `@/*` → `src/*`
- `@/prisma/*` → `prisma/generated/prisma/*`

Jest config mirrors these via `moduleNameMapper`.

## Database
- **PostgreSQL** via Prisma. Schema: `prisma/schema/schema.prisma`.
- Custom client output: `prisma/generated/prisma/`.
- Prisma config: `prisma.config.ts` (schema dir, migration dir, datasource URL).
- Commands require explicit `--schema`:
  ```bash
  bunx prisma generate --schema=prisma/schema/schema.prisma
  bunx prisma migrate dev --schema=prisma/schema/schema.prisma
  ```
- Redis (ioredis) for BullMQ job queue. `maxRetriesPerRequest: null` required for BullMQ (`src/core/database/redis.ts:17`).

## Testing
- **Jest** with `ts-jest/presets/default-esm`.
- `jest.setup.ts` mocks `Bun.password` (hash + verify) as globals — tests won't run without it.
- `transformIgnorePatterns` exempts `jose` from transformation (ESM-only package in node_modules).

## Code quality
- ESLint: `@eslint/js` + `typescript-eslint` + Prettier plugin.
- `no-console`: warn, `@typescript-eslint/no-explicit-any`: warn, `@typescript-eslint/no-unused-vars`: error (allow `_` prefix).
- Husky + lint-staged: runs `eslint --fix` + `prettier --write` on staged `*.{ts,js}` files.
- tsconfig: strict mode, `noUncheckedIndexedAccess`, `noImplicitOverride`, `noPropertyAccessFromIndexSignature`.

## Env & config
- Env vars validated at startup by Zod (`src/core/config/env.ts`). Missing vars cause `process.exit(1)` with error details.
- Required vars: `DATABASE_URL`, `TMDB_API_KEY`. Many have sensible dev defaults.
- Dev uses `.env` (via `--env-file=.env`). Production uses `.env.prod`.

## Key dependencies
- Express 5, Prisma 7, BullMQ, React Email / Nodemailer, `jose` (JWT), `pino` (logging), zod, `@prisma/adapter-pg`.

## Project structure
```
src/
  server.ts          # Express server entrypoint
  worker.ts          # BullMQ worker entrypoint
  app.ts             # Express app setup (middleware, routes, bullboard, error handler)
  core/              # Config, database (Prisma + Redis), logger, middleware, utils, constants, errors
  features/          # Feature modules (e.g. bullboard, tmdb-movies)
  routes/            # Express routers (currently empty router at index.ts)
  services/          # Business logic: email (React templates, BullMQ jobs, providers)
  types/             # TypeScript declarations
scripts/
  dev-runner.ts      # Concurrent spawn of server + worker (dev)
  start-runner.ts    # Concurrent spawn of server + worker (prod)
prisma/
  schema/
    schema.prisma
  generated/prisma/  # Prisma client output
```
