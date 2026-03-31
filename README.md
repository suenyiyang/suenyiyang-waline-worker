# Waline on Worker

[![License: ALE 1.1 & GPL-3.0](https://img.shields.io/badge/License-ALE%201.1%20%26%20GPL--3.0-blue.svg)](LICENSE)

一个运行在 **Cloudflare Workers** 上的 [Waline](https://waline.js.org/) 兼容评论系统后端，使用 **D1 (SQLite)** 作为数据存储。

> [!CAUTION]
> **AI 辅助开发声明**
>
> 本项目的代码实现主要由 AI (GitHub Copilot / Claude) 主导完成。尽管已经尽可能地进行了人工代码审查和端到端测试，但**无法保证**：
>
> - 与原版 Waline Server 的所有行为完全一致
> - 不存在安全漏洞或逻辑缺陷
> - 涵盖了原版的所有边界情况
>
> **请在生产环境使用前自行评估风险。** 欢迎提交 Issue 和 Pull Request 来帮助改进。

## 特性

- **零服务器成本**：利用 Cloudflare Workers 免费额度
- **前端兼容**：兼容 `@waline/client` 前端组件
- **Serverless 数据库**：使用 Cloudflare D1 (SQLite)
- **Markdown 渲染**：服务端将 Markdown 评论渲染为 HTML，包含 XSS 防护
- **Gravatar 头像**：自动根据邮箱生成头像 URL
- **UA 解析**：解析浏览器和操作系统信息
- **JWT 鉴权**：使用 Web Crypto API 实现的 HS256 JWT
- **PBKDF2 密码哈希**：Workers 兼容的安全密码存储

## 技术栈

| 组件 | 技术 |
|------|------|
| 运行时 | Cloudflare Workers |
| 数据库 | Cloudflare D1 (SQLite) |
| 框架 | [Hono](https://hono.dev/) |
| 语言 | TypeScript |
| 构建 | Wrangler |

## 快速开始

### 前提条件

- [Node.js](https://nodejs.org/) >= 18
- [pnpm](https://pnpm.io/)
- [Cloudflare 账号](https://dash.cloudflare.com/)
- 已安装并登录 [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)

### 一键部署

```bash
# 克隆仓库
git clone https://github.com/wuyilingwei/Waline_On_Worker.git
cd Waline_On_Worker

# 运行部署脚本
# Linux / macOS
chmod +x deploy.sh
./deploy.sh

# Windows (PowerShell)
.\deploy.ps1
```

### 手动部署

```bash
# 1. 安装依赖
pnpm install

# 2. 创建 D1 数据库
npx wrangler d1 create waline-db

# 3. 编辑 wrangler.toml，填入上一步返回的 database_id

# 4. 初始化数据库 Schema
pnpm run db:init

# 5. 设置 JWT 密钥
npx wrangler secret put JWT_SECRET
# 输入一个随机字符串作为密钥

# 6. 部署
pnpm run deploy
```

### 本地开发

```bash
# 初始化本地数据库
pnpm run db:init:local

# 启动开发服务器
pnpm run dev
```

## API 端点

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| `GET` | `/` | 健康检查 | - |
| `GET` | `/api/comment?path=` | 获取评论列表（线程化） | - |
| `GET` | `/api/comment?type=recent` | 最近评论 | - |
| `GET` | `/api/comment?type=count&url=` | 评论计数 | - |
| `GET` | `/api/comment?type=list` | 管理员评论列表 | Admin |
| `POST` | `/api/comment` | 创建评论 | - |
| `PUT` | `/api/comment/:id` | 更新/点赞评论 | Admin/Like |
| `DELETE` | `/api/comment/:id` | 删除评论（级联） | Admin |
| `GET` | `/api/article?url=` | 获取浏览量 | - |
| `POST` | `/api/article` | 增加浏览量/反应 | - |
| `POST` | `/api/user` | 注册用户 | - |
| `GET` | `/api/user` | 用户列表 | -/Admin |
| `PUT` | `/api/user/:id` | 更新用户 | Self/Admin |
| `DELETE` | `/api/user/:id` | 删除/封禁用户 | Admin |
| `POST` | `/api/token` | 登录 | - |
| `GET` | `/api/token` | 获取当前用户信息 | Bearer |
| `DELETE` | `/api/token` | 登出 | - |

> 首位注册的用户自动成为管理员。

## 配置

### 环境变量 (wrangler.toml `[vars]`)

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `SITE_NAME` | 站点名称 | `Waline` |
| `SITE_URL` | 站点 URL | - |
| `SECURE_DOMAINS` | 允许的域名（逗号分隔） | - |
| `AUDIT` | 启用评论审核模式 | - |
| `IPQPS` | IP 频率限制（秒） | - |

### Secrets (通过 `wrangler secret put` 设置)

| Secret | 说明 | 必需 |
|--------|------|------|
| `JWT_SECRET` | JWT 签名密钥 | ✅ |

## 前端对接

在你的网站中使用 `@waline/client`：

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

## 项目结构

```
├── src/
│   ├── index.ts               # Workers 入口 (Hono)
│   ├── env.ts                 # 类型定义
│   ├── router/
│   │   ├── comment.ts         # 评论 CRUD
│   │   ├── article.ts         # 浏览量计数器
│   │   ├── user.ts            # 用户管理
│   │   └── token.ts           # JWT 登录
│   ├── middleware/
│   │   └── auth.ts            # JWT 鉴权中间件
│   └── utils/
│       ├── password.ts        # PBKDF2 密码哈希
│       ├── avatar.ts          # Gravatar 头像
│       ├── ua.ts              # UA 解析
│       └── markdown.ts        # Markdown 渲染
├── schema.sql                 # D1 数据库 Schema
├── wrangler.toml              # Workers 配置
└── deploy.sh / deploy.ps1     # 部署脚本
```

## 尚未实现

以下功能尚未实现，欢迎贡献：

- [ ] 邮件通知（SMTP）
- [ ] Webhook 通知
- [ ] Akismet 反垃圾评论
- [ ] OAuth 第三方登录（GitHub / Google 等）
- [ ] 数据迁移工具（从 LeanCloud / MySQL / PostgreSQL / MongoDB 等）
- [ ] 数据导入导出
- [ ] 两步验证 (2FA / TOTP)
- [ ] IP 频率限制 (IPQPS)
- [ ] Turnstile / reCAPTCHA 验证码

## 许可证

[ALE 1.1 & GPL-3.0](LICENSE)
