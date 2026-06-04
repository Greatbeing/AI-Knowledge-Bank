// Augment Supabase Database type with missing tables
import { Database as BaseDatabase } from './supabase';

declare module './supabase' {
  interface Database {
    public: {
      Tables: {
        node_comments: {
          Row: {
            id: string;
            node_id: string;
            user_id: string;
            content: string;
            parent_id: string | null;
            created_at: string;
            updated_at: string;
            vote_count: number;
          };
          Insert: {
            id?: string;
            node_id: string;
            user_id: string;
            content: string;
            parent_id?: string | null;
            created_at?: string;
            updated_at?: string;
            vote_count?: number;
          };
          Update: {
            id?: string;
            node_id?: string;
            user_id?: string;
            content?: string;
            parent_id?: string | null;
            created_at?: string;
            updated_at?: string;
            vote_count?: number;
          };
        };
        node_forks: {
          Row: {
            id: string;
            source_node_id: string;
            forked_node_id: string;
            user_id: string;
            summary: string;
            created_at: string;
          };
          Insert: {
            id?: string;
            source_node_id: string;
            forked_node_id: string;
            user_id: string;
            summary: string;
            created_at?: string;
          };
          Update: {
            id?: string;
            source_node_id?: string;
            forked_node_id?: string;
            user_id?: string;
            summary?: string;
            created_at?: string;
          };
        };
        node_subscriptions: {
          Row: {
            id: string;
            user_id: string;
            node_id: string;
            created_at: string;
            notification_preferences: string[];
          };
          Insert: {
            id?: string;
            user_id: string;
            node_id: string;
            created_at?: string;
            notification_preferences?: string[];
          };
          Update: {
            id?: string;
            user_id?: string;
            node_id?: string;
            created_at?: string;
            notification_preferences?: string[];
          };
        };
      };
    };
  }
}
