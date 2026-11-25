# 转型说明：从知识社区到作品集入口

> 2026-11-25

## 原来想做什么

一个「三库（知识 / 工具 / 案例）+ 跨库检索 + 社区验证与涌现」的 AI 实践知识社区。

## 实际是什么

| 项 | 核实结果 |
|---|---|
| 真实数据 | 没有。线上首页显示的条目是代码里写死的 6 条示例 |
| 后端 | 原先的 Supabase 项目已不存在（域名 NXDOMAIN），接口只会返回示例数据 |
| 社区机制 | 登录、投票、分叉合并、涌现评分都已实现，但从未被任何真实用户使用 |
| 提交历史 | 67 个提交，49 个出自 AI 工具；2026-07-22 之后基本停更 |

## 为什么转向

1. **冷启动没有解。** 验证需要内容，内容需要验证者，一个人启动不了双边社区。
2. **验证基建已经被做完。** 现在 skill 评测有 alibaba/skill-up、NVIDIA/skill-evaluator 等，不需要再造一套。
3. **它需要人持续录入。** 一个要手写条目的库，对只有一个人的作者来说注定空转。

## 现在做什么

**本仓库变成一个作品集入口页：每个仓库一行，写清三件事——讲什么、怎么拿到、凭什么信。**

- `portfolio.html`：入口页。
- `scripts/build-index.mjs`：从 GitHub API 与各仓库 README 生成目录。**没有手写条目。**
- `data/portfolio_index.json`：生成的目录数据。
- `llms.txt`：同一份目录的纯文本版，给程序读。
- `.github/workflows/portfolio-index.yml`：每晚自动重新生成。

「凭什么信」一栏只写事实：有没有测试文件、有没有效果对照及是否已跑、最近一次 CI 的结论。有就写有，没跑就写没跑。

标签也是规则判定的：README 里出现 x402 / 按次计费 / USDC 才算「付费使用」；仓库里有 `SKILL.md` 才算「免费安装」；其余是「开源」。

## 不再做的事

注册登录、投票、声誉、分叉合并、涌现评分、语义检索，以及任何需要手工录入的功能。`supabase/`、`functions/api/`、各 `*.html` 页面保留作记录，不再维护。

## 本地运行

```bash
node scripts/build-index.mjs          # 全量生成（匿名限流 60 次/小时，CI 里带 token 不受限）
node scripts/build-index.mjs --readme # 只重读 README 并重算文字字段，不调用 GitHub API
node scripts/local-server.mjs         # 本地预览，默认 http://127.0.0.1:4318/portfolio.html
```

页面顶部的一句话介绍和联系方式在 `data/portfolio.config.json`，是全站仅有的两处手写文字。
