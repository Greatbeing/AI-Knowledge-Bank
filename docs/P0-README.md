# P0 切片：杀死 demo，用真实种子跑起来

> ⚠️ **更正（2026-11-25）**：本切片最初把 18 条手写摘要称作「真实节点」「已验证」，并手填了可信度分数。这个说法撤回。现状：所有手填分数已删除，18 条全部 `claim_verified: false`，`validate_seed.mjs` 只证明出处文件存在、不证明内容正确，页面如实显示「未评测」。这 18 条降为字段样例，不再作为数据源。后续方向见工作区《AI-Knowledge-Bank-多角度评估与定位.md》。

> 分支：`repositioning/evidence-first`。目的：不依赖 Supabase、不 npm install，也能用**真实内容**把站点跑起来，证明「AKB 可以不是空壳」。
> 背景与完整定位见工作区 `AI-Knowledge-Bank-评估与重构方案.md`。

## 这个切片做了什么

| 文件 | 状态 | 说明 |
|---|---|---|
| `data/seed_nodes.json` | 新增 | 18 条**真实**节点（知识 8 / 工具 5 / 案例 5），全部来自你 5 条产线，逐条带 `source_refs` 指向真实文件。**没有一条是虚构 demo。** |
| `scripts/validate_seed.mjs` | 新增 | 零依赖校验器：每条节点必须有 `source_refs`，且每个来源文件必须真实存在，否则判无效、非零退出。照搬 geointel/kb.py 的「无出处不入库」纪律。 |
| `scripts/local-server.mjs` | 新增 | 零依赖本地服务器：提供 `/api/health`、`/api/vaults`、`/api/search`（`source: 'seed'`）+ 静态站点，用于无 npm 环境下预览。 |
| `index.html` | 修改 | 首页统计与卡片接受 `source ∈ {supabase, seed}`；种子态如实标注「本地种子库」。纯增量，不改变现有 Supabase/断链行为。 |

## 验证（本机已跑）

```
node scripts/validate_seed.mjs
# 总节点: 18  有效: 18  无效: 0
# 按库统计: knowledge=8  tool=5  case=5

node scripts/local-server.mjs     # http://127.0.0.1:4318
# /api/vaults → source=seed, stats={knowledge:8,tools:5,cases:5,total:18}
# 首页 → 计数 8/5/5，卡片为真实条目，标签「本地种子库」
```

> 注：本沙箱无法完成 `npm install`（npm 生命周期脚本的 `spawn` 被沙箱拦为 EPERM），所以 `npm run build/test/lint` 需在你的本机执行。本切片用零依赖脚本独立验证了「数据层 + 渲染」这条主链。

## 还差一步：生产接入（建议你 review 后合入）

当前生产 `functions/api/[[path]].js` 仍返回 `source:'fallback'`（虚构 demo）。把种子接成正式数据源，改动很小：

1. 文件顶部加：`import SEED_NODES from '../../data/seed_nodes.json';`
2. 删除 6 条虚构 `const FALLBACK_NODES = [ ... ];`，改成：`const FALLBACK_NODES = SEED_NODES;`
3. 把三处「种子/无 Supabase」返回里的 `'fallback'` 改成 `'seed'`（`handleVaults`、`handleSearch`、`handleNode` 的 fallback 分支）。
4. `handleHealth`：`configured` 之外增加 `reachable`，在 Supabase 拉取失败（如 1016）时置 `false`，避免「configured:true 却连不上」的假阳性。
5. `assets/vault-page.js`：把 `latestSource === 'supabase'` 的相关判断同样扩为 `['supabase','seed'].includes(...)`，种子态标注「本地种子库」。

合入后，即使 Supabase 继续断，线上也会显示真实种子库而不是「—」。Supabase 修通后再切回 `supabase` 源即可。
