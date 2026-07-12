# 🚀 AI Knowledge Bank 部署上线指南

本指南将帮助您在 **5 分钟内** 将项目免费部署到公网，获得永久访问链接。

---

## 📋 部署前准备

### 1. 检查文件完整性
确保以下核心文件存在：
- ✅ `index.html` - 主页面
- ✅ `dashboard.html` - 用户控制台
- ✅ `functions/api/[[path]].js` - Cloudflare Pages 后端 API
- ✅ `lib/auth.ts` - 认证逻辑
- ✅ `supabase/migrations/*.sql` - 数据库迁移文件

### 2. 创建 Supabase 项目 (后端服务)
1. 访问 [supabase.com](https://supabase.com) 并注册/登录
2. 点击 **"New Project"**
3. 填写项目信息：
   - Name: `ai-knowledge-bank`
   - Database Password: (保存好这个密码)
   - Region: 选择离您最近的区域
4. 等待项目创建完成 (约 2 分钟)

### 3. 运行数据库迁移
1. 进入项目 → **SQL Editor**
2. 依次复制并执行以下文件内容：
   - `supabase/migrations/001_cas_emergence_algorithm.sql`
   - `supabase/migrations/002_user_system.sql`
   - `supabase/migrations/003_knowledge_workflow.sql` (如果存在)
   - `supabase/migrations/004_three_vault_cross_rag.sql`
3. 每次执行后确认显示 "Success"

### 4. 配置 OAuth 登录 (GitHub)
1. 在 Supabase 项目 → **Authentication** → **Providers**
2. 启用 **GitHub**
3. 需要创建 GitHub OAuth App：
   - 访问 [github.com/settings/developers](https://github.com/settings/developers)
   - 点击 **"New OAuth App"**
   - 填写：
     - Application name: `AI Knowledge Bank`
     - Homepage URL: (先留空，部署后回填)
     - Authorization callback URL: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
       - `YOUR_PROJECT_REF` 在 Supabase 项目设置 → API 中找到
   - 复制 **Client ID** 和 **Client Secret**
4. 将 Client ID 和 Secret 填入 Supabase 并保存

### 5. 获取 Supabase 配置信息
在 Supabase 项目 → **Settings** → **API** 中复制：
- **Project URL**: `https://xxxxx.supabase.co`
- **anon/public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **service_role key**: 仅用于 Cloudflare Pages Functions，不要写入前端代码

---

## 🌐 部署方案 (三选一)

### 方案 A: Cloudflare Pages (推荐 ⭐⭐⭐⭐⭐)
**优点**: 静态前端和 `/api/*` 后端接口在同一域名下运行，适合当前三库两引擎架构

#### 步骤:
1. **推送代码到 GitHub**
   ```bash
   git push origin main
   ```

2. **构建项目**
   ```bash
   npm install
   npm run check:text
   npm run lint
   npm run build
   ```

3. **部署到 Cloudflare Pages**
   ```bash
   npx wrangler pages deploy dist --project-name aiknowledgebank --branch main
   ```

4. **配置后端环境变量**
   - Cloudflare Dashboard → Pages → `aiknowledgebank` → Settings → Environment variables
   - 添加：
     - `SUPABASE_URL`
     - `SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `VITE_SUPABASE_URL` (如需浏览器侧登录)
     - `VITE_SUPABASE_ANON_KEY` (如需浏览器侧登录)
   - `SUPABASE_SERVICE_ROLE_KEY` 只放在 Cloudflare 环境变量中，不要提交到仓库

5. **验证接口**
   - 打开 `https://aiknowledgebank.pages.dev/api/health`
   - 搜索接口示例：`https://aiknowledgebank.pages.dev/api/search?q=marketing&locale=zh`
   - 首页搜索面板会显示“后端已连接”或“演示数据模式”

---

### 方案 B: Netlify (静态备选 ⭐⭐⭐)
**优点**: 拖拽部署、简单的界面。注意：Netlify 只作为静态镜像时，不会运行本项目的 Cloudflare Pages Functions。

#### 步骤:
1. **使用 Netlify CLI**
   ```bash
   npm install -g netlify-cli
   netlify login
   netlify init
   netlify deploy --prod
   ```

2. **或拖拽部署**
   - 访问 [app.netlify.com/drop](https://app.netlify.com/drop)
   - 将整个 `/workspace` 文件夹拖入上传区域
   - 获得临时链接，可绑定自定义域名

---

### 方案 C: GitHub Pages (最简单 ⭐⭐⭐)
**优点**: 无需额外账户、完全免费、适合静态站点。注意：GitHub Pages 不运行 `/api/*` 后端，首页会自动调用 Cloudflare Pages API 或回退到演示数据。

#### 步骤:
1. 推送代码到 GitHub (同方案 A 第 1 步)

2. 启用 GitHub Pages:
   - 进入仓库 → **Settings** → **Pages**
   - Source: 选择 `main` 分支
   - Folder: 选择 `/ (root)`
   - 点击 **Save**

3. 等待 1-2 分钟
   - 获得链接：`https://YOUR_USERNAME.github.io/ai-knowledge-bank/`

---

## 🔧 部署后配置

### 1. 更新部署环境变量
在 Cloudflare Pages 中设置环境变量，不要把密钥写入前端代码：

```env
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

### 2. 回填 OAuth 回调 URL
将部署后的域名添加到：
- GitHub OAuth App 的 **Homepage URL**
- Supabase 的 **Site URL** 和 **Redirect URLs**

### 3. 测试完整流程
- [ ] 打开部署链接
- [ ] 打开 `/api/health` 检查后端状态
- [ ] 打开 `/api/search?q=marketing&locale=zh` 检查 Cross-Vault RAG 接口
- [ ] 点击 "Sign In" 测试 OAuth 登录
- [ ] 检查 Dashboard 是否显示用户信息
- [ ] 测试知识节点浏览功能
- [ ] 验证移动端响应式布局

---

## 🎯 生产环境优化建议

### 安全性
- [ ] 启用 Supabase Row Level Security (RLS)
- [ ] 配置 CSP (Content Security Policy) 头
- [ ] 启用 HTTPS (Vercel/Netlify 默认开启)
- [ ] 限制 API 调用频率

### 性能
- [ ] 启用图片 CDN (如 Cloudinary)
- [ ] 配置浏览器缓存策略
- [ ] 压缩 HTML/CSS/JS 文件
- [ ] 使用懒加载优化首屏

### 监控
- [ ] 集成 Google Analytics 或 Plausible
- [ ] 设置错误追踪 (Sentry)
- [ ] 配置 Uptime 监控 (UptimeRobot)

---

## 🆘 常见问题排查

### Q: 部署后页面空白
**A**: 打开浏览器开发者工具 (F12) 查看 Console 错误
- 如果是 CORS 错误：检查 Supabase URL 是否正确
- 如果是 404 错误：确认文件路径大小写敏感

### Q: OAuth 登录失败
**A**: 检查以下配置：
- GitHub OAuth 的 Callback URL 是否与 Supabase 一致
- Supabase 的 Site URL 是否包含您的部署域名
- 浏览器是否阻止了第三方 Cookie

### Q: 数据库连接超时
**A**: 
- 确认 Supabase 项目状态为 "Active"
- 检查防火墙规则 (Supabase → Database → Configuration)
- 验证 anon key 是否正确复制

---

## 📊 部署检查清单

```markdown
- [ ] Supabase 项目已创建
- [ ] 数据库迁移脚本已执行
- [ ] OAuth 提供商已配置
- [ ] 代码已推送到 GitHub
- [ ] `npm run check:text` 通过
- [ ] Cloudflare Pages 部署成功
- [ ] GitHub Pages 静态镜像部署成功
- [ ] 环境变量已配置
- [ ] `/api/health` 返回正常
- [ ] OAuth 回调 URL 已更新
- [ ] 登录功能测试通过
- [ ] 移动端适配测试通过
- [ ] 自定义域名已绑定 (可选)
```

---

## 🎉 恭喜上线！

现在您可以将部署链接分享给朋友、同事或社区成员，开始收集真实用户反馈！

**下一步建议**:
1. 添加分析追踪了解用户行为
2. 收集用户反馈迭代产品
3. 规划 v1.0 功能路线图
4. 编写技术博客分享开发经验

如有任何问题，欢迎查阅文档或提交 Issue！
