// TypeScript interfaces for AI Knowledge Bank

export type VaultType = 'knowledge' | 'tool' | 'case';
export type LegacyNodeType = 'prompt' | 'workflow' | 'case_study';

export interface Node {
  id: string;
  parent_id?: string;
  title: string;
  description: string;
  content: Record<string, unknown>;
  node_type: LegacyNodeType;
  vault_type?: VaultType;
  weight: number;
  is_mainline: boolean;
  is_emerging: boolean;
  source_refs?: string[];
  scenario_tags?: string[];
  trust_score?: number;
  language?: 'zh' | 'en' | 'bilingual';
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  username: string;
  reputation_score: number;
  expertise_areas: string[];
  created_at: string;
}

export interface Interaction {
  id: string;
  node_id: string;
  user_id: string;
  action_type: 'validate' | 'fork' | 'merge' | 'comment';
  payload?: Record<string, unknown>;
  created_at: string;
}

export interface EvolutionTreeNode extends Node {
  depth: number;
  path: string[];
}

export interface ValidationPayload {
  score: number;
  comment?: string;
  context?: string;
}

export interface ForkPayload {
  source_node_id: string;
  changes_description?: string;
}

export interface CrossVaultRagQuery {
  query: string;
  locale: 'zh' | 'en';
  user_context?: {
    role?: string;
    industry?: string;
    maturity?: 'beginner' | 'operator' | 'expert';
  };
  limit_per_vault?: number;
}

export interface CrossVaultRagResult {
  node_id: string;
  vault_type: VaultType;
  title: string;
  summary: string;
  recommendation_reason: string;
  trust_score: number;
  citations: string[];
}

export interface CrossVaultRagResponse {
  query: string;
  locale: 'zh' | 'en';
  knowledge: CrossVaultRagResult[];
  tools: CrossVaultRagResult[];
  cases: CrossVaultRagResult[];
  synthesized_answer?: string;
}

export interface CommunityEvolutionSignal {
  id: string;
  node_id: string;
  signal_type: 'validated' | 'used' | 'forked' | 'commented' | 'merged' | 'disputed';
  impact_delta: number;
  confidence: number;
  evidence_url?: string;
  created_at: string;
}

/**
 * Class name utility function
 */
export type ClassValue = string | number | boolean | undefined | null | ClassValue[];
