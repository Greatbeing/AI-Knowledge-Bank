/**
 * AI Knowledge Bank - Knowledge Node Types
 * 知识节点相关类型定义
 */

import type { Database } from '../types/supabase';

// ============================================
// Core Knowledge Node Types
// ============================================

export type KnowledgeNode = Database['public']['Tables']['knowledge_nodes']['Row'];
export type KnowledgeNodeInsert = Database['public']['Tables']['knowledge_nodes']['Insert'];
export type KnowledgeNodeUpdate = Database['public']['Tables']['knowledge_nodes']['Update'];

// ============================================
// Validation Types
// ============================================

export type ValidationRequest = Database['public']['Tables']['validation_requests']['Row'];
export type ValidationRequestInsert = Database['public']['Tables']['validation_requests']['Insert'];

// ============================================
// Fork & Merge Types
// ============================================

export type NodeFork = Database['public']['Tables']['node_forks']['Row'];
export type NodeForkInsert = Database['public']['Tables']['node_forks']['Insert'];

export type MergeProposal = Database['public']['Tables']['merge_proposals']['Row'];
export type MergeProposalInsert = Database['public']['Tables']['merge_proposals']['Insert'];

// ============================================
// Comment & Subscription Types
// ============================================

export type NodeComment = Database['public']['Tables']['node_comments']['Row'];
export type NodeSubscription = Database['public']['Tables']['node_subscriptions']['Row'];

// ============================================
// Evolution & Activity Types
// ============================================

export type EvolutionHistory = Database['public']['Tables']['evolution_history']['Row'];

// ============================================
// Extended Types with Relations
// ============================================

export interface NodeWithAuthor extends KnowledgeNode {
  author_name?: string;
  author_avatar?: string;
  hotness_score?: number;
}

// ============================================
// CAS Metrics Interface
// ============================================

export interface CASMetrics {
  emergence_level: number;
  complexity_score: number;
  connectivity_score: number;
  adaptation_score: number;
}

// ============================================
// Common Result Types
// ============================================

export interface ValidationResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

// ============================================
// Filter & Query Types
// ============================================

export interface NodeSearchFilters {
  category?: string;
  tags?: string[];
  status?: string[];
  minEmergence?: number;
}
