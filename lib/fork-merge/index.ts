/**
 * AI Knowledge Bank - Fork & Merge Module
 * 知识节点分叉和合并工作流功能
 */

import { supabase, type User } from '../auth';
import type { Database } from '../../types/supabase';
import { createKnowledgeNode, updateKnowledgeNode, getKnowledgeNode } from '../nodes';
import { createNotification, logActivity } from '../utils/internal-helpers';

// ============================================
// 类型定义
// ============================================

export type NodeFork = Database['public']['Tables']['node_forks']['Row'];
export type NodeForkInsert = Database['public']['Tables']['node_forks']['Insert'];

export type MergeProposal = Database['public']['Tables']['merge_proposals']['Row'];
export type MergeProposalInsert = Database['public']['Tables']['merge_proposals']['Insert'];

export interface ValidationResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

// ============================================
// Fork 工作流
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

// ============================================
// Merge 工作流
// ============================================

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
      data: { proposal_id: proposalId, decision }
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
// 导出
// ============================================

export default {
  createFork,
  submitMergeProposal,
  voteOnMergeProposal,
  decideMergeProposal
};
