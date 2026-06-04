# AI Knowledge Bank - 快速开始指南

## 🚀 5 分钟快速上手

### 1. 安装依赖

```bash
npm install
```

已包含的核心依赖：
- React 18 + TypeScript
- @tanstack/react-query (数据管理)
- date-fns (日期处理)
- Supabase (后端服务)
- Tailwind CSS (样式)
- Framer Motion (动画)

### 2. 配置环境变量

创建 `.env.local` 文件：

```bash
# .env.local
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. 设置数据库

在 Supabase 中执行以下 SQL：

```sql
-- 知识节点表
CREATE TABLE knowledge_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  skill_category TEXT NOT NULL,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES knowledge_nodes(id),
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'validated', 'rejected')),
  cas_score DECIMAL DEFAULT 0,
  author_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 验证请求表
CREATE TABLE validation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id UUID REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引优化
CREATE INDEX idx_nodes_category ON knowledge_nodes(skill_category);
CREATE INDEX idx_nodes_status ON knowledge_nodes(status);
CREATE INDEX idx_nodes_cas_score ON knowledge_nodes(cas_score DESC);
CREATE INDEX idx_validation_node ON validation_requests(node_id);

-- RLS 策略（行级安全）
ALTER TABLE knowledge_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_requests ENABLE ROW LEVEL SECURITY;

-- 允许所有人读取已验证的节点
CREATE POLICY "Allow read validated nodes" ON knowledge_nodes
  FOR SELECT USING (status = 'validated');

-- 允许认证用户创建节点
CREATE POLICY "Allow authenticated create" ON knowledge_nodes
  FOR INSERT TO authenticated WITH CHECK (true);

-- 允许作者更新自己的节点
CREATE POLICY "Allow authors update" ON knowledge_nodes
  FOR UPDATE TO authenticated USING (auth.uid() = author_id);
```

### 4. 配置 React Query Provider

在应用入口文件（如 `main.tsx` 或 `App.tsx`）：

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 分钟
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* 你的应用组件 */}
      <YourComponents />
      
      {/* 开发工具（可选） */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

### 5. 使用示例

#### 示例 1: 显示知识节点列表

```tsx
import { KnowledgeNodeList } from '@/components/KnowledgeNodeList';

function HomePage() {
  const handleNodeClick = (nodeId: string) => {
    console.log('导航到节点详情:', nodeId);
    // navigate(`/nodes/${nodeId}`);
  };

  const handleCreateNode = () => {
    console.log('打开创建节点对话框');
    // setOpenCreateModal(true);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">AI 知识库</h1>
      <KnowledgeNodeList 
        onNodeClick={handleNodeClick}
        onCreateNode={handleCreateNode}
      />
    </div>
  );
}
```

#### 示例 2: 自定义 Hooks 使用

```tsx
import { useKnowledgeNodes, useCreateKnowledgeNode } from '@/lib';

function NodeManager() {
  const { data: nodes, isLoading, error } = useKnowledgeNodes({
    skillCategory: 'AI Engineering',
    limit: 20,
  });

  const createNode = useCreateKnowledgeNode();

  const handleCreate = async () => {
    try {
      const newNode = await createNode.mutateAsync({
        title: 'Prompt Engineering',
        description: '学习如何编写有效的 AI 提示词',
        skill_category: 'AI Engineering',
        content: '# Prompt Engineering\n\n详细内容...',
        author_id: 'current-user-id',
        version: 1,
        status: 'draft',
        cas_score: 0,
      });
      console.log('创建成功:', newNode);
    } catch (err) {
      console.error('创建失败:', err);
    }
  };

  if (isLoading) return <div>加载中...</div>;
  if (error) return <div>加载失败：{error.message}</div>;

  return (
    <div>
      <button onClick={handleCreate} disabled={createNode.isPending}>
        {createNode.isPending ? '创建中...' : '创建节点'}
      </button>
      
      <ul>
        {nodes?.map(node => (
          <li key={node.id}>{node.title}</li>
        ))}
      </ul>
    </div>
  );
}
```

#### 示例 3: 使用 UI 组件

```tsx
import { Button, Card, Badge, Input, Spinner } from '@/components/ui/common';
import { formatCASScore, getCASLevel, formatDate } from '@/lib/utils/formatters';

function NodeCard({ node }) {
  return (
    <Card hoverable className="mb-4">
      <div className="flex justify-between items-start mb-3">
        <Badge variant="info">{node.skill_category}</Badge>
        <div className={cn(
          getCASColorClass(node.cas_score),
          'px-2 py-1 rounded text-xs font-medium'
        )}>
          CAS: {formatCASScore(node.cas_score)} · {getCASLevel(node.cas_score)}
        </div>
      </div>

      <h3 className="text-xl font-semibold mb-2">{node.title}</h3>
      <p className="text-gray-600 mb-4">{node.description}</p>

      <div className="flex justify-between items-center text-sm text-gray-500">
        <span>v{node.version} · {formatDate(node.created_at)}</span>
        <Badge variant={node.status === 'validated' ? 'success' : 'warning'}>
          {formatNodeStatus(node.status)}
        </Badge>
      </div>

      <div className="mt-4 flex gap-2">
        <Button variant="primary" size="sm">查看详情</Button>
        <Button variant="outline" size="sm">创建分叉</Button>
      </div>
    </Card>
  );
}
```

### 6. 运行开发服务器

```bash
npm run dev
```

访问 http://localhost:5173

---

## 📚 API 参考

### React Hooks

| Hook | 描述 | 参数 |
|------|------|------|
| `useKnowledgeNodes(filters)` | 获取节点列表 | `{ skillCategory?, status?, limit? }` |
| `useKnowledgeNode(id)` | 获取单个节点 | `id: string` |
| `useCreateKnowledgeNode()` | 创建节点 mutation | - |
| `useUpdateKnowledgeNode()` | 更新节点 mutation | - |
| `useDeleteKnowledgeNode()` | 删除节点 mutation | - |
| `useValidationRequests(nodeId)` | 获取验证请求 | `nodeId?: string` |
| `useSubmitValidationRequest()` | 提交验证 mutation | - |
| `useApproveValidationRequest()` | 批准验证 mutation | - |
| `useRejectValidationRequest()` | 拒绝验证 mutation | - |

### 格式化工具

| 函数 | 描述 | 示例 |
|------|------|------|
| `formatDate(date)` | 格式化日期 | `2024-06-04 15:30` |
| `formatRelativeTime(date)` | 相对时间 | `3 小时前` |
| `formatCASScore(score)` | CAS 分数 | `85.50` |
| `getCASLevel(score)` | CAS 等级 | `高级` |
| `formatNodeStatus(status)` | 节点状态 | `已验证` |

### UI 组件

| 组件 | Props | 描述 |
|------|-------|------|
| `Button` | variant, size, isLoading, leftIcon, rightIcon | 按钮 |
| `Badge` | variant, size | 徽章标签 |
| `Card` | hoverable, onClick | 卡片容器 |
| `Input` | label, error, leftIcon | 输入框 |
| `Textarea` | label, error | 多行文本框 |
| `Spinner` | size | 加载动画 |
| `EmptyState` | icon, title, description, action | 空状态 |

---

## 🔗 相关文档

- [优化报告](./OPTIMIZATION_REPORT.md) - 详细优化说明
- [模块重构文档](./MODULE_REFACTORING.md) - 架构重构细节
- [README](./README.md) - 项目总览
- [开发指南](./DEVELOPMENT.md) - 开发流程

---

**最后更新**: 2026-06-04  
**版本**: v2.0
