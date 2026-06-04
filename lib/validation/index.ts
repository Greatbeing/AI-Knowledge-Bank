/**
 * AI Knowledge Bank - Validation Module
 * 知识验证工作流功能
 */

import { supabase, type User } from '../auth';
import type { Database } from '../../types/supabase';
import { updateKnowledgeNode, getKnowledgeNode } from '../nodes';
import { createNotification, logActivity, getUserProfile } from '../utils/internal-helpers';

// ============================================
// 类型定义
// ============================================

export type ValidationRequest = Database['public']['Tables']['validation_requests']['Row'];
export type ValidationRequestInsert = Database['public']['Tables']['validation_requests']['Insert'];

export interface ValidationResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

// ============================================
// 验证工作流
// ============================================

/**
 * 提交验证请求
 */
export async function submitValidationRequest(
  nodeId: string,
  validationData: Omit<ValidationRequestInsert, 'node_id'>,
  user: User
): Promise<ValidationResult> {
  try {
    const { data, error } = await supabase
      .from('validation_requests')
      .insert({
        node_id: nodeId,
        submitter_id: user.id,
        status: 'pending',
        created_at: new Date().toISOString(),
        ...validationData
      })
      .select()
      .single();

    if (error) throw error;

    // 更新节点状态
    const node = await getKnowledgeNode(nodeId);
    if (node) {
      await updateKnowledgeNode(nodeId, { status: 'pending' }, user);
    }

    // 通知作者
    if (node?.author_id) {
      await createNotification({
        user_id: node.author_id,
        type: 'validation_request',
        title: 'Validation Request Submitted',
        content: `Your node "${node.title}" has been submitted for validation.`,
        metadata: { node_id: nodeId, validation_id: data.id }
      });
    }

    await logActivity('validation_submitted', { node_id: nodeId, validation_id: data.id });

    return {
      success: true,
      message: 'Validation request submitted successfully',
      data
    };
  } catch (err: any) {
    return {
      success: false,
      message: 'Failed to submit validation request',
      error: err.message
    };
  }
}

/**
 * 审核验证请求
 */
export async function reviewValidationRequest(
  validationId: string,
  decision: 'approved' | 'rejected',
  comments: string,
  user: User
): Promise<ValidationResult> {
  try {
    const { data, error } = await supabase
      .from('validation_requests')
      .update({
        status: decision,
        reviewer_id: user.id,
        review_comments: comments,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', validationId)
      .select('node_id')
      .single();

    if (error) throw error;

    // 如果批准，更新节点状态
    if (decision === 'approved') {
      await updateKnowledgeNode(data.node_id, { 
        status: 'validated',
        validated_at: new Date().toISOString()
      }, user);
    }

    // 通知提交者
    const validation = await getValidationRequest(validationId);
    if (validation?.submitter_id) {
      await createNotification({
        user_id: validation.submitter_id,
        type: 'validation_result',
        title: `Validation ${decision === 'approved' ? 'Approved' : 'Rejected'}`,
        content: comments,
        metadata: { validation_id: validationId, node_id: data.node_id }
      });
    }

    await logActivity('validation_reviewed', { 
      validation_id: validationId, 
      decision 
    });

    return {
      success: true,
      message: `Validation ${decision} successfully`,
      data
    };
  } catch (err: any) {
    return {
      success: false,
      message: 'Failed to review validation',
      error: err.message
    };
  }
}

/**
 * 获取待验证列表
 */
export async function getPendingValidations(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('pending_validations')
      .select('*');

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error fetching pending validations:', err);
    return [];
  }
}

/**
 * 获取验证请求详情
 */
export async function getValidationRequest(id: string): Promise<ValidationRequest | null> {
  try {
    const { data, error } = await supabase
      .from('validation_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error fetching validation:', err);
    return null;
  }
}

// ============================================
// 导出
// ============================================

export default {
  submitValidationRequest,
  reviewValidationRequest,
  getPendingValidations,
  getValidationRequest
};
