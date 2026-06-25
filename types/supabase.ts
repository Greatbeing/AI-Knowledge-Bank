export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type TableDefinition<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

export type VaultType = 'knowledge' | 'tool' | 'case';
export type CommunitySignalType = 'validated' | 'used' | 'forked' | 'commented' | 'merged' | 'disputed';

export type KnowledgeNodeRow = {
  id: string;
  title: string;
  content: string;
  summary: string | null;
  tags: string[] | null;
  category: string | null;
  vault_type: VaultType | string | null;
  source_refs: Json | null;
  scenario_tags: string[] | null;
  language: 'zh' | 'en' | 'bilingual' | string | null;
  trust_score: number | null;
  embedding: string | null;
  emergence_level: number | null;
  complexity_score: number | null;
  connectivity_score: number | null;
  adaptation_score: number | null;
  version: number | null;
  parent_id: string | null;
  is_latest_version: boolean | null;
  status: 'draft' | 'pending' | 'validated' | 'merged' | 'deprecated' | string;
  validation_count: number | null;
  fork_count: number | null;
  merge_count: number | null;
  author_id: string | null;
  co_authors: string[] | null;
  created_at: string | null;
  updated_at: string | null;
  validated_at: string | null;
  merged_at: string | null;
  metadata: Json | null;
  source_url: string | null;
  license: string | null;
};

export type ValidationRequestRow = {
  id: string;
  node_id: string;
  submitter_id: string | null;
  validation_type: 'fact_check' | 'logic_review' | 'completeness' | 'relevance' | string | null;
  comments: string | null;
  suggested_changes: string | null;
  confidence_score: number | null;
  status: 'pending' | 'approved' | 'rejected' | 'needs_revision' | string | null;
  reviewer_id: string | null;
  review_comments: string | null;
  reviewed_at: string | null;
  created_at: string | null;
  expires_at: string | null;
  metadata: Json | null;
};

export type NodeForkRow = {
  id: string;
  original_node_id: string;
  forked_node_id: string;
  fork_reason: string | null;
  fork_type: 'improvement' | 'alternative' | 'correction' | 'extension' | string | null;
  forked_by: string | null;
  merge_status: 'pending' | 'merged' | 'rejected' | 'abandoned' | string | null;
  merged_into: string | null;
  created_at: string | null;
  merged_at: string | null;
  metadata: Json | null;
};

export type MergeProposalRow = {
  id: string;
  source_node_id: string;
  target_node_id: string;
  proposal_type: 'merge' | 'integrate' | 'replace' | 'supplement' | string | null;
  justification: string | null;
  impact_analysis: string | null;
  confidence_score: number | null;
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn' | string | null;
  proposer_id: string | null;
  approver_id: string | null;
  votes_for: number;
  votes_against: number;
  voters: string[] | null;
  created_at: string | null;
  decided_at: string | null;
  metadata: Json | null;
};

export type EvolutionHistoryRow = {
  id: string;
  node_id: string;
  event_type: string;
  description: string | null;
  old_values: Json | null;
  new_values: Json | null;
  delta: Json | null;
  actor_id: string | null;
  related_node_ids: string[] | null;
  emergence_snapshot: Json | null;
  complexity_snapshot: Json | null;
  created_at: string | null;
  metadata: Json | null;
};

export type NodeCommentRow = {
  id: string;
  node_id: string;
  parent_comment_id: string | null;
  content: string;
  comment_type: 'general' | 'question' | 'suggestion' | 'critique' | string;
  author_id: string | null;
  upvotes: number;
  downvotes: number;
  voters: string[] | null;
  is_resolved: boolean | null;
  is_edited: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  metadata: Json | null;
};

export type NodeSubscriptionRow = {
  id: string;
  node_id: string;
  user_id: string;
  subscription_type: 'all' | 'updates' | 'comments' | 'validations' | string;
  notify_email: boolean | null;
  notify_in_app: boolean | null;
  created_at: string | null;
};

export type UserProfileRow = {
  id: string;
  user_id: string;
  username: string;
  display_name?: string | null;
  email: string | null;
  avatar_url: string | null;
  bio: string | null;
  role?: string | null;
  reputation_score: number;
  expertise_areas: string[];
  total_validations: number;
  total_forks: number;
  total_merges: number;
  badges: string[];
  is_active?: boolean | null;
  last_active_at: string | null;
  created_at: string | null;
  updated_at?: string | null;
};

export type NotificationRow = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message?: string | null;
  content?: string | null;
  link_url: string | null;
  is_read: boolean | null;
  created_at: string | null;
  metadata?: Json | null;
};

export type ActivityLogRow = {
  id: string;
  user_id: string | null;
  action?: string;
  event_type?: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Json | null;
  ip_address: string | null;
  created_at: string | null;
};

export type CommunitySignalRow = {
  id: string;
  node_id: string;
  user_id: string | null;
  signal_type: CommunitySignalType | string;
  impact_delta: number;
  confidence: number;
  evidence_url: string | null;
  weight_snapshot: Json | null;
  metadata: Json | null;
  created_at: string | null;
};

export type BadgeRow = {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  criteria: Json;
  created_at: string | null;
};

export type UserBadgeRow = {
  id: string;
  user_id: string;
  badge_id: string;
  awarded_at: string | null;
  context: Json | null;
};

export type Database = {
  public: {
    Tables: {
      activity_log: TableDefinition<ActivityLogRow>;
      activity_logs: TableDefinition<ActivityLogRow>;
      badges: TableDefinition<BadgeRow>;
      community_evolution_signals: TableDefinition<CommunitySignalRow>;
      evolution_history: TableDefinition<EvolutionHistoryRow>;
      interactions: TableDefinition<{
        id: string;
        node_id: string | null;
        user_id: string | null;
        action_type: 'validate' | 'fork' | 'merge' | 'comment' | string;
        payload: Json | null;
        created_at: string | null;
      }>;
      knowledge_nodes: TableDefinition<KnowledgeNodeRow>;
      merge_proposals: TableDefinition<MergeProposalRow>;
      node_comments: TableDefinition<NodeCommentRow>;
      node_forks: TableDefinition<NodeForkRow>;
      node_subscriptions: TableDefinition<NodeSubscriptionRow>;
      nodes: TableDefinition<{
        id: string;
        parent_id: string | null;
        title: string;
        description: string | null;
        content: Json | null;
        node_type: string;
        weight: number | null;
        is_mainline: boolean | null;
        is_emerging: boolean | null;
        created_at: string | null;
        updated_at: string | null;
      }>;
      notifications: TableDefinition<NotificationRow>;
      user_badges: TableDefinition<UserBadgeRow>;
      user_follows: TableDefinition<{
        follower_id: string;
        following_id: string;
        created_at: string | null;
      }>;
      user_profiles: TableDefinition<UserProfileRow>;
      user_sessions: TableDefinition<{
        id: string;
        user_id: string | null;
        session_token: string;
        ip_address: string | null;
        user_agent: string | null;
        created_at: string | null;
        expires_at: string;
        last_seen_at: string | null;
        is_active: boolean | null;
      }>;
      validation_requests: TableDefinition<ValidationRequestRow>;
    };
    Views: {
      active_contributors: {
        Row: UserProfileRow & {
          display_name: string | null;
          nodes_created: number | null;
          validations_performed: number | null;
          forks_created: number | null;
          total_validations_received: number | null;
          total_forks_received: number | null;
        };
        Relationships: [];
      };
      cross_vault_rag_index: {
        Row: KnowledgeNodeRow & {
          search_document: string | null;
          signal_strength: number | null;
        };
        Relationships: [];
      };
      hot_knowledge_nodes: {
        Row: KnowledgeNodeRow & {
          author_name: string | null;
          author_avatar: string | null;
          hotness_score: number | null;
        };
        Relationships: [];
      };
      knowledge_graph_edges: {
        Row: {
          source_id: string;
          target_id: string;
          relationship_type: string;
          weight: number;
        };
        Relationships: [];
      };
      pending_validations: {
        Row: {
          id: string;
          title: string;
          summary: string | null;
          author_id: string | null;
          author_name: string | null;
          validation_request_count: number | null;
          latest_request: string | null;
        };
        Relationships: [];
      };
      user_leaderboard: {
        Row: UserProfileRow & {
          nodes_created: number | null;
          reputation_rank: number | null;
          validator_rank: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      search_nodes: {
        Args: {
          search_query: string;
          result_limit: number;
        };
        Returns: KnowledgeNodeRow[];
      };
      match_cross_vault_nodes: {
        Args: {
          search_query: string;
          locale_filter?: string;
          result_limit?: number;
        };
        Returns: Array<{
          id: string;
          title: string;
          summary: string | null;
          vault_type: VaultType | string | null;
          trust_score: number | null;
          emergence_level: number | null;
          rank_score: number | null;
          source_refs: Json | null;
        }>;
      };
      vote_on_merge_proposal: {
        Args: {
          p_proposal_id: string;
          p_vote: string;
          p_voter_id: string;
        };
        Returns: Json;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
