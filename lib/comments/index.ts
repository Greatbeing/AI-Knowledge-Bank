/**
 * AI Knowledge Bank - Comments Module
 * 知识节点评论和投票功能
 */

import { supabase, type User } from '../auth';
import type { Database } from '../../types/supabase';
import { logActivity } from '../utils/internal-helpers';

// ============================================
// 类型定义
// ============================================

export type NodeComment = Database['public']['Tables']['node_comments']['Row'];
export type NodeCommentInsert = Database['public']['Tables']['node_comments']['Insert'];

export interface ValidationResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

// ============================================
// 评论功能
// ============================================

/**
 * 添加评论
 */
export async function addComment(
  nodeId: string,
  content: string,
  user: User,
  parentId?: string
): Promise<ValidationResult> {
  try {
    const { data, error } = await supabase
      .from('node_comments')
      .insert({
        node_id: nodeId,
        author_id: user.id,
        content,
        parent_id: parentId,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

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
 * 获取节点评论列表
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
    // 检查是否已投票
    const { data: existingVote } = await supabase
      .from('comment_votes')
      .select('*')
      .eq('comment_id', commentId)
      .eq('user_id', user.id)
      .single();

    if (existingVote) {
      // 更新投票
      const { data, error } = await supabase
        .from('comment_votes')
        .update({ vote_type: vote, updated_at: new Date().toISOString() })
        .eq('comment_id', commentId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      // 重新计算评论得分
      await recalculateCommentScore(commentId);

      return {
        success: true,
        message: 'Vote updated',
        data
      };
    } else {
      // 新投票
      const { data, error } = await supabase
        .from('comment_votes')
        .insert({
          comment_id: commentId,
          user_id: user.id,
          vote_type: vote,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // 重新计算评论得分
      await recalculateCommentScore(commentId);

      await logActivity('comment_voted', { 
        comment_id: commentId, 
        vote 
      });

      return {
        success: true,
        message: 'Vote recorded',
        data
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: 'Failed to record vote',
      error: err.message
    };
  }
}

/**
 * 重新计算评论得分
 */
async function recalculateCommentScore(commentId: string): Promise<void> {
  const { data: votes } = await supabase
    .from('comment_votes')
    .select('vote_type')
    .eq('comment_id', commentId);

  if (!votes) return;

  const upVotes = votes.filter(v => v.vote_type === 'up').length;
  const downVotes = votes.filter(v => v.vote_type === 'down').length;
  const score = upVotes - downVotes;

  await supabase
    .from('node_comments')
    .update({
      score,
      upvotes: upVotes,
      downvotes: downVotes
    })
    .eq('id', commentId);
}

// ============================================
// 导出
// ============================================

export default {
  addComment,
  getNodeComments,
  voteComment
};
