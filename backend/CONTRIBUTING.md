# Contributing to PathFinder Backend

Thank you for your interest in contributing! Please follow these guidelines to keep the codebase clean and consistent.

## Getting Started

1. Fork the repository and clone your fork.
2. Copy `.env.example` to `.env` and fill in your values.
3. Install dependencies: `npm install`
4. Apply migrations: `npm run db:migrate`
5. Seed the database: `npm run db:seed`
6. Start the dev server: `npm run dev`

## Branch Naming

| Type | Example |
|------|---------|
| Feature | `feat/chat-history` |
| Bug fix | `fix/login-500-error` |
| Chore | `chore/update-deps` |
| Docs | `docs/api-reference` |

## Commit Style

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(routes): add password-reset flow
fix(auth): handle expired session edge case
docs: update README with Docker instructions
chore: bump prisma to 6.x
```

## Code Style

- ES Modules (`import`/`export`) throughout.
- Async route handlers must be wrapped in `asyncHandler()`.
- All request bodies validated with **Zod** before touching the database.
- Never send `passwordHash`, `tokenHash`, `correctAnswer`, or `riasecType` to the client.

## Pull Request Checklist

- [ ] Code is linted and formatted.
- [ ] All existing routes still respond correctly after your change.
- [ ] New environment variables are documented in `.env.example`.
- [ ] PR description explains *what* and *why*.
