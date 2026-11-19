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
