/**
 * AI Knowledge Bank - CAS Metrics Module
 * 复杂自适应系统指标计算功能
 */

import { supabase } from '../auth';
import type { Database } from '../../types/supabase';
import type { CASMetrics } from '../../lib/types/knowledge';
import { updateKnowledgeNode, getKnowledgeNode } from '../nodes';
import type { User } from '../auth';

// ============================================
// 类型定义
// ============================================

export type KnowledgeNode = Database['public']['Tables']['knowledge_nodes']['Row'];

export interface ValidationResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

// ============================================
// CAS 指标计算
// ============================================

/**
 * 计算节点 CAS 指标
 */
export function calculateCASMetrics(
  node: KnowledgeNode,
  connections: number,
  validations: number,
  forks: number
): CASMetrics {
  // Emergence: 基于验证、分叉和连接的综合指标
  const emergence_level = Math.min(1.0, 
    (validations * 0.3 + forks * 0.4 + connections * 0.3) / 10
  );

  // Complexity: 基于内容长度和结构复杂度
  const contentComplexity = Math.min(1.0, node.content.length / 5000);
  const structureComplexity = node.tags ? node.tags.length / 10 : 0;
  const complexity_score = (contentComplexity + structureComplexity) / 2;

  // Connectivity: 基于连接数
  const connectivity_score = Math.min(1.0, connections / 20);

  // Adaptation: 基于版本迭代和分叉
  const versionFactor = Math.min(1.0, (node.version || 1) / 10);
  const forkFactor = Math.min(1.0, forks / 5);
  const adaptation_score = (versionFactor + forkFactor) / 2;

  return {
    emergence_level,
    complexity_score,
    connectivity_score,
    adaptation_score
  };
}

/**
 * 更新节点 CAS 指标
 */
export async function updateNodeCASMetrics(
  nodeId: string,
  metrics: CASMetrics,
  user: User
): Promise<ValidationResult> {
  try {
    const { error } = await supabase
      .from('knowledge_nodes')
      .update({
        emergence_level: metrics.emergence_level,
        complexity_score: metrics.complexity_score,
        connectivity_score: metrics.connectivity_score,
        adaptation_score: metrics.adaptation_score,
        updated_at: new Date().toISOString()
      })
      .eq('id', nodeId);

    if (error) throw error;

    return {
      success: true,
      message: 'CAS metrics updated'
    };
  } catch (err: any) {
    return {
      success: false,
      message: 'Failed to update CAS metrics',
      error: err.message
    };
  }
}

/**
 * 自动计算并更新节点 CAS 指标
 */
export async function autoUpdateNodeMetrics(nodeId: string, user: User): Promise<ValidationResult> {
  try {
    const node = await getKnowledgeNode(nodeId);
    if (!node) {
      return {
        success: false,
        message: 'Node not found'
      };
    }

    // 获取连接数
    const { count: connectionsCount } = await supabase
      .from('node_connections')
      .select('*', { count: 'exact', head: true })
      .or(`source_node_id.eq.${nodeId},target_node_id.eq.${nodeId}`);

    // 获取验证数
    const { count: validationsCount } = await supabase
      .from('validation_requests')
      .select('*', { count: 'exact', head: true })
      .eq('node_id', nodeId)
      .eq('status', 'approved');

    // 获取分叉数
    const { count: forksCount } = await supabase
      .from('node_forks')
      .select('*', { count: 'exact', head: true })
      .eq('original_node_id', nodeId);

    const metrics = calculateCASMetrics(
      node,
      connectionsCount || 0,
      validationsCount || 0,
      forksCount || 0
    );

    return await updateNodeCASMetrics(nodeId, metrics, user);
  } catch (err: any) {
    return {
      success: false,
      message: 'Failed to auto-update metrics',
      error: err.message
    };
  }
}

// ============================================
// 导出
// ============================================

export default {
  calculateCASMetrics,
  updateNodeCASMetrics,
  autoUpdateNodeMetrics
};
