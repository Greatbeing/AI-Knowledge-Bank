# 本地轻量数据层（P0）

目标：不依赖 Supabase / 云账号，先把「三库 + 读写 API」真正跑起来，让首页显示**真实数据**而不是 demo，并打通「提交 → 审核 → 入库」的最小闭环。生产可把存储换成 Supabase 或 Cloudflare D1，接口层不变。

## 运行

```bash
npm run dev:local        # = node server/dev-server.mjs   → http://127.0.0.1:4319
```

打开首页即可看到三库计数是真实数字、条目是真实方法（不再是 demo，计数不再是「—」）。

## 数据

- 存储：`data/db.json`（`nodes` / `signals`），零依赖，随改随存。
- 种子：9 条**真实方法**（知识 3 / 工具 3 / 案例 3），非虚构 demo。

## 接口（与 `functions/api/[[path]].js` 契约对齐）

| 方法 | 路径 | 作用 |
|---|---|---|
| GET | `/api/health` | 健康：`source=local`、可达、节点/信号计数 |
| GET | `/api/vaults` | 三库分组 + 统计（`source: "local"`） |
| GET | `/api/vaults/:id` | 单节点 |
| GET | `/api/nodes?status=` | 节点列表（可按 `pending`/`validated` 过滤） |
| GET | `/api/search?q=&limit=` | 跨三库检索 |
| GET | `/api/leaderboard` | 按贡献者统计信号数 |
| POST | `/api/community-signals` | 记录验证/使用/分叉/争议信号，更新可信度 |
| POST | `/api/nodes` | 提交新节点（进入 `pending` 审核） |
| POST | `/api/nodes/:id/validate` | 审核：`{decision:"approve"|"reject"}` |

前端（`index.html` / `assets/vault-page.js`）已支持 `source: "local"` 作为真实数据源，与 `supabase` 同等对待。

## 贡献 / 审核界面

本地启动后打开 **http://127.0.0.1:4319/contribute.html**：

- 左侧表单：选择库类型 → 填标题/摘要/标签/出处 → 提交，进入 `pending`；
- 右侧列表：展示待审节点，「通过 ✓ / 驳回 ✕」一键审核；
- 审核通过后节点进入公开三库，真实 `validation_count` 与可信度随之变化；
- 顶部实时显示三库计数与数据源（`local`）。

## 后续（P1+）

- 贡献闭环的**前端**（提交表单、审核界面）——目前 API 已具备，缺 UI。
- 把 store 换成 Cloudflare D1（`functions/api/[[path]].js` 读 D1）以便线上也能用真实数据；静态托管本身无后端。
- 检索升级：先 keyword（现已可用），后 pgvector。

## 状态

- ✅ 本地读：health / vaults / search / leaderboard
- ✅ 本地写：提交节点 → 审核通过 → 入库；记录信号 → 计数与可信度变化
- ✅ 首页接真实数据渲染（计数 3/3/3、卡片「实时数据: 本地库」）
- ✅ 贡献/审核界面 `contribute.html`（提交→待审→通过→入库全链路可点用）
- ⏳ 线上后端（D1/Supabase）——静态托管本身无后端
