# 状态交接（2026-11-26 凌晨）

> 给明早的自己：这个项目**没有转型**，仍是 AI Knowledge Bank（三库 + 跨库检索 + 社区验证）。个人品牌页只作为独立页 `portfolio.html` 保留。今晚的核心进展是：**把「本地轻量数据层」做出来并跑通了，三库有了真实数据、能读能写**。

## 一句话现状

项目在本地可运行、有真实数据、能完成「提交 → 审核 → 入库」闭环；线上静态站仍受 GitHub Pages 故障影响在恢复，仓库代码是对的。

## 今晚做了什么（已合并进 main）

1. **撤回作品集/个人品牌化的整体改造**，恢复 AI Knowledge Bank 原项目首页（commit `cef394f`）。
2. **保留个人品牌页**为独立页 `portfolio.html`（Apple 风格，邮箱 todobeing@gmail.com），从站点页脚「个人作品」进入，**不是首页**（commit `6e81fa1`）。
3. **本地轻量数据层（P0，已合并 `7fb4f46`）**：
   - `server/dev-server.mjs`：零依赖本地数据服务，读写 `data/db.json`。
   - `data/db.json`：9 条**真实方法**种子（知识/工具/案例各 3），非虚构 demo。
   - `index.html` / `assets/vault-page.js`：支持 `source: "local"` 作为真实数据源。
   - 接口：health / vaults / vaults/:id / search / leaderboard / 社区信号 / 提交节点 / 审核节点。
4. **CI 修复**：Node 20 → 24（`@cloudflare/vite-plugin` 需 Node 22+），保留 `.nvmrc`/`.node-version`。此前 `build/test` 在 CI 上必挂。

## 怎么运行 / 看效果

```bash
npm run dev:local      # = node server/dev-server.mjs → http://127.0.0.1:4319
```
- 首页三库计数显示真实数字（3/3/3），条目是真实方法，标签「实时数据: 本地库」。
- 贡献闭环可跑：`POST /api/nodes` 提交 → `POST /api/nodes/:id/validate` 审核 → 计数/可信度变化。
- 详见 `docs/LOCAL_DEV.md`。

## 已验证

- 本地读：health / vaults / search / leaderboard ✅
- 本地写：提交→审核→入库；记验证信号→计数与可信度变化 ✅
- 首页真实渲染（此前是「—」+ demo）✅
- GitHub Actions CI（Node24）通过 ✅（PR #11）

## 线上状态（外部因素）

- 仓库 main 已是最新且正确；**GitHub Pages 正在从一次全站 5xx 故障中恢复**，构建/发布在排队，线上暂时还是旧缓存（`/portfolio.html` 仍显示旧版页面、页脚入口未出现）。等 GitHub Pages 恢复后会更新。
- Cloudflare `pages.dev` 用的是另一套、长期停在旧构建；且它是**静态站，没有后端**，本地数据层在线上需要 Cloudflare Functions + D1（或 KV）承载，尚未接入。
- 已知：原 Supabase 项目域名已 NXDOMAIN（项目不存在），线上 `/api/*` 一直回退到 demo。

## 下一步（按优先级）

1. **线上后端**：把 `functions/api/[[path]].js` 接到 Cloudflare D1/KV（或重新建 Supabase），让线上也能读写真实数据。**需要你的 Cloudflare 账号/凭据**。
2. **前端贡献 UI**：提交表单 + 审核界面（API 已具备，缺界面），把闭环做成可用产品。
3. **检索升级**：keyword（现已可用）→ pgvector 语义检索。
4. **托管收敛**：CF 与 GitHub Pages 二选一为主，另一做镜像，避免内容不一致。

## 需要你决策

- Cloudflare 账号可用吗？可用的话我接 D1，线上就能真正跑起来。
- 若暂时没有云端资源，就把「本地可运行 + 文档」作为这一阶段成果，先继续补前端贡献 UI。
