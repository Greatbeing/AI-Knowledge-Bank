# AI Knowledge Bank - 工作流系统文档

## 📋 概述

本次更新实现了完整的知识管理工作流系统，包括：
- **知识节点**：创建、编辑、版本控制
- **验证流程**：提交、审核、批准/拒绝
- **分叉与合并**：分支管理、提案投票、去中心化决策
- **评论讨论**： threaded comments、投票、通知
- **订阅系统**：关注节点、实时通知
- **演化历史**：完整审计追踪、CAS 指标快照

---

## 🗄️ 数据库迁移 (003_knowledge_workflow.sql)

### 核心表结构

#### 1. knowledge_nodes（知识节点）
```sql
- id: UUID 主键
- title, content, summary: 内容字段
- tags[], category: 分类标签
- emergence_level, complexity_score, connectivity_score, adaptation_score: CAS 指标
- version, parent_id, is_latest_version: 版本控制
- status: draft|pending|validated|merged|deprecated
- validation_count, fork_count, merge_count: 统计
- author_id, co_authors[]: 作者信息
- metadata: JSONB 扩展字段
```

#### 2. validation_requests（验证请求）
```sql
- node_id: 关联知识节点
- validation_type: fact_check|logic_review|completeness|relevance
- confidence_score: 0-1 置信度
- status: pending|approved|rejected|needs_revision
- reviewer_id, review_comments: 审核信息
```

#### 3. node_forks（分叉）
```sql
- original_node_id, forked_node_id: 关联节点
- fork_type: improvement|alternative|correction|extension
- merge_status: pending|merged|rejected|abandoned
```

#### 4. merge_proposals（合并提案）
```sql
- source_node_id, target_node_id: 源和目标节点
- proposal_type: merge|integrate|replace|supplement
- votes_for, votes_against, voters[]: 投票系统
- status: pending|approved|rejected|withdrawn
```

#### 5. evolution_history（演化历史）
```sql
- event_type: created|updated|forked|merged|validated|deprecated
- old_values, new_values, delta: 变更详情
- emergence_snapshot, complexity_snapshot: CAS 指标快照
```

#### 6. node_comments（评论）
```sql
- parent_comment_id: 支持回复嵌套
- comment_type: general|question|suggestion|critique
- upvotes, downvotes, voters[]: 投票
```

#### 7. node_subscriptions（订阅）
```sql
- subscription_type: all|updates|comments|validations
- notify_email, notify_in_app: 通知偏好
```

### 触发器自动化

- `trg_knowledge_nodes_updated`: 自动更新 `updated_at`
- `trg_record_node_evolution`: 自动记录演化历史
- `trg_update_validation_count`: 自动更新验证计数
- `trg_update_fork_count`: 自动更新分叉计数

### 视图

- `hot_knowledge_nodes`: 热门节点排行榜
- `pending_validations`: 待验证列表
- `active_contributors`: 活跃贡献者
- `knowledge_graph_edges`: 图谱连接关系

---

## 💻 TypeScript API (lib/workflow.ts)

### 知识节点操作

```typescript
import workflow from '@/lib/workflow';

// 创建节点
const result = await workflow.createKnowledgeNode({
  title: 'Introduction to CAS',
  content: '...',
  tags: ['cas', 'complexity'],
  category: 'theory'
}, user);

// 更新节点
await workflow.updateKnowledgeNode(nodeId, {
  content: 'Updated content',
  status: 'pending'
}, user);

// 获取节点
const node = await workflow.getKnowledgeNode(nodeId);

// 热门节点
const hotNodes = await workflow.getHotNodes(20);

// 搜索
const results = await workflow.searchNodes('complexity', {
  category: 'theory',
  tags: ['cas'],
  minEmergence: 0.5
});
```

### 验证工作流

```typescript
// 提交验证
await workflow.submitValidationRequest(nodeId, {
  validation_type: 'fact_check',
  comments: 'Please verify the claims',
  confidence_score: 0.8
}, user);

// 审核验证
await workflow.reviewValidationRequest(validationId, 'approved', 
  'Looks good!', user);

// 获取待验证列表
const pending = await workflow.getPendingValidations();
```

### 分叉与合并

```typescript
// 创建分叉
await workflow.createFork(originalNodeId, 
  'Improving explanation', 'improvement', user);

// 提交合并提案
await workflow.submitMergeProposal(sourceId, targetId, {
  proposal_type: 'merge',
  justification: 'These complement each other',
  confidence_score: 0.9
}, user);

// 投票
await workflow.voteOnMergeProposal(proposalId, 'for', user);

// 决定合并
await workflow.decideMergeProposal(proposalId, 'approved', user);
```

### 评论系统

```typescript
// 添加评论
await workflow.addComment(nodeId, 
  'Great explanation!', 'general', user);

// 回复评论
await workflow.addComment(nodeId, 
  'I agree', 'general', user, parentCommentId);

// 获取评论
const comments = await workflow.getNodeComments(nodeId);

// 投票评论
await workflow.voteComment(commentId, 'up', user);
```

### 订阅系统

```typescript
// 订阅节点
await workflow.subscribeToNode(nodeId, 'all', user);

// 取消订阅
await workflow.unsubscribeFromNode(nodeId, user);

// 获取我的订阅
const subs = await workflow.getUserSubscriptions(userId);
```

### 演化历史

```typescript
// 节点历史
const history = await workflow.getNodeEvolutionHistory(nodeId);

// 全局动态
const activity = await workflow.getRecentActivity(100);
```

### CAS 指标

```typescript
import { calculateCASMetrics, updateNodeCASMetrics } from '@/lib/workflow';

// 计算指标
const metrics = calculateCASMetrics(node, connections, validations, forks);

// 更新指标
await updateNodeCASMetrics(nodeId, metrics);
```

---

## 🔐 安全策略 (RLS)

### 知识节点
- ✅ 公开查看已发布节点
- ✅ 作者管理自己的节点
- ✅ 验证者可更新状态

### 验证请求
- ✅ 认证用户可提交
- ✅ 公开查看
- ✅ 审核者可更新

### 分叉/合并
- ✅ 认证用户可创建
- ✅ 公开查看
- ✅ 审批者可决定

### 评论
- ✅ 认证用户可创建
- ✅ 公开查看
- ✅ 作者可编辑/删除自己的

---

## 📊 使用场景

### 场景 1: 知识提交流程
```
1. 用户创建知识节点 (draft)
2. 提交验证请求 → 状态变为 pending
3. 验证者审核 → approved/rejected
4. 批准后 → 状态变为 validated
5. 节点进入公开知识库
```

### 场景 2: 协作改进
```
1. 用户 A 发现节点需要改进
2. 创建分叉 (fork) → 在新版本上编辑
3. 提交合并提案
4. 社区投票
5. 达到阈值后自动合并
```

### 场景 3: 学术争论
```
1. 用户对某观点有异议
2. 创建 alternative fork
3. 双方各自发展
4. 社区通过投票选择主流版本
5. 或保持多元并存
```

---

## 🚀 部署步骤

### 1. 运行数据库迁移
```bash
# 在 Supabase SQL Editor 中依次执行：
# 1. 001_cas_emergence_algorithm.sql
# 2. 002_user_system.sql
# 3. 003_knowledge_workflow.sql
```

### 2. 配置前端
```typescript
// 确保 supabase client 已正确配置
import { supabase } from '@/lib/auth';
import workflow from '@/lib/workflow';
```

### 3. 测试工作流
```typescript
// 创建测试节点
const testNode = await workflow.createKnowledgeNode({
  title: 'Test Node',
  content: 'Testing the workflow',
  status: 'draft'
}, testUser);

// 验证流程
const validation = await workflow.submitValidationRequest(
  testNode.data.id,
  { validation_type: 'logic_review' },
  testUser
);
```

---

## 📈 性能优化

### 索引策略
- 全文搜索 GIN 索引
- 状态、分类、标签索引
- 时间戳降序索引
- 复合索引优化常用查询

### 查询优化
- 使用物化视图缓存热门数据
- 分页加载大数据集
- 客户端过滤减少数据库负载

---

## 🔮 未来扩展

1. **AI 辅助验证**: 自动检测事实错误
2. **智能推荐**: 基于 CAS 指标推荐相关内容
3. **可视化图谱**: D3.js 力导向图展示知识网络
4. **导出功能**: PDF、Markdown、JSON 格式
5. **API Webhooks**: 第三方集成
6. **多语言支持**: i18n 国际化

---

## 📝 变更日志

### v0.9.0 (2024)
- ✅ 新增知识节点完整 CRUD
- ✅ 实现验证工作流
- ✅ 分叉与合并系统
- ✅ 评论和讨论功能
- ✅ 订阅和通知
- ✅ 演化历史追踪
- ✅ CAS 指标计算
- ✅ RLS 安全策略
- ✅ 自动化触发器
- ✅ 优化视图和查询

---

## 🤝 贡献指南

参见 [CONTRIBUTING.md](./CONTRIBUTING.md)

## 📄 许可证

MIT License - 参见 [LICENSE](./LICENSE)
