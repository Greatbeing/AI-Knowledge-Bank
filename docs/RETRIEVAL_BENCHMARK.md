# 检索基准试点：结构化/压缩表示是否提升检索质量？

> 对应 ADR-0002（Reuse Before Build）与 ADR-0003（Capability Compression）的最小可复现验证。
> 结论仅基于**现有 9 条真实节点 + 12 条人工标注查询**，是方向性证据，不是定论。

## 问题

如果把知识/能力条目从「原始文本」压缩成**结构化表示**（分字段 + 归一化标签 + n-gram 词元），再做检索，是否比当前的检索方式更容易找对条目？

## 方法

零依赖离线评测器 `scripts/retrieval-eval.mjs`，对同一份条目、同一份人工标注基准，跑三种策略（唯一的自变量是「表示与匹配方式」）：

| 策略 | 表示/匹配 |
|---|---|
| `literal` | 复刻当前 `/api/search`：整串 query 作为子串匹配标题/摘要/标签 |
| `keyword` | 无字段权重的 n-gram 词元重叠（中文 bi/tri-gram + 拉丁词） |
| `structured` | 结构化表示：分字段加权（名称×4、标签×3、描述×2、摘要×2）+ n-gram 词元 |

- 目录：`data/db.json`（9 条真实方法节点）
- 基准：`data/retrieval-benchmark.akb.json`（12 条人工标注，覆盖口语化/改写/专业化问法）
- 指标：Recall@3、MRR、nDCG@3、P@1、P@3

## 结果（k = 3）

| 策略 | Recall@3 | MRR | nDCG@3 | P@1 | P@3 |
|---|---|---|---|---|---|
| `literal`（当前行为） | 0.0000 | 0.0000 | 0.0000 | 0.0000 | 0.0000 |
| `keyword` | 1.0000 | 0.9028 | 0.9276 | 0.8333 | 0.3333 |
| `structured` | 1.0000 | **0.9583** | **0.9692** | **0.9167** | 0.3333 |

## 解读

1. **主要收益来自「表示压缩」本身**：把自然语言 query 和条目都落成 n-gram 词元后，Recall 从 0 升到 1、MRR 从 0 升到 0.90——`literal` 全 0 说明当前「整串子串匹配」对自然语言问法基本失效。
2. **字段加权是次要增益**：在词元重叠之上，`structured` 相对 `keyword` 的 MRR +0.055、nDCG +0.042、P@1 +0.083。原因是名称/标签被更高权重，减少了摘要长文本的稀释。
3. **P@3 三者相同（0.3333）**：每条查询只有 1 个相关项、k=3，这是指标定义决定的，不代表检索无差别；看 MRR/nDCG/P@1 更有区分度。

## 局限

- 只有 9 条条目、12 条查询，标签是单人标注，需要独立复核与更大规模目录。
- 纯词法，无向量检索、重排、个性化或 query 扩展。
- `structured` 的字段权重是启发式，未调参。
- 结论是**相对排序信号**，不代表能力质量或执行可信度。

## 复现

```bash
npm run bench:retrieval
# 或
node scripts/retrieval-eval.mjs --catalog data/db.json --benchmark data/retrieval-benchmark.akb.json
```

## 下一步

- 把基准扩到 50+ 查询与更大目录（含 Phase-1 能力目录）。
- 用同一评测器对比「加向量召回 / 交叉编码器重排」的增量。
- 若 `structured` 优势在扩样后仍成立，再把它接进 `/api/search` 与前端检索。
## 只读导入器（目录压缩，零依赖离线）

scripts/build-catalog.mjs 把 data/db.json 的真实节点压缩成能力目录 data/catalog.local.json（标准字段 + provenance），基准可直接消费该目录：

`ash
npm run catalog:build          # 生成 data/catalog.local.json
npm run catalog:check          # CI：校验产物是否最新
node scripts/retrieval-eval.mjs --catalog data/catalog.local.json
`

- 只读：不联网、不执行资产、不写数据库；draft/ejected 不入目录。
- 确定性：产物不含时间戳，可直接纳入版本库并用 --check 校验。
- 用目录跑基准的指标与直接用 data/db.json 完全一致（9 条 / 12 查询）。
