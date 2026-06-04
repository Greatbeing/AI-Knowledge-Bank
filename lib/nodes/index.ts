/**
 * AI Knowledge Bank - Knowledge Nodes Module
 * 知识节点的 CRUD 和搜索功能
 */

import { supabase, type User } from '../auth';
import type { Database } from '../../types/supabase';
import type { CASMetrics } from '../../lib/types/knowledge';

// ============================================
// 类型定义
// ============================================

export type KnowledgeNode = Database['public']['Tables']['knowledge_nodes']['Row'];
export type KnowledgeNodeInsert = Database['public']['Tables']['knowledge_nodes']['Insert'];
export type KnowledgeNodeUpdate = Database['public']['Tables']['knowledge_nodes']['Update'];

export interface NodeWithAuthor extends KnowledgeNode {
  author_name?: string;
  author_avatar?: string;
  hotness_score?: number;
}

export interface ValidationResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export interface NodeSearchFilters {
  category?: string;
  tags?: string[];
  status?: string[];
  minEmergence?: number;
}

// ============================================
// 知识节点 CRUD 操作
// ============================================

/**
 * 创建新知识节点
 */
export async function createKnowledgeNode(
  nodeData: KnowledgeNodeInsert,
  user: User
): Promise<ValidationResult> {
  try {
    const { data, error } = await supabase
      .from('knowledge_nodes')
      .insert({
        ...nodeData,
        author_id: user.id,
        status: nodeData.status || 'draft',
        version: 1,
        is_latest_version: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // 记录活动日志
    await logActivity('node_created', { node_id: data.id });

    return {
      success: true,
      message: 'Knowledge node created successfully',
      data
    };
  } catch (err: any) {
    return {
      success: false,
      message: 'Failed to create knowledge node',
      error: err.message
    };
  }
}

/**
 * 更新知识节点
 */
export async function updateKnowledgeNode(
  nodeId: string,
  updates: KnowledgeNodeUpdate,
  user: User
): Promise<ValidationResult> {
  try {
    // 检查权限
    const { data: existing } = await supabase
      .from('knowledge_nodes')
      .select('author_id, status')
      .eq('id', nodeId)
      .single();

    if (!existing) {
      return {
        success: false,
        message: 'Node not found'
      };
    }

    // 只有作者或验证者可以更新
    const userProfile = await getUserProfile(user.id);
    const isAuthor = existing.author_id === user.id;
    const isValidator = ['validator', 'admin'].includes(userProfile?.role || '');

    if (!isAuthor && !isValidator) {
      return {
        success: false,
        message: 'Insufficient permissions'
      };
    }

    const { data, error } = await supabase
      .from('knowledge_nodes')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', nodeId)
      .select()
      .single();

    if (error) throw error;

    // 记录活动日志
    await logActivity('node_updated', { node_id: nodeId });

    return {
      success: true,
      message: 'Knowledge node updated successfully',
      data
    };
  } catch (err: any) {
    return {
      success: false,
      message: 'Failed to update knowledge node',
      error: err.message
    };
  }
}

/**
 * 获取知识节点详情
 */
export async function getKnowledgeNode(nodeId: string): Promise<KnowledgeNode | null> {
  try {
    const { data, error } = await supabase
      .from('knowledge_nodes')
      .select(`
        *,
        author:author_id (
          id,
          display_name,
          avatar_url
        )
      `)
      .eq('id', nodeId)
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error fetching node:', err);
    return null;
  }
}

/**
 * 获取热门知识节点
 */
export async function getHotNodes(limit: number = 20): Promise<NodeWithAuthor[]> {
  try {
    const { data, error } = await supabase
      .from('hot_knowledge_nodes')
      .select('*')
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error fetching hot nodes:', err);
    return [];
  }
}

/**
 * 搜索知识节点
 */
export async function searchNodes(
  query: string,
  filters?: NodeSearchFilters
): Promise<KnowledgeNode[]> {
  try {
    let builder = supabase
      .from('knowledge_nodes')
      .select('*')
      .ilike('title', `%${query}%`);

    if (filters?.category) {
      builder = builder.eq('category', filters.category);
    }

    if (filters?.status) {
      builder = builder.in('status', filters.status);
    }

    if (filters?.minEmergence) {
      builder = builder.gte('emergence_level', filters.minEmergence);
    }

    const { data, error } = await builder;

    if (error) throw error;

    // 客户端标签过滤
    if (filters?.tags && data) {
      return data.filter(node =>
        filters.tags!.every(tag => node.tags?.includes(tag))
      );
    }

    return data || [];
  } catch (err) {
    console.error('Error searching nodes:', err);
    return [];
  }
}

/**
 * 全文搜索
 */
export async function fullTextSearch(query: string, limit: number = 50): Promise<KnowledgeNode[]> {
  try {
    const { data, error } = await supabase.rpc('search_nodes', {
      search_query: query,
      result_limit: limit
    });

    if (error) throw error;
    return data || [];
  } catch (err) {
    // Fallback: 简单搜索
    return searchNodes(query, { status: ['validated', 'merged'] });
  }
}

// ============================================
// 辅助函数
// ============================================

async function getUserProfile(userId: string): Promise<any> {
  const { data } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', userId)
    .single();
  return data;
}

async function logActivity(
  eventType: string,
  metadata: Record<string, any>
): Promise<void> {
  const user = await supabase.auth.getUser();
  
  await supabase.from('activity_logs').insert({
    user_id: user.data?.user?.id,
    event_type: eventType,
    metadata,
    ip_address: '', // 需要服务端获取
    created_at: new Date().toISOString()
  });
}

// ============================================
// 导出
// ============================================

export default {
  createKnowledgeNode,
  updateKnowledgeNode,
  getKnowledgeNode,
  getHotNodes,
  searchNodes,
  fullTextSearch
};
