# template

## Prerequisites

- [Bun](https://bun.sh) v1.3.13+
- PostgreSQL database
- Redis instance

## Setup

```bash
bun install
```

Copy `.env` and configure your environment variables (see `.env` for defaults).

## Database

```bash
bunx prisma generate --schema=prisma/schema/schema.prisma
bunx prisma migrate dev --schema=prisma/schema/schema.prisma
```

## Development

```bash
bun run dev
```

Starts both the **server** (hot-reload) and **worker** in one terminal. Worker output is prefixed with `[worker]`.

## Production

```bash
bun run build
bun run start
```

## API Reference

All endpoints are under `/api/v1/auth`.

### `POST /signup`

Creates an account. Always returns the same generic message to prevent email enumeration.

```json
{ "email": "user@example.com", "password": "securepass123", "name": "John" }
```

### `GET /verify-email`

Verifies email via magic link (click from email).

Query: `?token=<64-char-hex>&email=<email>`

### `POST /verify-email`

Verifies email manually.

```json
{ "token": "64-char-hex", "email": "user@example.com" }
```

### `POST /login`

Authenticates and returns JWT + session token.

```json
{ "email": "user@example.com", "password": "securepass123" }
```

## Auth Architecture

### Security Design

- **No email enumeration** — all auth endpoints return generic messages
- **Magic-link tokens** — `crypto.randomBytes(32)` → 256-bit entropy, SHA-256 hashed in DB
- **Single-use** — tokens marked with `usedAt` timestamp after consumption
- **Short-lived** — tokens expire in 15 minutes (configurable via `TOKEN_EXPIRY_MINUTES`)
- **Old token invalidation** — requesting a new token invalidates all previous unused tokens for that user+type
- **Rate limiting** — 10 requests per 15 minutes per email on auth routes
- **Session tokens** — stored as SHA-256 hashes; raw tokens returned only at creation

### Database Models

| Model                 | Purpose                                                                            |
| --------------------- | ---------------------------------------------------------------------------------- |
| **User**              | email, password (hashed), role, verified, optional pending email                   |
| **VerificationToken** | hashed token, type (`magic_link`, `reset_password`, `new_email`), expiry, `usedAt` |
| **Session**           | hashed token, refresh token, user-agent, IP, 30-day expiry                         |

### Token Flow

```
Signup → generate token (raw + SHA-256)
       → invalidate old tokens for this user+type
       → store hash, return raw
       → email: GET /verify-email?token=<raw>&email=<email>
       → server hashes raw, finds record, marks usedAt
       → user verified, session created, JWT issued
```

### Rate Limiting

Auth routes are limited to **10 requests per 15-minute window** keyed by email address (IP fallback). Returns `429 Too Many Requests`.

## Scripts

| Command             | Description                      |
| ------------------- | -------------------------------- |
| `bun run dev`       | Start dev server + worker        |
| `bun run build`     | Build server + worker            |
| `bun run start`     | Start production server + worker |
| `bun run typecheck` | TypeScript type checking         |
| `bun run lint`      | ESLint                           |
| `bun run format`    | Prettier                         |
| `bun run test`      | Jest tests                       |
