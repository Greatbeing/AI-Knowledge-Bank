# AI Knowledge Bank

**AI 驱动的人类技能进化网络 | A Complex Adaptive System for Human-AI Collaboration**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Complex Adaptive System](https://img.shields.io/badge/CAS-Emergence-emerald)](https://en.wikipedia.org/wiki/Complex_adaptive_system)
[![Status: Alpha](https://img.shields.io/badge/Status-Alpha-orange)](https://github.com/your-org/ai-knowledge-bank)

> **愿景**: 消除 AI 时代的技术鸿沟，构建去中心化的集体智慧大脑。我们不是在教育用户，而是在催化人类技能的自发涌现。

---

## 🌌 项目概述

**AI Knowledge Bank** 不是一个传统的网课平台或工具导航站。基于**复杂适应系统 (Complex Adaptive Systems, CAS)**理论，我们将每一个渴望成长的个体视为智能节点，通过精心设计的交互规则，让微小的个人经验在碰撞中**涌现**出行业级的 AI 标准。

### 核心差异化

| 传统 AI 教育产品 | AI Knowledge Bank |
|-----------------|-------------------|
| 中心化内容分发 | 去中心化知识演化 |
| 静态课程体系 | 动态涌现的 SOP |
| 线性积分激励 | PageRank 声誉网络 |
| 讲师→学员单向传递 | 多主体非线性交互 |
| 内容易过时 | 社区自更新机制 |

---

## 🔬 理论基础：复杂适应系统 (CAS)

本项目的架构设计遵循复杂性科学的四大核心原则：

### 1. 主体 (Agents)
每个用户都是携带独特"初始状态"(行业背景、业务痛点、AI 认知水平) 的智能体。系统刻意保护"边缘节点",因为创新往往发生在跨界地带 (如 AI+ 农业)。

### 2. 非线性交互 (Non-linear Interactions)
引入 Git 模式的 Prompt 协作机制:
- **Fork**: 用户改进他人的 Prompt，注入自己的行业约束
- **Merge**: 当分支权重超越主干，系统自动合并为新标准
- **Emergence**: 1+1>2 的化学反应，产生全新的知识形态

### 3. 自组织 (Self-Organization)
当局部节点交互密度达到阈值时，系统自动生成"微公会":
> "检测到 20 位用户都在讨论'跨境电商+AI 生成商品图',已为您创建【AI 电商视觉攻坚室】"

### 4. 混沌边缘 (Edge of Chaos)
系统通过以下机制保持在最佳创新状态:
- **负熵输入**: 真实业务结果 (阅读量、转化率) 作为能量注入
- **时间衰减**: 老知识的权重随时间自然衰减，逼迫系统持续更新
- **弱连接碰撞**: AI 定期举办"盲盒跨界挑战",促进跨领域创新

---

## 🏗️ 技术架构

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend Layer                         │
│  Next.js 14 (App Router) + Tailwind CSS + Framer Motion    │
│  - EvolutionTree 组件：可视化知识基因谱系                   │
│  - Streaming Sandbox: AI 流式输出沙盒                       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                       Backend Layer                         │
│  Supabase (PostgreSQL) + Edge Functions                    │
│  - CAS Emergence Algorithm: 非线性权重计算                  │
│  - Auto-Merge Trigger: 涌现检测与自动合并                   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                        AI Layer                             │
│  Custom Agents (Coze/Dify) + RAG Pipeline                  │
│  - UGC 提纯 Agent: 社区精华→标准化 SOP                     │
│  - 个性化推荐引擎：基于用户画像的动态路径规划               │
└─────────────────────────────────────────────────────────────┘
```

### 核心算法

节点权重的计算公式 (基于 Hacker News Gravity 变体 + PageRank 声誉传递):

$$
\text{Weight} = 1.0 + \frac{\sum (\text{Validator\_Reputation} \times \text{Feedback\_Score})}{(\text{Hours\_Since\_Creation} + 2)^{1.8}}
$$

- **分子**: 高声誉用户的验证呈指数级放大
- **分母**: 时间衰减因子，防止知识僵化
- **涌现阈值**: 当分支权重 > 父节点 × 1.2 时，触发自动合并

---

## 🚀 快速开始

### 前置要求

- Node.js 18+ 
- PostgreSQL 15+ (推荐使用 [Supabase](https://supabase.com))
- pnpm 或 npm

### 1. 克隆仓库

```bash
git clone https://github.com/your-org/ai-knowledge-bank.git
cd ai-knowledge-bank
pnpm install
```

### 2. 初始化数据库

```bash
# 使用 Supabase CLI
npx supabase db push

# 或手动执行 SQL 迁移
psql -h your-db.supabase.co -U postgres -d postgres < supabase/migrations/001_cas_emergence_algorithm.sql
```

### 3. 启动开发服务器

```bash
pnpm dev
# 访问 http://localhost:3000
```

### 4. 录入创世节点

参考 [`data/genesis_nodes.md`](./data/genesis_nodes.md),将 3 个行业级 SOP 插入数据库:

```sql
-- 示例：插入跨境出海节点
INSERT INTO nodes (id, title, description, content, node_type, weight, is_mainline)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '【跨境出海】多语言本地化营销物料生成流',
  'SOP 核心：引入霍夫斯泰德文化维度理论，挂载本地俚语 RAG...',
  '{...}'::jsonb,
  'prompt',
  85.0,
  true
);
```

---

## 📦 核心模块

### 前端组件

| 组件 | 路径 | 说明 |
|------|------|------|
| `EvolutionTree` | [`components/EvolutionTree.tsx`](./components/EvolutionTree.tsx) | 知识演化树可视化，支持 Framer Motion 动画 |
| `StreamingSandbox` | `components/StreamingSandbox.tsx` | AI 流式输出沙盒 (待开发) |
| `NodeCard` | `components/NodeCard.tsx` | 节点信息卡片 (待开发) |

### 后端函数

| 函数 | 路径 | 说明 |
|------|------|------|
| `calculate_emergence_weight()` | [`supabase/migrations/001_cas_emergence_algorithm.sql`](./supabase/migrations/001_cas_emergence_algorithm.sql) | CAS 核心权重计算 |
| `fork_node()` | 同上 | 创建分支 (Fork) |
| `check_and_trigger_emergence()` | 同上 | 涌现检测触发器 |

### 数据资产

| 文件 | 路径 | 说明 |
|------|------|------|
| 创世节点文档 | [`data/genesis_nodes.md`](./data/genesis_nodes.md) | 3 个国际水准的冷启动 SOP |
| 数据库迁移 | `supabase/migrations/` | PostgreSQL schema 与触发器 |

---

## 🗺️ 发展路线图

### Phase 1: MVP (当前阶段)
- [x] CAS 算法原型实现
- [x] 演化树前端组件
- [x] 3 个创世节点内容填充
- [ ] 基础用户认证系统
- [ ] Fork/Merge 交互功能

### Phase 2: 社区测试版 (Q2 2025)
- [ ] 邀请 100 位种子用户
- [ ] UGC 提纯 Agent 上线
- [ ] 声誉积分系统
- [ ] 移动端适配

### Phase 3: 开放生态 (Q3 2025)
- [ ] 公开注册
- [ ] API 开放平台
- [ ] 企业版工作区
- [ ] 跨语言支持 (EN/ES/AR)

---

## 🤝 贡献指南

我们欢迎所有认同"复杂适应系统"理念的贡献者！

### 贡献方式

1. **代码贡献**: 查看 [CONTRIBUTING.md](./CONTRIBUTING.md)
2. **内容贡献**: 提交你的行业 SOP 到 `data/community_nodes/`
3. **Bug 报告**: 使用 GitHub Issues 模板
4. **理念传播**: 在社交媒体分享你的使用体验

### 核心贡献者

<!-- 这里将显示贡献者头像 -->
[@YourName](https://github.com/yourname) - 创始人 & 系统架构师

---

## 📜 许可证

本项目采用 [MIT 许可证](./LICENSE)。这意味着你可以:
- ✅ 自由使用于商业或非商业用途
- ✅ 修改和分发代码
- ✅ 无需支付版税

但请保留原始的署名声明。

---

## 🌍 社会价值

**AI Knowledge Bank** 的终极目标超越商业成功:

1. **数字红利再分配**: 让县城实体店老板也能零代码复用一线城市极客的 AI 工作流
2. **集体心智防御网**: 帮助人类群体完成职业物种的演化，应对 AI 取代焦虑
3. **产业级开源大脑**: 成为全球最鲜活的"行业 AI 应用开源库"

> "市面上的 AI 工具在教人如何**控制机器**,而我们致力于用 AI 重塑**人类的连接**。"

---

## 📬 联系方式

- **官网**: [aiknowledgebank.dev](https://aiknowledgebank.dev) (待上线)
- **Twitter**: [@AIKnowledgeBank](https://twitter.com) (待开通)
- **Discord**: [加入社区](https://discord.gg/xxx) (待创建)
- **邮箱**: hello@aiknowledgebank.dev

---

<div align="center">

**🧬 让知识像基因一样演化，让智慧从社区中涌现。**

*Built with ❤️ for the Complex Adaptive Future*

</div>
