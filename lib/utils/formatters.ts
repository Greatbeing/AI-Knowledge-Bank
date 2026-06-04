import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';

/**
 * 格式化日期为本地化字符串
 * @param date - 日期字符串或 Date 对象
 * @param formatStr - 格式模板，默认为 'yyyy-MM-dd HH:mm'
 */
export function formatDate(date: string | Date, formatStr = 'yyyy-MM-dd HH:mm'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr, { locale: zhCN });
}

/**
 * 格式化相对时间（如：3 小时前）
 * @param date - 日期字符串或 Date 对象
 */
export function formatRelativeTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true, locale: zhCN });
}

/**
 * 格式化 CAS 分数显示
 * @param score - CAS 分数
 */
export function formatCASScore(score: number): string {
  return score.toFixed(2);
}

/**
 * 根据 CAS 分数获取等级标签
 * @param score - CAS 分数
 */
export function getCASLevel(score: number): string {
  if (score >= 90) return '专家级';
  if (score >= 75) return '高级';
  if (score >= 60) return '中级';
  if (score >= 40) return '初级';
  return '入门';
}

/**
 * 根据 CAS 分数获取颜色类名
 * @param score - CAS 分数
 */
export function getCASColorClass(score: number): string {
  if (score >= 90) return 'text-emerald-600 bg-emerald-50';
  if (score >= 75) return 'text-blue-600 bg-blue-50';
  if (score >= 60) return 'text-indigo-600 bg-indigo-50';
  if (score >= 40) return 'text-amber-600 bg-amber-50';
  return 'text-gray-600 bg-gray-50';
}

/**
 * 格式化节点状态显示
 * @param status - 节点状态
 */
export function formatNodeStatus(status: string): string {
  const statusMap: Record<string, string> = {
    draft: '草稿',
    pending: '待审核',
    validated: '已验证',
    rejected: '已拒绝',
  };
  return statusMap[status] || status;
}

/**
 * 根据节点状态获取样式类名
 * @param status - 节点状态
 */
export function getNodeStatusClass(status: string): string {
  const statusClassMap: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    pending: 'bg-amber-100 text-amber-800',
    validated: 'bg-emerald-100 text-emerald-800',
    rejected: 'bg-red-100 text-red-800',
  };
  return statusClassMap[status] || 'bg-gray-100 text-gray-800';
}

/**
 * 截断文本并添加省略号
 * @param text - 要截断的文本
 * @param maxLength - 最大长度
 */
export function truncateText(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * 计算版本号增量
 * @param currentVersion - 当前版本
 */
export function getNextVersion(currentVersion: number): number {
  return currentVersion + 1;
}

/**
 * 生成唯一的 ID（简单实现，生产环境建议使用 uuid）
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
