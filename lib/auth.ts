// lib/auth.ts - Authentication utilities for Supabase
import { createClient, type User } from '@supabase/supabase-js';
import type { Database, Json } from '../types/supabase';

export type { User };

// 从环境变量获取配置 (在浏览器环境中通过 window.__ENV__注入)
const getSupabaseConfig = () => {
  if (typeof window !== 'undefined') {
    return {
      url: (window as any).__ENV?.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL,
      anonKey: (window as any).__ENV?.SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY,
    };
  }
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
};

// 创建 Supabase 客户端单例
let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabaseClient() {
  if (!supabaseInstance) {
    const config = getSupabaseConfig();
    
    if (!config.url || !config.anonKey) {
      console.warn('⚠️ Supabase configuration is missing. Some features may not work.');
    }
    
    supabaseInstance = createClient<Database>(
      config.url || 'https://placeholder.supabase.co',
      config.anonKey || 'placeholder-key',
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
        global: {
          headers: {
            'x-application-name': 'ai-knowledge-bank',
          },
        },
      }
    );
  }
  
  return supabaseInstance;
}

export const supabase = getSupabaseClient();

// ============================================
// User Session Management
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

/**
 * 获取当前登录用户
 */
export async function getCurrentUser(): Promise<UserSession | null> {
  try {
    const supabase = getSupabaseClient();
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      return null;
    }
    
    return {
      user: {
        id: session.user.id,
        email: session.user.email || '',
        username: session.user.user_metadata?.username,
        avatar_url: session.user.user_metadata?.avatar_url,
      },
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      expiresAt: session.expires_at ?? 0,
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * 监听认证状态变化
 */
export function onAuthStateChange(
  callback: (event: string, session: UserSession | null) => void
) {
  const supabase = getSupabaseClient();
  
  return supabase.auth.onAuthStateChange((event, session) => {
    if (session) {
      callback(event, {
        user: {
          id: session.user.id,
          email: session.user.email || '',
          username: session.user.user_metadata?.username,
          avatar_url: session.user.user_metadata?.avatar_url,
        },
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        expiresAt: session.expires_at ?? 0,
      });
    } else {
      callback(event, null);
    }
  });
}

// ============================================
// Authentication Actions
// ============================================

/**
 * 邮箱密码登录
 */
export async function signInWithEmail(email: string, password: string) {
  const supabase = getSupabaseClient();
  return await supabase.auth.signInWithPassword({ email, password });
}

/**
 * 注册新用户
 */
export async function signUpWithEmail(email: string, password: string, metadata?: { username?: string }) {
  const supabase = getSupabaseClient();
  return await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  });
}

/**
 * 登出
 */
export async function signOut() {
  const supabase = getSupabaseClient();
  return await supabase.auth.signOut();
}

/**
 * 发送密码重置邮件
 */
export async function resetPassword(email: string) {
  const supabase = getSupabaseClient();
  return await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
}

// ============================================
// OAuth Providers
// ============================================

export type OAuthProvider = 'github' | 'google' | 'discord';

/**
 * 使用 OAuth 提供商登录
 */
export async function signInWithOAuth(provider: OAuthProvider) {
  const supabase = getSupabaseClient();
  return await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
}

// ============================================
// User Profile Operations
// ============================================

export interface UserProfile {
  id: string;
  user_id: string;
  username: string;
  email?: string;
  avatar_url?: string;
  bio?: string;
  reputation_score: number;
  expertise_areas: string[];
  total_validations: number;
  total_forks: number;
  total_merges: number;
  badges: string[];
  last_active_at: string;
  created_at: string;
}

/**
 * 获取用户资料
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error || !data) {
    return null;
  }
  
  return data as UserProfile;
}

/**
 * 更新用户资料
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<Pick<UserProfile, 'username' | 'bio' | 'avatar_url' | 'expertise_areas'>>
) {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('user_profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .select()
    .single();
  
  if (error) {
    throw error;
  }
  
  return data as UserProfile;
}

/**
 * 获取用户徽章
 */
export async function getUserBadges(userId: string) {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('user_badges')
    .select(`
      *,
      badges (*)
    `)
    .eq('user_id', userId)
    .order('awarded_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching user badges:', error);
    return [];
  }
  
  return data;
}

/**
 * 获取用户通知
 */
export async function getUserNotifications(
  userId: string,
  limit: number = 20,
  unreadOnly: boolean = false
) {
  const supabase = getSupabaseClient();
  
  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (unreadOnly) {
    query = query.eq('is_read', false);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
  
  return data;
}

/**
 * 标记通知为已读
 */
export async function markNotificationAsRead(notificationId: string) {
  const supabase = getSupabaseClient();
  
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);
  
  if (error) {
    throw error;
  }
}

/**
 * 标记所有通知为已读
 */
export async function markAllNotificationsAsRead(userId: string) {
  const supabase = getSupabaseClient();
  
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);
  
  if (error) {
    throw error;
  }
}

// ============================================
// Leaderboard & Statistics
// ============================================

/**
 * 获取用户排行榜
 */
export async function getLeaderboard(limit: number = 10) {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('user_leaderboard')
    .select('*')
    .limit(limit);
  
  if (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }
  
  return data;
}

/**
 * 获取用户在排行榜中的排名
 */
export async function getUserRank(userId: string) {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('user_leaderboard')
    .select('reputation_rank, validator_rank')
    .eq('user_id', userId)
    .single();
  
  if (error) {
    return null;
  }
  
  return data;
}

/**
 * 记录用户活动
 */
export async function logUserActivity(
  userId: string,
  action: string,
  entityType?: string,
  entityId?: string,
  metadata?: Record<string, unknown>
) {
  const supabase = getSupabaseClient();
  
  const { error } = await supabase
    .from('activity_log')
    .insert({
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      metadata: metadata as Json | undefined,
    });
  
  if (error) {
    console.error('Error logging activity:', error);
  }
}
