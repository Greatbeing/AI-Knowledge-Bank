/**
 * AI Knowledge Bank - User & Auth Types
 * 用户与认证相关类型定义
 */

import type { Database } from '../../types/supabase';

// ============================================
// User Profile Types
// ============================================

export type UserProfile = Database['public']['Tables']['user_profiles']['Row'];
export type UserProfileUpdate = Database['public']['Tables']['user_profiles']['Update'];

// ============================================
// Badge & Achievement Types
// ============================================

export type UserBadge = Database['public']['Tables']['user_badges']['Row'];
export type Badge = Database['public']['Tables']['badges']['Row'];

// ============================================
// Notification Types
// ============================================

export type Notification = Database['public']['Tables']['notifications']['Row'];
export type NotificationInsert = Database['public']['Tables']['notifications']['Insert'];

// ============================================
// Activity Log Types
// ============================================

export type ActivityLog = Database['public']['Tables']['activity_logs']['Row'];

// ============================================
// Leaderboard Types
// ============================================

export type UserLeaderboard = Database['public']['Tables']['user_leaderboard']['Row'];

// ============================================
// Extended User Session Type
// ============================================

export interface UserSession {
  user: {
    id: string;
    email: string;
    username?: string;
    avatar_url?: string;
  };
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

// ============================================
// OAuth Provider Type
// ============================================

export type OAuthProvider = 'github' | 'google' | 'discord';

// ============================================
// User Statistics Interface
// ============================================

export interface UserStats {
  total_nodes: number;
  total_validations: number;
  total_forks: number;
  total_merges: number;
  reputation_score: number;
  badges_earned: number;
}

// ============================================
// User Filter Types
// ============================================

export interface UserQueryFilters {
  expertise_areas?: string[];
  min_reputation?: number;
  badges?: string[];
}
