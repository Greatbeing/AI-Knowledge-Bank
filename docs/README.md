# 项目文档中心

AI Knowledge Bank 的长期产品与工程基线文档。

- [项目总开发文档](PROJECT_DEVELOPMENT_BLUEPRINT.md)：产品章程、PRD、技术架构、安全模型、能力贡献规范、长期路线图和治理。
- [Phase 1 仓库盘点与接入设计](PHASE_1_REPOSITORY_INVENTORY.md)：三个核心仓库的真实资产清单、能力分类、只读 Connector 契约、导入规则和阶段验收标准。
- [产品愿景与架构说明](AI_CAPABILITY_PLATFORM_VISION.md)：产品战略和系统目标。
- [Capability Manifest Schema](../schemas/capability-manifest.schema.json)：机器可读的能力元数据规范，支持 engine、primitive 与来源追溯。
- [Phase 1 来源快照配置](../config/capability-sources.phase1.json)：固定三个公共仓库的 Commit 与保守 allowlist。
- [Phase 1 只读导入器](../scripts/phase1-import.mjs)：生成可追溯的本地能力目录 JSON，不写数据库、不执行仓库代码。

## 当前状态

Phase 0 — Product & Architecture Baseline 已形成文档基线；Phase 1 — GitHub Read-only Ingestion 已启动，完成了三个核心仓库的首轮只读盘点。已完成首轮仓库盘点、来源快照配置和只读导入器初版；自动化测试与首次端到端导入仍待 CI/运行验证。检索评测和产品集成尚未开始。文档中的阶段、接口和功能只有在代码、自动化测试和验收证据齐备后才能标记为 implemented 或 verified。

## 工作原则

- 从普通用户的任务出发，而不是从工具目录出发。
- GitHub 是首期知识资产权威来源；运行状态仍由适当的受控存储管理。
- 先完成只读发现、解析、索引和检索，再开放执行。
- 任何发现的仓库代码均不得自动执行。
- 重大架构变化通过 ADR 记录。
