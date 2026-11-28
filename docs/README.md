# 项目文档中心

AI Knowledge Bank 的长期产品与工程基线文档。

- [项目总开发文档](PROJECT_DEVELOPMENT_BLUEPRINT.md)：产品章程、PRD、技术架构、安全模型、能力贡献规范、长期路线图和治理。
- [Phase 1 仓库盘点与接入设计](PHASE_1_REPOSITORY_INVENTORY.md)：三个核心仓库的真实资产清单、能力分类、只读 Connector 契约、导入规则和阶段验收标准。\n- [工程能力复用决策日志](ENGINEERING_CAPABILITY_REUSE_LOG.md)：记录项目开发中发现、评估、复用或暂缓采用 GitHub 现有工具的依据与证据。
- [产品愿景与架构说明](AI_CAPABILITY_PLATFORM_VISION.md)：产品战略和系统目标。
- [Capability Manifest Schema](../schemas/capability-manifest.schema.json)：机器可读的能力元数据规范，支持 engine、primitive 与来源追溯。
- [Phase 1 来源快照配置](../config/capability-sources.phase1.json)：固定三个公共仓库的 Commit 与保守 allowlist。
- [Phase 1 只读导入器](../scripts/phase1-import.mjs)：生成可追溯、可对账的本地能力目录 JSON，不写数据库、不执行仓库代码。\n- [GitHub 候选能力发现器](../scripts/github-capability-discovery.mjs)：根据任务关键词搜索 GitHub 仓库并给出透明的初步筛选信号，不克隆、不安装、不执行。\n- [Phase 1 导入器测试](../tests/phase1-import.test.js)：覆盖 Frontmatter、Allowlist、确定性哈希、来源追溯与 Atom/Primitive 对账。

## 当前状态

Phase 0 — Product & Architecture Baseline 已形成文档基线；Phase 1 — GitHub Read-only Ingestion 已启动，完成了三个核心仓库的首轮只读盘点。已完成首轮仓库盘点、固定来源快照、只读导入器、Manifest JSON Schema 校验和 GitHub 候选能力发现 CLI。最新 CI 的 146 项测试全部通过；真实 GitHub 只读导入生成 231 条 Manifest 记录，来源对账、重复检查和校验错误均为零。已建立 10 项人工标注的检索种子基准，当前词法基线 Recall@5、MRR、NDCG@5 均为 1.0；该结果仅是简单查询的冒烟测试，不代表生产检索质量。下一步扩充困难样本，并在同一数据集上比较 MiniSearch、Fuse.js、FlexSearch 与中英混合语义检索方案。文档中的阶段、接口和功能只有在代码、自动化测试和验收证据齐备后才能标记为 implemented 或 verified。

## 工作原则

- 从普通用户的任务出发，而不是从工具目录出发。
- GitHub 是首期知识资产权威来源；运行状态仍由适当的受控存储管理。
- 先完成只读发现、解析、索引和检索，再开放执行。
- 任何发现的仓库代码均不得自动执行。
- 重大架构变化通过 ADR 记录。


## GitHub 能力候选发现

开发阶段可按具体工程任务搜索公开 GitHub 仓库：

```bash
npm run github:discover -- --query "json schema validator language:TypeScript" --limit 10
```

该工具只读取 GitHub 仓库元数据，并输出候选评分、许可证状态、维护时间、风险标记和人工复核建议。评分仅用于初筛，不代表能力质量或安全结论；候选默认不是可执行能力。接入前必须解析不可变 Commit SHA、审查许可证与依赖、检查源码和测试，并在隔离环境中验证。
