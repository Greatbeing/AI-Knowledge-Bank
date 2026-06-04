# AI Knowledge Bank - Lib 模块

本目录包含 AI Knowledge Bank 的核心业务逻辑库，采用模块化设计，便于维护和扩展。

## 目录结构

```
lib/
├── index.ts              # 主入口文件，导出所有公共 API
├── auth.ts               # 认证和授权功能
├── utils.ts              # 通用工具函数
├── types/                # 类型定义
│   ├── index.ts          # 类型导出入口
│   ├── knowledge.ts      # 知识相关类型
│   └── user.ts           # 用户相关类型
├── nodes/                # 知识节点模块
│   └── index.ts          # 节点 CRUD 和搜索
├── validation/           # 验证工作流模块
│   └── index.ts          # 验证请求和审核
├── fork-merge/           # 分叉和合并模块
│   └── index.ts          # Fork 和 Merge 工作流
├── comments/             # 评论模块
│   └── index.ts          # 评论和投票
├── subscriptions/        # 订阅模块
│   └── index.ts          # 节点订阅功能
├── evolution/            # 演化历史模块
│   └── index.ts          # 演化历史查询
├── metrics/              # CAS 指标模块
│   └── index.ts          # 指标计算和更新
└── utils/                # 内部工具
    └── internal-helpers.ts  # 内部辅助函数
```

## 使用方式

### 完整导入

```typescript
import {
  createKnowledgeNode,
  submitValidationRequest,
  createFork,
  addComment,
  subscribeToNode
} from '@/lib';
```

### 模块导入

```typescript
// 只导入节点相关功能
import { createKnowledgeNode, getKnowledgeNode } from '@/lib/nodes';

// 只导入验证相关功能
import { submitValidationRequest } from '@/lib/validation';

// 只导入分叉合并功能
import { createFork, submitMergeProposal } from '@/lib/fork-merge';
```

### 使用默认导出

```typescript
import lib from '@/lib';

// 通过模块访问
await lib.nodes.createKnowledgeNode(nodeData, user);
await lib.validation.submitValidationRequest(nodeId, data, user);
```

## 模块说明

### Auth 模块 (`auth.ts`)
- 用户认证（登录、注册、登出）
- 会话管理
- Supabase 客户端配置

### Nodes 模块 (`nodes/`)
- `createKnowledgeNode` - 创建知识节点
- `updateKnowledgeNode` - 更新知识节点
- `getKnowledgeNode` - 获取节点详情
- `getHotNodes` - 获取热门节点
- `searchNodes` - 搜索节点
- `fullTextSearch` - 全文搜索

### Validation 模块 (`validation/`)
- `submitValidationRequest` - 提交验证请求
- `reviewValidationRequest` - 审核验证
- `getPendingValidations` - 获取待验证列表
- `getValidationRequest` - 获取验证详情

### Fork & Merge 模块 (`fork-merge/`)
- `createFork` - 创建分叉
- `submitMergeProposal` - 提交合并提案
- `voteOnMergeProposal` - 投票支持合并
- `decideMergeProposal` - 决定合并提案

### Comments 模块 (`comments/`)
- `addComment` - 添加评论
- `getNodeComments` - 获取评论列表
- `voteComment` - 投票评论

### Subscriptions 模块 (`subscriptions/`)
- `subscribeToNode` - 订阅节点
- `unsubscribeFromNode` - 取消订阅
- `getUserSubscriptions` - 获取用户订阅

### Evolution 模块 (`evolution/`)
- `getNodeEvolutionHistory` - 获取节点演化历史
- `getRecentActivity` - 获取全局动态

### Metrics 模块 (`metrics/`)
- `calculateCASMetrics` - 计算 CAS 指标
- `updateNodeCASMetrics` - 更新节点指标
- `autoUpdateNodeMetrics` - 自动更新指标

## 返回值格式

大部分异步函数返回统一的 `ValidationResult` 格式：

```typescript
interface ValidationResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}
```

使用示例：

```typescript
const result = await createKnowledgeNode(nodeData, user);
if (result.success) {
  console.log('Created:', result.data);
} else {
  console.error('Error:', result.error);
}
```

## 类型安全

所有模块都提供完整的 TypeScript 类型定义，支持智能提示和类型检查。

```typescript
import type { KnowledgeNode, ValidationResult } from '@/lib';

async function handleNode(nodeData: KnowledgeNodeInsert) {
  const result: ValidationResult = await createKnowledgeNode(nodeData, user);
  // ...
}
```

## 错误处理

所有函数都使用 try-catch 包裹，确保不会抛出未处理的异常。错误信息统一通过 `ValidationResult.error` 返回。

## 依赖关系

```
┌─────────────┐
│   auth.ts   │
└──────┬──────┘
       │
       ▼
┌─────────────┐     ┌──────────────────┐
│   nodes/    │◄────┤ internal-helpers │
└──────┬──────┘     └──────────────────┘
       │
       ▼
┌──────────────┐  ┌───────────────┐  ┌──────────────┐
│ validation/  │  │  fork-merge/  │  │  comments/   │
└──────────────┘  └───────────────┘  └──────────────┘
       │                │                 │
       └────────────────┴─────────────────┘
                        │
                        ▼
              ┌─────────────────┐
              │  subscriptions/ │
              │   evolution/    │
              │    metrics/     │
              └─────────────────┘
```

## 迁移指南

如果你正在从旧的 `workflow.ts` 迁移：

1. 替换导入路径：
   ```typescript
   // 旧
   import { createKnowledgeNode } from './lib/workflow';
   
   // 新
   import { createKnowledgeNode } from './lib/nodes';
   ```

2. 或者使用统一入口：
   ```typescript
   import { createKnowledgeNode } from './lib';
   ```

3. 类型导入保持不变，已重新导出。
