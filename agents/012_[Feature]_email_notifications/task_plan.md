# 邮件通知实现计划

- [x] 确认现有评论写入、审核（PUT status）与 spam 审查流程，确定通知触发点。
- [x] 设计投递方式：Workers 无 SMTP 客户端，使用 Resend HTTPS API 与 Cloudflare Email Routing `send_email` 绑定。
- [x] 实现 `src/utils/mail.ts`（传输选择、发件人解析、HTML 模板、HTML 转义）。
- [x] 实现 `src/utils/notify.ts`（管理员/回复/审核通过三类通知、`wl_Notify` 去重、每小时限流、HMAC 退订令牌）。
- [x] 接入 `POST /api/comment`（spam 审查后按最终状态发送）与 `PUT /api/comment/:id`（首次通过审核时发送）。
- [x] 新增 `GET /api/notify/unsubscribe` 退订端点与 `wl_Notify` / `wl_NotifyMute` 幂等 schema。
- [x] 新增 31 个单元/集成用例，覆盖去重、限流、静音、spam、审核流转、路由接线与两种传输。
- [x] 更新中英文文档、特性列表与 `wrangler.toml.example` 示例。
- [ ] 生产启用：重放 `schema.sql`、配置 `RESEND_API_KEY` 与 `MAIL_FROM`（需账户凭据，未执行）。
