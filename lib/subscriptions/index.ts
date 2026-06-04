/**
 * AI Knowledge Bank - Subscriptions Module
 * 知识节点订阅功能
 */

import { supabase, type User } from '../auth';
import type { Database } from '../../types/supabase';

// ============================================
// 类型定义
// ============================================

export type NodeSubscription = Database['public']['Tables']['node_subscriptions']['Row'];

export interface ValidationResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

// ============================================
// 订阅功能
// ============================================

/**
 * 订阅节点
 */
export async function subscribeToNode(
  nodeId: string,
  subscriptionType: NodeSubscription['subscription_type'],
  user: User
): Promise<ValidationResult> {
  try {
    const { data, error } = await supabase
      .from('node_subscriptions')
      .upsert({
        node_id: nodeId,
        user_id: user.id,
        subscription_type: subscriptionType,
        notify_email: true,
        notify_in_app: true
      })
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      message: 'Subscribed successfully',
      data
    };
  } catch (err: any) {
    return {
      success: false,
      message: 'Failed to subscribe',
      error: err.message
    };
  }
}

/**
 * 取消订阅
 */
export async function unsubscribeFromNode(
  nodeId: string,
  user: User
): Promise<ValidationResult> {
  try {
    const { error } = await supabase
      .from('node_subscriptions')
      .delete()
      .eq('node_id', nodeId)
      .eq('user_id', user.id);

    if (error) throw error;

    return {
      success: true,
      message: 'Unsubscribed successfully'
    };
  } catch (err: any) {
    return {
      success: false,
      message: 'Failed to unsubscribe',
      error: err.message
    };
  }
}

/**
 * 获取用户订阅
 */
export async function getUserSubscriptions(userId: string): Promise<NodeSubscription[]> {
  try {
    const { data, error } = await supabase
      .from('node_subscriptions')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error fetching subscriptions:', err);
    return [];
  }
}

// ============================================
// 导出
// ============================================

export default {
  subscribeToNode,
  unsubscribeFromNode,
  getUserSubscriptions
};
