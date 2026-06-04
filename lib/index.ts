/**
 * AI Knowledge Bank - Library Entry Point
 * 知识库核心库入口文件
 */

// Auth
export { supabase, signIn, signUp, signOut, getCurrentUser } from './auth';
export type { User, Session, AuthState } from './auth';

// Types
export type {
  // Knowledge types
  KnowledgeNode,
  KnowledgeNodeInsert,
  KnowledgeNodeUpdate,
  ValidationRequest,
  ValidationRequestInsert,
  NodeFork,
  MergeProposal,
  EvolutionHistory,
  NodeComment,
  NodeSubscription,
  CASMetrics,
  ValidationResult,
  NodeWithAuthor,
  NodeSearchFilters,
  // User types
  UserProfile,
  UserBadge,
  Notification,
  ActivityLog,
  UserLeaderboard,
  UserSession,
  OAuthProvider,
  UserStats,
  UserQueryFilters
} from './types';

// API Layer
export * from './api/supabase-client';

// React Hooks
export * from './hooks/useKnowledgeBank';

// Nodes Module
export {
  createKnowledgeNode,
  updateKnowledgeNode,
  getKnowledgeNode,
  getHotNodes,
  searchNodes,
  fullTextSearch
} from './nodes';
export type {
  KnowledgeNode as NodeKnowledge,
  KnowledgeNodeInsert,
  KnowledgeNodeUpdate,
  NodeWithAuthor,
  ValidationResult as NodeValidationResult,
  NodeSearchFilters
} from './nodes';

// Validation Module
export {
  submitValidationRequest,
  reviewValidationRequest,
  getPendingValidations,
  getValidationRequest
} from './validation';
export type {
  ValidationRequest,
  ValidationRequestInsert,
  ValidationResult as ValidationModuleResult
} from './validation';

// Fork & Merge Module
export {
  createFork,
  submitMergeProposal,
  voteOnMergeProposal,
  decideMergeProposal
} from './fork-merge';
export type {
  NodeFork,
  NodeForkInsert,
  MergeProposal,
  MergeProposalInsert,
  ValidationResult as ForkMergeResult
} from './fork-merge';

// Comments Module
export {
  addComment,
  getNodeComments,
  voteComment
} from './comments';
export type {
  NodeComment,
  NodeCommentInsert,
  ValidationResult as CommentResult
} from './comments';

// Subscriptions Module
export {
  subscribeToNode,
  unsubscribeFromNode,
  getUserSubscriptions
} from './subscriptions';
export type {
  NodeSubscription,
  ValidationResult as SubscriptionResult
} from './subscriptions';

// Evolution Module
export {
  getNodeEvolutionHistory,
  getRecentActivity
} from './evolution';
export type {
  EvolutionHistory
} from './evolution';

// Metrics Module
export {
  calculateCASMetrics,
  updateNodeCASMetrics,
  autoUpdateNodeMetrics
} from './metrics';
export type {
  CASMetrics,
  ValidationResult as MetricsResult
} from './metrics';

// Default exports for convenience
import nodes from './nodes';
import validation from './validation';
import forkMerge from './fork-merge';
import comments from './comments';
import subscriptions from './subscriptions';
import evolution from './evolution';
import metrics from './metrics';
import * as api from './api/supabase-client';
import * as hooks from './hooks/useKnowledgeBank';

export const modules = {
  nodes,
  validation,
  forkMerge,
  comments,
  subscriptions,
  evolution,
  metrics,
  api,
  hooks
};

export default modules;
