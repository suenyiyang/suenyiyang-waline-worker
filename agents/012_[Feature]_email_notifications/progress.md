# 操作记录

- 现有代码没有任何通知发送路径；`Env` 中的 `SMTP_*` / `SENDER_*` 只是上游变量声明，文档也把它们列为未实现。
- Workers 默认禁用 25 端口且无内置 SMTP 客户端，因此不实现 SMTP 连接，改用 HTTPS 投递：
  - `RESEND_API_KEY`：Resend HTTP API，可向任意邮箱投递（回复提醒必需）。
  - `MAIL` 绑定（Email Routing `send_email`）：无需第三方密钥，但只能投递已验证的目的地址，仅用于管理员通知。
- `src/utils/mail.ts`：传输选择、`MAIL_FROM` → `SENDER_NAME`/`SENDER_EMAIL` 发件人回退、Resend 请求与 `List-Unsubscribe` 头、Email Routing 绑定调用、HTML 模板与转义。
- `src/utils/notify.ts`：
  - 管理员通知：新评论（含待审核），收件人取 `NOTIFY_EMAILS` 或 `wl_Users` 管理员邮箱；管理员自己的评论不通知管理员。
  - 回复通知：`pid` 指向的评论作者，同邮箱自回复跳过；仅 Resend 可投递。
  - 审核通过通知：评论作者；`phase=approved` 时发送。
  - 去重：`wl_Notify(comment_id, kind, recipient)` 唯一索引 + `ON CONFLICT DO NOTHING`，发送失败回滚占位行。
  - 限流：每收件人每小时最多 8 封；静音表 `wl_NotifyMute`。
  - 退订：`HMAC-SHA256(JWT_SECRET, hex(email))` 签名令牌，公开端点写入静音表。
- `src/router/comment.ts`：`runSpamReview` 返回最终状态；`POST` 在 `waitUntil` 中先审查再按最终状态通知（spam 不通知）；`PUT` 仅在状态从非 approved → approved 时通知。
- `schema.sql`：新增 `wl_Notify`（含唯一索引与收件人索引）与 `wl_NotifyMute`。
- 测试：`tests/unit/utils/mail.test.ts`（发件人、传输、Resend 请求体、绑定、转义）与 `tests/integration/notify.test.ts`（17 例，含通过 `app.fetch` + `waitOnExecutionContext` 的真实路由接线）。`tests/helpers/setup.ts` 的 `resetDB` 补齐新表与 `wl_CommentRegion`，避免自增 ID 复用时去重记录串场。
- 验证：`pnpm exec tsc -p tsconfig.json` 通过；`pnpm test` 18 文件 / 240 用例通过；`biome check src/ tests/` 仅保留既有 `userId!` 警告。
- 未执行生产变更：`wrangler whoami` 显示未登录，schema 与密钥需由仓库所有者部署后自行配置。

## 生产配置与验证（2026-11-19）

- 安装 `cf` 1.0.0-rc.1（`npm install --global cf`，pnpm 全局 bin 不在 PATH），OAuth 设备登录。
- `cf d1 query` 重放 `schema.sql`（去注释后 18 条语句全部 success），远程 `waline-db` 新增 `wl_Notify` / `wl_NotifyMute`；原有 11 条评论与账号数据未变。
- `cf workers secrets update RESEND_API_KEY --type secret_text` 写入 Worker `suenyiyang-waline`；`wrangler.toml` 增加 `MAIL_FROM = "YiyangSuen <no-reply@suenyiyang.com>"`。
- Resend 发件域名 `suenyiyang.com` 由仓库所有者完成验证；`wrangler deploy --dry-run` 通过。
- 提交 82fd505 推送 `main`，GitHub 集成自动部署完成。
- 线上验证：`GET /api/notify/unsubscribe` 返回 400（路由已上线）；向 `/notify-selftest` 投稿与回复后，`wl_Notify` 出现 `admin`（评论 18、20）与 `reply`（评论 20）占位记录，说明 Resend 均返回成功；管理员本人评论不产生 `admin` 通知（符合预期）。
- 清理：删除 3 条测试评论、其地区与通知记录，评论总数回到 11、`wl_Notify` 为 0。

## 模板改版（2026-11-19）

- 参照博客源码 `suenyiyang/suenyiyang.com` 的 `src/index.css` 设计令牌重做通知邮件：paper `#FFFCF0` / ink `#100F0F` / hairline `#E6E4D9` / accent `#027AFF`，深色模式沿用 `#100F0F`、`#CECDC3`、`#343331`。
- 排版对齐博客阅读栏：LXGW WenKai 正文（17px/1.9）、IBM Plex Mono 眉标（11px、700、0.16em 大写）与元信息（11px）、1px hairline 规则、引用块用 1px 左边线（无底色）、单一蓝色文字链接，取消卡片/圆角/阴影。
- `buildAdminEmail` / `buildReplyEmail` / `buildApprovedEmail` 抽成纯函数（`TemplateContext` + `formatDate` 以 Asia/Shanghai 输出 `2026.11.19 09:04`），便于单元测试与本地预览。
- 正文按空行拆段渲染（`renderParagraphs`），退订页同步改用同一套令牌与字体。
- 预览与核对：用 vitest 输出 base64 HTML → 截图检查（light/dark 各一张）；新增 `tests/unit/utils/email-templates.test.ts`（8 例）。全套 249 用例通过。
