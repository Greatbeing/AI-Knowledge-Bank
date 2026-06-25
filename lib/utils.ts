// lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Calculate time decay factor for CAS weight algorithm
 * @param createdAt - Node creation timestamp
 * @param gravityConstant - Gravity constant for decay (default: 1.8)
 * @returns Time delta with gravity applied
 */
export function calculateTimeDecay(createdAt: string, gravityConstant: number = 1.8): number {
  const now = new Date();
  const created = new Date(createdAt);
  const hoursSinceCreation = (now.getTime() - created.getTime()) / (1000 * 60 * 60) + 2;
  return Math.pow(hoursSinceCreation, gravityConstant);
}

/**
 * Check if a node has emerged based on weight threshold
 * @param weight - Current node weight
 * @param parentWeight - Parent node weight
 * @param threshold - Emergence threshold multiplier (default: 1.2 = 20% increase)
 * @returns Whether the node has emerged
 */
export function checkEmergence(weight: number, parentWeight: number, threshold: number = 1.2): boolean {
  return weight > parentWeight * threshold;
}

/**
 * Format weight display with color coding
 * @param weight - Node weight value
 * @returns Object with formatted value and color class
 */
export function formatWeight(weight: number): { value: string; colorClass: string } {
  if (weight > 100) {
    return { value: weight.toFixed(1), colorClass: 'text-emerald-400' };
  } else if (weight > 80) {
    return { value: weight.toFixed(1), colorClass: 'text-amber-400' };
  }
  return { value: weight.toFixed(1), colorClass: 'text-zinc-300' };
}

/**
 * Validate Supabase connection configuration
 * @returns Whether environment variables are properly set
 */
export function validateSupabaseConfig(): boolean {
  if (typeof window !== 'undefined') {
    return !!(
      (window as any).__ENV?.SUPABASE_URL ||
      import.meta.env.VITE_SUPABASE_URL
    ) && !!(
      (window as any).__ENV?.SUPABASE_ANON_KEY ||
      import.meta.env.VITE_SUPABASE_ANON_KEY
    );
  }
  return !!(
    import.meta.env.VITE_SUPABASE_URL &&
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );
}
