/**
 * AI Knowledge Bank - Supabase Database Types
 * Auto-generated types from Supabase schema
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ============================================
// Database Schema Types
// ============================================

export interface Database {
  public: {
    Tables: {
      // Knowledge Nodes Table
      knowledge_nodes: {
        Row: {
          id: string
          title: string
          description: string
          content: string
          skill_category: string
          tags: string[] | null
          parent_id: string | null
          version: number
          status: 'draft' | 'pending' | 'validated' | 'rejected' | 'merged' | 'deprecated'
          cas_score: number
          complexity_score: number
          adaptability_score: number
          emergence_level: number
          author_id: string
          author_name: string | null
          author_avatar: string | null
          is_latest_version: boolean
          validated_at: string | null
          merged_at: string | null
          created_at: string
          updated_at: string
          metadata: Json | null
        }
        Insert: {
          id?: string
          title: string
          description: string
          content: string
          skill_category: string
          tags?: string[] | null
          parent_id?: string | null
          version?: number
          status?: 'draft' | 'pending' | 'validated' | 'rejected' | 'merged' | 'deprecated'
          cas_score?: number
          complexity_score?: number
          adaptability_score?: number
          emergence_level?: number
          author_id: string
          author_name?: string | null
          author_avatar?: string | null
          is_latest_version?: boolean
          validated_at?: string | null
          merged_at?: string | null
          created_at?: string
          updated_at?: string
          metadata?: Json | null
        }
        Update: {
          id?: string
          title?: string
          description?: string
          content?: string
          skill_category?: string
          tags?: string[] | null
          parent_id?: string | null
          version?: number
          status?: 'draft' | 'pending' | 'validated' | 'rejected' | 'merged' | 'deprecated'
          cas_score?: number
          complexity_score?: number
          adaptability_score?: number
          emergence_level?: number
          author_id?: string
          author_name?: string | null
          author_avatar?: string | null
          is_latest_version?: boolean
          validated_at?: string | null
          merged_at?: string | null
          created_at?: string
          updated_at?: string
          metadata?: Json | null
        }
      }

      // Validation Requests Table
      validation_requests: {
        Row: {
          id: string
          node_id: string
          submitter_id: string
          reviewer_id: string | null
          status: 'pending' | 'approved' | 'rejected'
          justification: string | null
          review_comments: string | null
          created_at: string
          reviewed_at: string | null
        }
        Insert: {
          id?: string
          node_id: string
          submitter_id: string
          reviewer_id?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          justification?: string | null
          review_comments?: string | null
          created_at?: string
          reviewed_at?: string | null
        }
        Update: {
          id?: string
          node_id?: string
          submitter_id?: string
          reviewer_id?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          justification?: string | null
          review_comments?: string | null
          created_at?: string
          reviewed_at?: string | null
        }
      }

      // Fork Proposals Table
      fork_proposals: {
        Row: {
          id: string
          source_node_id: string
          proposed_by: string
          title: string
          description: string
          content_changes: string
          status: 'pending' | 'approved' | 'rejected'
          votes_for: number
          votes_against: number
          created_at: string
          resolved_at: string | null
        }
        Insert: {
          id?: string
          source_node_id: string
          proposed_by: string
          title: string
          description: string
          content_changes: string
          status?: 'pending' | 'approved' | 'rejected'
          votes_for?: number
          votes_against?: number
          created_at?: string
          resolved_at?: string | null
        }
        Update: {
          id?: string
          source_node_id?: string
          proposed_by?: string
          title?: string
          description?: string
          content_changes?: string
          status?: 'pending' | 'approved' | 'rejected'
          votes_for?: number
          votes_against?: number
          created_at?: string
          resolved_at?: string | null
        }
      }

      // Merge Proposals Table
      merge_proposals: {
        Row: {
          id: string
          source_node_ids: string[]
          target_node_id: string
          proposed_by: string
          justification: string
          status: 'pending' | 'approved' | 'rejected'
          votes_for: number
          votes_against: number
          created_at: string
          resolved_at: string | null
        }
        Insert: {
          id?: string
          source_node_ids: string[]
          target_node_id: string
          proposed_by: string
          justification: string
          status?: 'pending' | 'approved' | 'rejected'
          votes_for?: number
          votes_against?: number
          created_at?: string
          resolved_at?: string | null
        }
        Update: {
          id?: string
          source_node_ids?: string[]
          target_node_id?: string
          proposed_by?: string
          justification?: string
          status?: 'pending' | 'approved' | 'rejected'
          votes_for?: number
          votes_against?: number
          created_at?: string
          resolved_at?: string | null
        }
      }

      // Comments Table
      comments: {
        Row: {
          id: string
          node_id: string
          author_id: string
          author_name: string | null
          author_avatar: string | null
          content: string
          parent_comment_id: string | null
          votes: number
          is_edited: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          node_id: string
          author_id: string
          author_name?: string | null
          author_avatar?: string | null
          content: string
          parent_comment_id?: string | null
          votes?: number
          is_edited?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          node_id?: string
          author_id?: string
          author_name?: string | null
          author_avatar?: string | null
          content?: string
          parent_comment_id?: string | null
          votes?: number
          is_edited?: boolean
          created_at?: string
          updated_at?: string
        }
      }

      // Subscriptions Table
      subscriptions: {
        Row: {
          id: string
          user_id: string
          node_id: string
          notification_types: string[]
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          node_id: string
          notification_types?: string[]
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          node_id?: string
          notification_types?: string[]
          created_at?: string
        }
      }

      // Evolution History Table
      evolution_history: {
        Row: {
          id: string
          node_id: string
          event_type: 'created' | 'updated' | 'forked' | 'merged' | 'validated' | 'deprecated'
          previous_version: number | null
          new_version: number
          changes_summary: string | null
          actor_id: string
          created_at: string
        }
        Insert: {
          id?: string
          node_id: string
          event_type: 'created' | 'updated' | 'forked' | 'merged' | 'validated' | 'deprecated'
          previous_version?: number | null
          new_version: number
          changes_summary?: string | null
          actor_id: string
          created_at?: string
        }
        Update: {
          id?: string
          node_id?: string
          event_type?: 'created' | 'updated' | 'forked' | 'merged' | 'validated' | 'deprecated'
          previous_version?: number | null
          new_version?: number
          changes_summary?: string | null
          actor_id?: string
          created_at?: string
        }
      }

      // User Profiles Table
      user_profiles: {
        Row: {
          id: string
          username: string | null
          display_name: string | null
          avatar_url: string | null
          bio: string | null
          role: 'user' | 'validator' | 'admin'
          badges: string[] | null
          total_contributions: number
          validated_contributions: number
          reputation_score: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          role?: 'user' | 'validator' | 'admin'
          badges?: string[] | null
          total_contributions?: number
          validated_contributions?: number
          reputation_score?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          role?: 'user' | 'validator' | 'admin'
          badges?: string[] | null
          total_contributions?: number
          validated_contributions?: number
          reputation_score?: number
          created_at?: string
          updated_at?: string
        }
      }

      // Notifications Table
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          content: string
          metadata: Json | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          content: string
          metadata?: Json | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          content?: string
          metadata?: Json | null
          is_read?: boolean
          created_at?: string
        }
      }

      // Activity Logs Table
      activity_logs: {
        Row: {
          id: string
          user_id: string | null
          event_type: string
          metadata: Json | null
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          event_type: string
          metadata?: Json | null
          ip_address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          event_type?: string
          metadata?: Json | null
          ip_address?: string | null
          created_at?: string
        }
      }
    }

    // Views
    Views: {
      hot_knowledge_nodes: {
        Row: {
          id: string
          title: string
          description: string
          skill_category: string
          cas_score: number
          hotness_score: number
          author_name: string | null
          author_avatar: string | null
          trend_direction: 'up' | 'down' | 'stable'
        }
      }
      pending_validations: {
        Row: {
          id: string
          node_id: string
          node_title: string
          submitter_name: string | null
          justification: string | null
          created_at: string
          days_pending: number
        }
      }
    }

    // Functions
    Functions: {
      search_nodes: {
        Args: {
          search_query: string
          result_limit?: number
        }
        Returns: {
          id: string
          title: string
          description: string
          content: string
          skill_category: string
          cas_score: number
          rank: number
        }[]
      }
      calculate_hotness: {
        Args: {
          node_id: string
        }
        Returns: number
      }
    }
  }
}

// Type helpers
export type KnowledgeNode = Database['public']['Tables']['knowledge_nodes']['Row']
export type KnowledgeNodeInsert = Database['public']['Tables']['knowledge_nodes']['Insert']
export type KnowledgeNodeUpdate = Database['public']['Tables']['knowledge_nodes']['Update']

export type ValidationRequest = Database['public']['Tables']['validation_requests']['Row']
export type ValidationRequestInsert = Database['public']['Tables']['validation_requests']['Insert']

export type ForkProposal = Database['public']['Tables']['fork_proposals']['Row']
export type MergeProposal = Database['public']['Tables']['merge_proposals']['Row']

export type Comment = Database['public']['Tables']['comments']['Row']
export type CommentInsert = Database['public']['Tables']['comments']['Insert']

export type Subscription = Database['public']['Tables']['subscriptions']['Row']

export type EvolutionHistory = Database['public']['Tables']['evolution_history']['Row']

export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type UserProfileInsert = Database['public']['Tables']['user_profiles']['Insert']

export type Notification = Database['public']['Tables']['notifications']['Row']

export type ActivityLog = Database['public']['Tables']['activity_logs']['Row']
