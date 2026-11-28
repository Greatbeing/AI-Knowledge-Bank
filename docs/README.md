# 项目文档中心

AI Knowledge Bank 的长期产品与工程基线文档。

- [项目总开发文档](PROJECT_DEVELOPMENT_BLUEPRINT.md)：产品章程、PRD、技术架构、安全模型、能力贡献规范、长期路线图和治理。
- [Phase 1 仓库盘点与接入设计](PHASE_1_REPOSITORY_INVENTORY.md)：三个核心仓库的真实资产清单、能力分类、只读 Connector 契约、导入规则和阶段验收标准。
- [工程能力复用决策日志](ENGINEERING_CAPABILITY_REUSE_LOG.md)：记录项目开发中发现、评估、复用或暂缓采用 GitHub 现有工具的依据与证据。
- [ADR-0002：Reuse Before Build](ADR-0002-REUSE-BEFORE-BUILD.md)：将复用优先确立为 AI Knowledge Bank 与 Cognitive Engine 的一级架构原则。
- [产品愿景与架构说明](AI_CAPABILITY_PLATFORM_VISION.md)：产品战略和系统目标。
- [Capability Manifest Schema](../schemas/capability-manifest.schema.json)：机器可读的能力元数据规范，支持 engine、primitive 与来源追溯。
- [Phase 1 来源快照配置](../config/capability-sources.phase1.json)：固定三个公共仓库的 Commit 与保守 allowlist。
- [Phase 1 只读导入器](../scripts/phase1-import.mjs)：生成可追溯、可对账的本地能力目录 JSON，不写数据库、不执行仓库代码。
- [GitHub 候选能力发现器](../scripts/github-capability-discovery.mjs)：根据任务关键词搜索 GitHub 仓库并给出透明的初步筛选信号，不克隆、不安装、不执行。
- [Phase 1 导入器测试](../tests/phase1-import.test.js)：覆盖 Frontmatter、Allowlist、确定性哈希、来源追溯与 Atom/Primitive 对账。

## 当前状态

Phase 1 — GitHub Read-only Ingestion 已完成首轮自有仓库只读盘点、固定来源快照、确定性导入器、Manifest Schema 校验、GitHub 候选发现 CLI 和 25 项人工标注的检索种子基准。首轮目录为 231 条记录；来源对账、重复检查、Schema 校验和导入错误均为零。检索种子基准：Recall@5 0.9600、MRR 0.7993、NDCG@5 0.8386、Precision@1 0.7200；每项任务当前仅标注一个相关资产，因此 Precision@5 的理论上限为 0.2000。以上仅为种子基准，不代表生产检索质量。

已接受 ADR-0002 — Reuse Before Build。Cognitive Engine 的独立 Draft PR #1 已实现第一版确定性复用决策与路由前置策略，包含 reuse、compose、adapt、defer、build_gap，许可证、安全、验证和兼容性门槛，以及“执行授权始终为 false”的安全不变量。最新对应 CI：26 项测试通过，1 项因未检出 companion repository 而跳过。

下一阶段重点：将 Reuse Policy 与 AI Knowledge Bank 的真实目录连接，建立可复现的任务级复用评估，并比较 reuse-first 与 generate-first 在任务成功率、质量、成本、延迟、集成时间和维护负担上的差异。文档中的阶段、接口和功能只有在代码、自动化测试和验收证据齐备后才能标记为 implemented 或 verified。
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
