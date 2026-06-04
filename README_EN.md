<!-- markdownlint-disable MD033 MD041 -->

# Waline on Worker

[![License: GPL-3.0](https://img.shields.io/badge/License-GPL--3.0-blue.svg)](LICENSE)

A [Waline](https://waline.js.org/) comment system backend implementation running on **Cloudflare Workers**, utilizing **D1 (SQLite)** for data storage. It implements the vast majority of Waline's core features.

---

## Documentation

[Detailed Documentation](docs/README.md)

## Features

- Fast
- Secure
- Markdown syntax support
- Lightweight and easy to use
- Free deployment
- Fully compatible with the `@waline/client` frontend and `@waline/admin` dashboard


|                    | Waline on Worker                                                       |
| ------------------ | ---------------------------------------------------------------------- |
| **Runtime**        | [Cloudflare Workers](https://workers.cloudflare.com/)                  |
| **Database**       | [Cloudflare D1](https://developers.cloudflare.com/d1/) (SQLite)       |
| **Framework**      | [Hono](https://hono.dev/)                                             |
| **Language**       | TypeScript                                                             |

> [!CAUTION]
> **AI-Assisted Development Disclaimer**
>
> The code implementation of this project was primarily driven by AI. Although manual code reviews and testing have been performed as much as possible, **complete parity** with all behaviors of the original Waline Server **cannot be guaranteed**.
>
> Authentication and edge cases have been tested as thoroughly as possible, but **please assess the risks yourself before using it in a production environment.** Issues and Pull Requests are highly welcome to help improve the project.

## Feature Status

- [x] Comment CRUD (Threading, counters, recent comments)
- [x] Page view (PV) statistics
- [x] Comment reactions (Upvote / Downvote)
- [x] Sticky comments (Pin to top)
- [x] User registration / Login
- [x] Comment management (Reviewing, deleting)
- [x] Social login
- [x] Two-Factor Authentication (2FA / TOTP)
- [x] Markdown rendering + XSS protection
- [x] Gravatar avatars
- [x] UA parsing (Browser / Operating System)
- [x] RSS subscription
- [x] Data import/export (Compatible with the @waline/admin migration panel)
- [x] LLM comment moderation (Embedded [waline-plugin-llm-reviewer-next](https://github.com/wuyilingwei/waline-plugin-llm-reviewer-next) design, supporting natural language safety policies)
- [x] Comment default status control (Independent settings for anonymous and logged-in users)
- [x] Admin dashboard (@waline/admin CDN + Worker settings page)
- [x] IP rate limiting (IPQPS) can be directly configured via Cloudflare security rules
- [x] Additional management panel to set default frontend versions, control default comment statuses, configure LLM moderation strategies, and more
- [ ] GitHub OAuth login
- [ ] Email notifications (SMTP)
- [ ] Webhook notifications

> [!NOTE]
> The Akismet anti-spam function is handled via the built-in LLM comment moderation feature—connect any OpenAI-compatible LLM API and set moderation rules using natural language to intelligently audit comments.

## Quick Start

```bash
git clone https://github.com/wuyilingwei/Waline_On_Worker.git
cd Waline_On_Worker
pnpm install

# Create D1 database and edit wrangler.toml
npx wrangler d1 create waline-db
pnpm run db:init
npx wrangler secret put JWT_SECRET
pnpm run deploy
```

Please refer to the [documentation](docs/README.md) for detailed deployment steps and configuration instructions.

## License

[GPL-3.0](LICENSE)
