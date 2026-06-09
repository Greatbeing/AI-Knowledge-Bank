/**
 * AI Knowledge Bank - Knowledge Workflow Library
 * 知识提交、验证、合并和演化工作流核心逻辑
 */

import { supabase, type User } from './auth';
import type { Database } from '../types/supabase';

// ============================================
// 类型定义
// ============================================

export type KnowledgeNode = Database['public']['Tables']['knowledge_nodes']['Row'];
export type KnowledgeNodeInsert = Database['public']['Tables']['knowledge_nodes']['Insert'];
export type KnowledgeNodeUpdate = Database['public']['Tables']['knowledge_nodes']['Update'];

export type ValidationRequest = Database['public']['Tables']['validation_requests']['Row'];
export type ValidationRequestInsert = Database['public']['Tables']['validation_requests']['Insert'];

export type NodeFork = Database['public']['Tables']['node_forks']['Row'];
export type NodeForkInsert = Database['public']['Tables']['node_forks']['Insert'];

export type MergeProposal = Database['public']['Tables']['merge_proposals']['Row'];
export type MergeProposalInsert = Database['public']['Tables']['merge_proposals']['Insert'];

export type EvolutionHistory = Database['public']['Tables']['evolution_history']['Row'];
export type NodeComment = Database['public']['Tables']['node_comments']['Row'];
export type NodeSubscription = Database['public']['Tables']['node_subscriptions']['Row'];

export interface CASMetrics {
  emergence_level: number;
  complexity_score: number;
  connectivity_score: number;
  adaptation_score: number;
}

export interface NodeWithAuthor extends KnowledgeNode {
  author_name?: string | null;
  author_avatar?: string | null;
  hotness_score?: number | null;
}

export interface ValidationResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
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
  filters?: {
    category?: string;
    tags?: string[];
    status?: string[];
    minEmergence?: number;
  }
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
    await updateKnowledgeNode(nodeId, { status: 'pending' }, user);

    // 通知作者
    const node = await getKnowledgeNode(nodeId);
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
// Fork 和 Merge 工作流
// ============================================

/**
 * 创建分叉
 */
export async function createFork(
  originalNodeId: string,
  forkReason: string,
  forkType: NodeForkInsert['fork_type'],
  user: User
): Promise<ValidationResult> {
  try {
    // 获取原始节点
    const original = await getKnowledgeNode(originalNodeId);
    if (!original) {
      return { success: false, message: 'Original node not found' };
    }

    // 创建新节点（分叉版本）
    const newNodeResult = await createKnowledgeNode({
      title: `${original.title} (Fork)`,
      content: original.content,
      summary: original.summary,
      tags: original.tags,
      category: original.category,
      parent_id: originalNodeId,
      status: 'draft'
    }, user);

    if (!newNodeResult.success || !newNodeResult.data) {
      return newNodeResult;
    }

    // 创建分叉记录
    const { data, error } = await supabase
      .from('node_forks')
      .insert({
        original_node_id: originalNodeId,
        forked_node_id: newNodeResult.data.id,
        fork_reason: forkReason,
        fork_type: forkType,
        forked_by: user.id,
        merge_status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    await logActivity('node_forked', { 
      original_node_id: originalNodeId, 
      fork_id: data.id 
    });

    return {
      success: true,
      message: 'Fork created successfully',
      data
    };
  } catch (err: any) {
    return {
      success: false,
      message: 'Failed to create fork',
      error: err.message
    };
  }
}

/**
 * 提交合并提案
 */
export async function submitMergeProposal(
  sourceNodeId: string,
  targetNodeId: string,
  proposalData: Omit<MergeProposalInsert, 'source_node_id' | 'target_node_id'>,
  user: User
): Promise<ValidationResult> {
  try {
    const { data, error } = await supabase
      .from('merge_proposals')
      .insert({
        source_node_id: sourceNodeId,
        target_node_id: targetNodeId,
        proposer_id: user.id,
        status: 'pending',
        votes_for: 1,
        voters: [user.id],
        ...proposalData
      })
      .select()
      .single();

    if (error) throw error;

    // 通知目标节点作者
    const targetNode = await getKnowledgeNode(targetNodeId);
    if (targetNode?.author_id && targetNode.author_id !== user.id) {
      await createNotification({
        user_id: targetNode.author_id,
        type: 'merge_proposal',
        title: 'Merge Proposal Submitted',
        content: `A merge proposal has been submitted for your node "${targetNode.title}".`,
        metadata: { proposal_id: data.id, source_node_id: sourceNodeId }
      });
    }

    await logActivity('merge_proposed', { 
      proposal_id: data.id,
      source_node_id: sourceNodeId,
      target_node_id: targetNodeId
    });

    return {
      success: true,
      message: 'Merge proposal submitted successfully',
      data
    };
  } catch (err: any) {
    return {
      success: false,
      message: 'Failed to submit merge proposal',
      error: err.message
    };
  }
}

/**
 * 投票支持合并提案
 */
export async function voteOnMergeProposal(
  proposalId: string,
  vote: 'for' | 'against',
  user: User
): Promise<ValidationResult> {
  try {
    const { data: proposal, error: fetchError } = await supabase
      .from('merge_proposals')
      .select('votes_for, votes_against, voters')
      .eq('id', proposalId)
      .single();

    if (fetchError) throw fetchError;

    // 检查是否已投票
    if (proposal.voters?.includes(user.id)) {
      return {
        success: false,
        message: 'Already voted on this proposal'
      };
    }

    const updateData: any = {
      voters: [...(proposal.voters || []), user.id]
    };

    if (vote === 'for') {
      updateData.votes_for = proposal.votes_for + 1;
    } else {
      updateData.votes_against = proposal.votes_against + 1;
    }

    const { data, error } = await supabase
      .from('merge_proposals')
      .update(updateData)
      .eq('id', proposalId)
      .select()
      .single();

    if (error) throw error;

    await logActivity('merge_voted', { 
      proposal_id: proposalId, 
      vote 
    });

    return {
      success: true,
      message: 'Vote recorded successfully',
      data
    };
  } catch (err: any) {
    return {
      success: false,
      message: 'Failed to record vote',
      error: err.message
    };
  }
}

/**
 * 决定合并提案
 */
export async function decideMergeProposal(
  proposalId: string,
  decision: 'approved' | 'rejected',
  user: User
): Promise<ValidationResult> {
  try {
    const { data: proposal, error: fetchError } = await supabase
      .from('merge_proposals')
      .select('source_node_id, target_node_id')
      .eq('id', proposalId)
      .single();

    if (fetchError) throw fetchError;

    // 更新提案状态
    const { error: updateError } = await supabase
      .from('merge_proposals')
      .update({
        status: decision,
        approver_id: user.id,
        decided_at: new Date().toISOString()
      })
      .eq('id', proposalId);

    if (updateError) throw updateError;

    // 如果批准，执行合并
    if (decision === 'approved') {
      const sourceNode = await getKnowledgeNode(proposal.source_node_id);
      
      if (sourceNode) {
        // 更新目标节点内容
        await updateKnowledgeNode(proposal.target_node_id, {
          content: `${sourceNode.content}\n\n---\n\n*Merged from: ${sourceNode.title}*`,
          merge_count: (sourceNode.merge_count || 0) + 1,
          merged_at: new Date().toISOString()
        }, user);

        // 更新源节点状态
        await updateKnowledgeNode(proposal.source_node_id, {
          status: 'merged',
          merged_at: new Date().toISOString()
        }, user);
      }
    }

    await logActivity('merge_decided', { 
      proposal_id: proposalId, 
      decision 
    });

    return {
      success: true,
      message: `Merge proposal ${decision}`,
      data: { proposalId, decision }
    };
  } catch (err: any) {
    return {
      success: false,
      message: 'Failed to decide merge proposal',
      error: err.message
    };
  }
}

// ============================================
// 评论系统
// ============================================

/**
 * 添加评论
 */
export async function addComment(
  nodeId: string,
  content: string,
  commentType: NodeComment['comment_type'],
  user: User,
  parentCommentId?: string
): Promise<ValidationResult> {
  try {
    const { data, error } = await supabase
      .from('node_comments')
      .insert({
        node_id: nodeId,
        content,
        comment_type: commentType,
        author_id: user.id,
        parent_comment_id: parentCommentId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // 通知节点作者（如果不是自己评论自己的节点）
    const node = await getKnowledgeNode(nodeId);
    if (node?.author_id && node.author_id !== user.id) {
      await createNotification({
        user_id: node.author_id,
        type: 'new_comment',
        title: 'New Comment on Your Node',
        content: `Someone commented on "${node.title}"`,
        metadata: { node_id: nodeId, comment_id: data.id }
      });
    }

    await logActivity('comment_added', { 
      node_id: nodeId, 
      comment_id: data.id 
    });

    return {
      success: true,
      message: 'Comment added successfully',
      data
    };
  } catch (err: any) {
    return {
      success: false,
      message: 'Failed to add comment',
      error: err.message
    };
  }
}

/**
 * 获取节点评论
 */
export async function getNodeComments(nodeId: string): Promise<NodeComment[]> {
  try {
    const { data, error } = await supabase
      .from('node_comments')
      .select(`
        *,
        author:author_id (
          id,
          display_name,
          avatar_url
        )
      `)
      .eq('node_id', nodeId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error fetching comments:', err);
    return [];
  }
}

/**
 * 投票评论
 */
export async function voteComment(
  commentId: string,
  vote: 'up' | 'down',
  user: User
): Promise<ValidationResult> {
  try {
    const { data: comment, error: fetchError } = await supabase
      .from('node_comments')
      .select('upvotes, downvotes, voters')
      .eq('id', commentId)
      .single();

    if (fetchError) throw fetchError;

    // 检查是否已投票
    if (comment.voters?.includes(user.id)) {
      return {
        success: false,
        message: 'Already voted on this comment'
      };
    }

    const updateData: any = {
      voters: [...(comment.voters || []), user.id]
    };

    if (vote === 'up') {
      updateData.upvotes = comment.upvotes + 1;
    } else {
      updateData.downvotes = comment.downvotes + 1;
    }

    const { data, error } = await supabase
      .from('node_comments')
      .update(updateData)
      .eq('id', commentId)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      message: 'Vote recorded',
      data
    };
  } catch (err: any) {
    return {
      success: false,
      message: 'Failed to vote',
      error: err.message
    };
  }
}

// ============================================
// 订阅系统
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
  metrics: CASMetrics
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

async function createNotification(notificationData: any): Promise<void> {
  await supabase.from('notifications').insert({
    ...notificationData,
    is_read: false,
    created_at: new Date().toISOString()
  });
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
// 导出所有功能
// ============================================

export default {
  // Nodes
  createKnowledgeNode,
  updateKnowledgeNode,
  getKnowledgeNode,
  getHotNodes,
  searchNodes,
  fullTextSearch,
  
  // Validations
  submitValidationRequest,
  reviewValidationRequest,
  getPendingValidations,
  getValidationRequest,
  
  // Forks & Merges
  createFork,
  submitMergeProposal,
  voteOnMergeProposal,
  decideMergeProposal,
  
  // Comments
  addComment,
  getNodeComments,
  voteComment,
  
  // Subscriptions
  subscribeToNode,
  unsubscribeFromNode,
  getUserSubscriptions,
  
  // Evolution
  getNodeEvolutionHistory,
  getRecentActivity,
  
  // CAS Metrics
  calculateCASMetrics,
  updateNodeCASMetrics
};
