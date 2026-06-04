/**
 * AI Knowledge Bank - Evolution Module
 * 知识演化历史和动态追踪功能
 */

import { supabase } from '../auth';
import type { Database } from '../../types/supabase';

// ============================================
// 类型定义
// ============================================

export type EvolutionHistory = Database['public']['Tables']['evolution_history']['Row'];

// ============================================
// 演化历史查询
// ============================================

/**
 * 获取节点演化历史
 */
export async function getNodeEvolutionHistory(
  nodeId: string,
  limit: number = 50
): Promise<EvolutionHistory[]> {
  try {
    const { data, error } = await supabase
      .from('evolution_history')
      .select(`
        *,
        actor:actor_id (
          id,
          display_name,
          avatar_url
        )
      `)
      .eq('node_id', nodeId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error fetching evolution history:', err);
    return [];
  }
}

/**
 * 获取全局演化动态
 */
export async function getRecentActivity(limit: number = 100): Promise<EvolutionHistory[]> {
  try {
    const { data, error } = await supabase
      .from('evolution_history')
      .select(`
        *,
        node:node_id (
          id,
          title,
          status
        ),
        actor:actor_id (
          id,
          display_name,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error fetching recent activity:', err);
    return [];
  }
}

// ============================================
// 导出
// ============================================

export default {
  getNodeEvolutionHistory,
  getRecentActivity
};
