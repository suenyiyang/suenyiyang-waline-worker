# Waline on Worker - Detailed Documentation

## Deployment

This repository deploys automatically through the Cloudflare Workers GitHub integration: every new commit pushed to `main` is built and released. There is no manual `wrangler deploy` step or deployment script.

### Initial setup

Prepare the D1 database and secrets once; later deployments need no manual steps:

```bash
pnpm install

# Create the D1 database and put the returned database_id into wrangler.toml
pnpm exec wrangler d1 create waline-db

# Apply the schema to the remote database
pnpm run db:init

# Set the JWT secret (enter a random string)
pnpm exec wrangler secret put JWT_SECRET
```

After that, push the commits to `main` to deploy.

### Local Development

```bash
# Initialize local database
pnpm run db:init:local

# Start development server
pnpm run dev
```

---

## Alternative deployment: Overture

Open the [Overture deployment page](https://overture.voidcarve.com/?src=lsy-404/Waline_On_Worker), then select a release from this repository. It creates or reuses D1, applies the schema, deploys the Worker, and generates `JWT_SECRET` for a first deployment. A custom domain is optional: leave it empty for the Worker’s `workers.dev` address, or provide one to attach it.

Choose **OAuth**, only when the Overture instance has enabled and configured it, to authorize Workers Scripts, D1, and the route and zone permissions needed for an optional custom domain; otherwise use an **Account API Token** created and pasted from Overture's prefilled permission template. The token is used only for this deployment and never becomes an application credential. Regular updates retain comment data and `JWT_SECRET`; a full rebuild retains D1 data but creates a new secret and invalidates login sessions. An empty CORS origins field during an update preserves `SECURE_DOMAINS`; clear or change it in the Cloudflare Dashboard Worker variables. To retain the ability to provide a custom domain, the OAuth and API Token permission template still lists route and zone access even when you leave the domain empty. Read and accept the package’s complete English and Chinese terms before deployment; they explain account charges, credential handling, and data responsibilities.

# API Endpoints

## Comments

| Method | Path                           | Description                   | Authentication |
| ------ | ------------------------------ | ----------------------------- | -------------- |
| GET    | `/api/comment?path=`           | Get comment list (threaded)   | None           |
| GET    | `/api/comment?type=recent`     | Recent comments               | None           |
| GET    | `/api/comment?type=count&url=` | Comment count                 | None           |
| GET    | `/api/comment?type=list`       | Admin comment list            | Admin          |
| GET    | `/api/comment/rss`             | RSS feed                      | None           |
| POST   | `/api/comment`                 | Create comment                | None           |
| PUT    | `/api/comment/:id`             | Update comment / like comment | Admin / Like   |
| DELETE | `/api/comment/:id`             | Delete comment (cascading)    | Admin          |

## Articles

| Method | Path                | Description                     | Authentication |
| ------ | ------------------- | ------------------------------- | -------------- |
| GET    | `/api/article?url=` | Get page views                  | None           |
| POST   | `/api/article`      | Increase page views / reactions | None           |

## Users

| Method | Path            | Description        | Authentication |
| ------ | --------------- | ------------------ | -------------- |
| POST   | `/api/user`     | Register user      | None           |
| GET    | `/api/user`     | User list          | None / Admin   |
| PUT    | `/api/user/:id` | Update user        | Self / Admin   |
| DELETE | `/api/user/:id` | Delete or ban user | Admin          |

## Authentication

| Method | Path             | Description               | Authentication |
| ------ | ---------------- | ------------------------- | -------------- |
| POST   | `/api/token`     | Login                     | None           |
| GET    | `/api/token`     | Get current user info     | Bearer Token   |
| DELETE | `/api/token`     | Logout                    | None           |
| POST   | `/api/token/2fa` | Two-factor authentication | Bearer Token   |

## OAuth

| Method | Path                         | Description       | Authentication |
| ------ | ---------------------------- | ----------------- | -------------- |
| GET    | `/api/oauth?type=<provider>` | Start OAuth login | None           |

Supported OAuth providers (`type` parameter):

* github
* twitter
* facebook
* weibo
* qq

OAuth login is handled through an external OAuth proxy service (default: `https://oauth.lithub.cc`), which can be customized via the `OAUTH_URL` environment variable.

## Data Management

| Method | Path                       | Description                          | Authentication |
| ------ | -------------------------- | ------------------------------------ | -------------- |
| GET    | `/api/db`                  | Export all data (Waline JSON format) | Admin          |
| POST   | `/api/db?table=`           | Import a single record               | Admin          |
| PUT    | `/api/db?table=&objectId=` | Update imported data                 | Admin          |
| DELETE | `/api/db?table=`           | Clear specified table                | Admin          |

## Settings

| Method | Path            | Description     | Authentication |
| ------ | --------------- | --------------- | -------------- |
| GET    | `/api/settings` | Get settings    | Admin          |
| PUT    | `/api/settings` | Update settings | Admin          |
| GET    | `/api/notify/unsubscribe?token=` | Opt out of reply emails | Signed token |

## Admin Panel

| Path                 | Description                 |
| -------------------- | --------------------------- |
| `/ui`                | @waline/admin dashboard     |
| `/ui/worker-setting` | Worker custom settings page |

> The first registered user automatically becomes an administrator.

---

# Data Import & Export

This project provides a `/api/db` endpoint fully compatible with the `@waline/admin` dashboard, supporting standard Waline JSON import/export.

## Importing & Exporting via Admin Panel

1. Visit `/ui` and log in as an administrator.
2. Open the **Import/Export** page.
3. **Export:** Click Export to download `waline.json`.
4. **Import:** Select a previously exported `waline.json` file and import it.

## Importing via Wrangler CLI

For large datasets, direct D1 database operations are recommended:

```bash
# Export to SQL
pnpm exec wrangler d1 export <database-name> --remote --output=backup.sql

# Import from SQL
pnpm exec wrangler d1 execute <database-name> --remote --file=backup.sql
```

### Warning: Large Data Imports

When importing hundreds of records or more through the admin panel, Cloudflare Workers request timeouts or D1 concurrency limits may cause **500 errors**.

Recommended solutions:

1. **Chunked imports** – Split JSON into batches of around 500 records.
2. **Use Wrangler CLI** – More reliable for large migrations.
3. **Use migration scripts** – See `migrate.ts` or `migrate-d1.ts`.

---

# Configuration

## Environment Variables (`wrangler.toml [vars]`)

| Variable       | Description                       | Default |
| -------------- | --------------------------------- | ------- |
| SITE_NAME      | Site name                         | Waline  |
| SITE_URL       | Site URL                          | None    |
| SECURE_DOMAINS | Allowed domains (comma-separated) | None    |
| DISABLE_USERAGENT | Hide browser and OS when set to a non-empty value other than `false` or `0`; environment variable alias: `DISABLE_AGENT` | Off |
| AVATAR_PROXY | Proxy service URL used by clients to load avatars; unset, `false`, or `0` uses direct URLs | Unset |
| LEVELS | Comma-separated, strictly increasing non-negative integer thresholds; unset, empty, `false`, `0`, or invalid values disable levels | Off |
| DISABLE_REGION | Hide public region data when set to `true` or another non-empty value other than `false` or `0`; admins can still see it | Off |

Display configuration details:

- `DISABLE_USERAGENT` is off when unset, empty, `false`, or `0` (case-insensitive), preserving browser and OS display. Any other value hides them. If both the official variable and `DISABLE_AGENT` are set, an explicit value of the official variable takes precedence. Administrators can still see the raw UA.
- When `AVATAR_PROXY` is unset, empty, `false`, or `0`, Gravatar and custom avatars are loaded directly. When set to a proxy service URL, clients access that service with the encoded custom avatar URL in its `?url=` parameter. The Worker only generates the proxy URL; it does not forward image data. This applies to comment, user profile, and login-related avatars.
- `LEVELS` is disabled when unset, empty, `false`, or `0`. Example: `0,10,20,50,100,200`. Thresholds use the count of public, approved comments across pages. Logged-in users are grouped by `user_id`; anonymous comments are grouped by email. Without an email, the level is 0. The response's integer `level` field is displayed using the client's `locale.levelN` text.
- When a new comment is submitted, the Worker uses only Cloudflare's [`request.cf` country, region, and city data](https://developers.cloudflare.com/workers/runtime-apis/request/#incomingrequestcfproperties). It does not trust request bodies or geolocation headers and does not use the reader's location. Public comment `addr` contains the country code and region; administrators can also receive the city with `type=list`. If Cloudflare provides no data (for example, on local or preview requests), or an older comment has no region record, no region `addr` is returned. Older comments are not backfilled. When `DISABLE_REGION` is unset, empty, `false`, or `0`, public region display remains enabled. Set it to `true` or any other non-empty value to hide public `addr`; administrators can still see region data.

Region data is stored in `wl_CommentRegion` and is deleted with its comment through a foreign-key cascade. Admin-panel Comment JSON export/import includes the optional `cfRegion: { country, region, city }` field for region backup.

For an existing deployment, idempotently reapply `schema.sql` to create the region table, then push to `main` to trigger the automatic Worker deployment:

```bash
pnpm exec wrangler d1 execute <database-name> --remote --file=./schema.sql
```

## Feature support and platform boundaries

The display variables `DISABLE_REGION`, `DISABLE_USERAGENT` (and its `DISABLE_AGENT` alias), `AVATAR_PROXY`, and `LEVELS` are wired into the Worker.

The following upstream variables and integrations are not implemented, so setting them does not enable the corresponding feature (the `LOGIN` variable does not control the login feature): `LOGIN`, `SERVER_URL`, `GRAVATAR_STR`, `COMMENT_AUDIT`, `MARKDOWN_*`, `SMTP_SERVICE` / `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS`, `DISABLE_AUTHOR_NOTIFY`, `WEBHOOK`, server-side verification with `TURNSTILE_SECRET` / `RECAPTCHA_V3_SECRET`, and `IPQPS` environment-variable rate limiting. The project has its own `AUDIT` setting; it is different from the upstream `COMMENT_AUDIT` variable. Email notifications are implemented, but through HTTPS providers such as Resend or Email Routing; the `SMTP_*` connection settings are not read, and the kill switch is the custom `DISABLE_EMAIL_NOTIFY`. `SENDER_NAME` / `SENDER_EMAIL` are used as the sender fallback. The frontend Captcha key is currently injected only into the admin page and does not provide complete bot verification. These integrations can be implemented later; this does not mean Workers cannot support them.

This backend uses D1. Upstream storage-driver variables such as `MONGO_*`, `MYSQL_*`, `PG_*` / `POSTGRES_*`, `LEAN_*`, `GITHUB_*`, and `TCB_*` do not switch this project to those databases. This is the current backend choice, not a claim that Workers cannot connect to other databases.

Actual limits and guarantees:

- Region data comes only from Cloudflare `request.cf` on new comment requests. It cannot backfill older comments without stored region data. If Cloudflare provides no location data, a reliable country, region, or city cannot be shown; this implementation does not expose exact coordinates. [Cloudflare `request.cf` documentation](https://developers.cloudflare.com/workers/runtime-apis/request/#incomingrequestcfproperties)
- Anonymous levels are grouped by email. An email address is not an authenticated identity, so a level cannot be guaranteed to represent a real or unique person.
- Avatar proxying generates a third-party service URL with `?url=` for clients to fetch. This project does not relay the image and cannot guarantee the external service's availability.
- The Workers `/tmp` filesystem does not persist across requests, so a traditional `SQLITE_PATH` or host filesystem path cannot be used unchanged as a persistent database file. [Node.js file-system documentation](https://developers.cloudflare.com/workers/runtime-apis/nodejs/fs/)
- Workers disable TCP port 25 by default and the runtime ships no SMTP client, so notifications use HTTPS mail providers instead — see [Email notifications](#email-notifications). [TCP sockets documentation](https://developers.cloudflare.com/workers/runtime-apis/tcp-sockets/)

## Secrets (via `wrangler secret put`)

| Secret          | Description                                                         | Required               |
| --------------- | ------------------------------------------------------------------- | ---------------------- |
| JWT_SECRET      | JWT signing secret                                                  | Yes                    |
| RESEND_API_KEY  | Resend API key; required to mail arbitrary commenters (reply alerts) | When using email alerts |

## Email notifications

Comment notifications are delivered over HTTPS mail services; no SMTP connection is opened. Two transports are supported, and Resend wins when both are configured:

| Transport | Reachable recipients | Notes |
| --------- | -------------------- | ----- |
| Resend (`RESEND_API_KEY`) | Any address | Recommended; required for reply and approval alerts |
| Cloudflare Email Routing (`MAIL` binding) | Verified destinations in the account only | No third-party key; administrator alerts only |

When mail is sent:

| Event | Recipient |
| ----- | --------- |
| New comment (published or awaiting moderation) | Administrators: `NOTIFY_EMAILS`, otherwise the emails of `wl_Users` rows with `type = 'administrator'` |
| Published reply | Author of the comment being replied to (`pid`) |
| Pending comment approved | The comment author and the author of the parent comment |

- Spam comments never send mail, and administrators do not get admin alerts for their own comments.
- Each (comment, kind, recipient) triple is mailed at most once (`wl_Notify` dedupe), so approving a comment does not resend earlier alerts.
- At most 8 messages per recipient per hour; further notifications in that window are skipped.
- Reply and approval alerts include a signed unsubscribe link. It writes to `wl_NotifyMute` and works without logging in.
- Delivery runs in `waitUntil`, is best-effort, and never changes the comment API response.

Configuration:

| Variable | Description | Required |
| -------- | ----------- | -------- |
| `RESEND_API_KEY` | Resend API key; prefer `wrangler secret put` | For reply alerts |
| `MAIL_FROM` | Sender, e.g. `Blog <notify@yourdomain.com>`; the domain must be verified in Resend | For any email |
| `NOTIFY_EMAILS` | Comma-separated administrator recipients; defaults to administrator account emails | - |
| `MAIL_REPLY_TO` | Optional Reply-To address | - |
| `SENDER_NAME` / `SENDER_EMAIL` | Sender fallback when `MAIL_FROM` is unset (upstream variables) | - |
| `DISABLE_EMAIL_NOTIFY` | Any value other than `false`/`0` disables all comment email | - |

Enabling this on an existing deployment requires idempotently reapplying `schema.sql` to create `wl_Notify` and `wl_NotifyMute`:

```bash
pnpm exec wrangler d1 execute <database-name> --remote --file=./schema.sql
```

To use Cloudflare Email Routing only, enable Email Routing on the domain, verify the destination address, then add the binding in `wrangler.toml` (optionally restricting recipients with `allowed_destination_addresses`):

```toml
[[send_email]]
name = "MAIL"
```

## Worker Settings (configured via `/ui/worker-setting`)

| Setting                     | Description                                                   | Default  |
| --------------------------- | ------------------------------------------------------------- | -------- |
| waline_client_version       | @waline/client CDN version                                    | None     |
| comment_default_status      | Default status for anonymous comments (approved/waiting/spam) | approved |
| user_comment_default_status | Default status for logged-in user comments                    | approved |
| worker_display              | Show Worker extension menu in admin panel                     | None     |
| llm_mode                    | LLM moderation mode (off/anonymous/all)                       | off      |
| llm_skip_admin              | Skip LLM moderation for admin comments                        | None     |
| llm_endpoint                | LLM API endpoint URL                                          | None     |
| llm_api_key                 | LLM API key                                                   | None     |
| llm_model                   | LLM model name                                                | None     |
| llm_prompt                  | LLM moderation prompt                                         | None     |

## OAuth Configuration

| Variable  | Description             | Default                   |
| --------- | ----------------------- | ------------------------- |
| OAUTH_URL | OAuth proxy service URL | `https://oauth.lithub.cc` |

OAuth login uses an external proxy service to handle Client IDs and Secrets, so platform credentials do not need to be configured inside the Worker.

Supported providers:

* GitHub
* Twitter
* Facebook
* Weibo
* QQ

---

# Front-End Integration

Use `@waline/client` in your website:

```html
<script src="https://unpkg.com/@waline/client@v3/dist/waline.js"></script>
<link rel="stylesheet" href="https://unpkg.com/@waline/client@v3/dist/waline.css" />

<div id="waline"></div>

<script>
  Waline.init({
    el: '#waline',
    serverURL: 'https://your-worker-name.your-subdomain.workers.dev',
  });
</script>
```

---

# Project Structure

```text
src/
├── index.ts               # Workers entry (Hono + CORS + auth + version)
├── env.ts                 # Type definitions
├── router/
│   ├── comment.ts         # Comment CRUD + LLM moderation
│   ├── article.ts         # Page views/reaction counters
│   ├── user.ts            # User management
│   ├── token.ts           # JWT login + 2FA
│   ├── oauth.ts           # OAuth login
│   │                      # (GitHub/Twitter/Facebook/Google/Weibo/QQ)
│   ├── settings.ts        # Worker settings management
│   │                      # (API keys returned masked)
│   └── db.ts              # Data import/export
├── middleware/
│   └── auth.ts            # JWT authentication middleware
├── ui/
│   ├── admin-panel.ts     # @waline/admin dashboard
│   ├── custom-admin.ts    # Custom Worker settings page
│   └── waline-page.ts     # Waline comments page
└── utils/
    ├── password.ts        # PBKDF2 password hashing
    ├── avatar.ts          # Gravatar avatars
    ├── ua.ts              # User-Agent parsing
    ├── markdown.ts        # Markdown rendering
    ├── llm-review.ts      # LLM comment moderation
    └── totp.ts            # TOTP two-factor authentication

schema.sql                 # D1 database schema
migrate.ts                 # LeanCloud migration
migrate-d1.ts              # D1-to-D1 migration
wrangler.toml              # Workers configuration
```

### Summary

This project is a Cloudflare Workers + D1 implementation of **Waline**, providing:

* Comment system
* Admin dashboard
* JWT authentication
* Two-factor authentication (2FA)
* OAuth login
* Data import/export compatibility with Waline
* LLM-powered comment moderation
* Cloudflare D1 storage
* One-click deployment support
* Full compatibility with `@waline/client` and `@waline/admin`
