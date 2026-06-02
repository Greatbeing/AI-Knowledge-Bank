// TypeScript interfaces for AI Knowledge Bank

export interface Node {
  id: string;
  parent_id?: string;
  title: string;
  description: string;
  content: Record<string, unknown>;
  node_type: 'prompt' | 'workflow' | 'case_study';
  weight: number;
  is_mainline: boolean;
  is_emerging: boolean;
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

/**
 * Class name utility function
 */
export type ClassValue = string | number | boolean | undefined | null | ClassValue[];
