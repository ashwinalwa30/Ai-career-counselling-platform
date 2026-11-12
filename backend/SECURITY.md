# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.x     | ✅ Yes    |

## Reporting a Vulnerability

If you discover a security vulnerability in this project, **please do not open a public issue**.

Instead, email the maintainers privately at **ashwinalwa30@gmail.com** with:

1. A description of the vulnerability and its potential impact.
2. Steps to reproduce or proof-of-concept code.
3. Any suggested fix or mitigation.

We aim to acknowledge reports within **48 hours** and to release a patch within **14 days** for critical issues.

## Security Best Practices for Deployers

- Never commit your `.env` file to version control.
- Rotate `SESSION_DAYS` tokens regularly and store `GEMINI_API_KEY` in a secrets manager.
- Run behind a reverse proxy (nginx / Caddy) with TLS enabled.
- Keep `NODE_ENV=production` in production to disable verbose Prisma logs.
