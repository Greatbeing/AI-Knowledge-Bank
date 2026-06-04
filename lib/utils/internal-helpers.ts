/**
 * AI Knowledge Bank - Internal Helper Functions
 * 内部辅助函数（不直接对外暴露）
 */

import { supabase } from '../auth';

/**
 * 获取用户资料
 */
export async function getUserProfile(userId: string): Promise<any> {
  const { data } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', userId)
    .single();
  return data;
}

/**
 * 创建通知
 */
export async function createNotification(notificationData: any): Promise<void> {
  await supabase.from('notifications').insert({
    ...notificationData,
    is_read: false,
    created_at: new Date().toISOString()
  });
}

/**
 * 记录活动日志
 */
export async function logActivity(
  eventType: string,
  metadata: Record<string, any>
): Promise<void> {
  const user = await supabase.auth.getUser();
  
  await supabase.from('activity_logs').insert({
    user_id: user.data?.user?.id,
    event_type: eventType,
    metadata,
    ip_address: '', // 需要服务端获取
    created_at: new Date().toISOString()
  });
}
