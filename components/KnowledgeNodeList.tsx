import React from 'react';
import { useKnowledgeNodes, useCreateKnowledgeNode } from '../../lib/hooks/useKnowledgeBank';
import { Card, Button, Badge, Spinner, EmptyState, Input } from '../ui/common';
import { formatCASScore, getCASLevel, getCASColorClass, formatNodeStatus, getNodeStatusClass } from '../../lib/utils/formatters';
import { Search, Plus, Filter } from 'lucide-react';

interface KnowledgeNodeListProps {
  onNodeClick?: (nodeId: string) => void;
  onCreateNode?: () => void;
}

export function KnowledgeNodeList({ onNodeClick, onCreateNode }: KnowledgeNodeListProps) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');

  const { data: nodes, isLoading, error } = useKnowledgeNodes({
    status: 'validated',
    limit: 50,
  });

  const filteredNodes = React.useMemo(() => {
    if (!nodes) return [];

    return nodes.filter(node => {
      const matchesSearch = searchTerm === '' || 
        node.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || 
        node.skill_category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [nodes, searchTerm, selectedCategory]);

  const categories = React.useMemo(() => {
    if (!nodes) return [];
    const cats = new Set(nodes.map(n => n.skill_category));
    return ['all', ...Array.from(cats)];
  }, [nodes]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner size="lg" />
        <span className="ml-3 text-gray-600">加载知识节点中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        title="加载失败"
        description={error instanceof Error ? error.message : '未知错误'}
        action={
          <Button variant="primary" onClick={() => window.location.reload()}>
            重新加载
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* 工具栏 */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Input
            type="text"
            placeholder="搜索知识节点..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>

        <div className="flex gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'all' ? '全部分类' : cat}
              </option>
            ))}
          </select>

          <Button
            variant="primary"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={onCreateNode}
          >
            新建节点
          </Button>
        </div>
      </div>

      {/* 节点列表 */}
      {filteredNodes.length === 0 ? (
        <EmptyState
          icon={<Search className="h-12 w-12" />}
          title="未找到知识节点"
          description={
            searchTerm || selectedCategory !== 'all'
              ? '尝试调整搜索条件或筛选器'
              : '还没有知识节点，创建第一个吧！'
          }
          action={
            !searchTerm && selectedCategory === 'all' && (
              <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={onCreateNode}>
                创建第一个节点
              </Button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNodes.map(node => (
            <Card
              key={node.id}
              hoverable
              onClick={() => onNodeClick?.(node.id)}
              className="flex flex-col h-full"
            >
              <div className="flex items-start justify-between mb-3">
                <Badge variant="info" size="sm">
                  {node.skill_category}
                </Badge>
                <div className={cn(getCASColorClass(node.cas_score), 'px-2 py-1 rounded text-xs font-medium')}>
                  CAS: {formatCASScore(node.cas_score)}
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                {node.title}
              </h3>

              <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-1">
                {node.description}
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <Badge variant={node.status === 'validated' ? 'success' : 'warning'} size="sm">
                  {formatNodeStatus(node.status)}
                </Badge>
                <span className="text-xs text-gray-500">
                  v{node.version} · {getCASLevel(node.cas_score)}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* 结果统计 */}
      {filteredNodes.length > 0 && (
        <div className="text-center text-sm text-gray-500 pt-4">
          显示 {filteredNodes.length} / {nodes?.length || 0} 个知识节点
        </div>
      )}
    </div>
  );
}

// 辅助函数导入
import { cn } from '../ui/common';
