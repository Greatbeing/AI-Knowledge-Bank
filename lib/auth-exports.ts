// Re-export auth module members for cleaner imports
export {
  getSupabaseClient,
  getCurrentUser,
  onAuthStateChange,
  signInWithEmail,
  signUpWithEmail,
  signOut,
  resetPassword,
  signInWithOAuth,
  getUserProfile,
  updateUserProfile,
  getUserBadges,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getLeaderboard,
  getUserRank,
  logUserActivity,
} from './auth';

export type {
  UserSession,
  UserProfile,
  OAuthProvider,
} from './auth';

// Export the supabase client instance getter
export const supabase = getSupabaseClient();

// Re-export types for convenience
export type User = Awaited<ReturnType<typeof getCurrentUser>>;
export type Session = UserSession;
export type AuthState = UserSession | null;
