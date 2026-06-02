# AI Knowledge Bank - User System Setup Guide

## 📋 Overview

This guide walks you through setting up the complete user authentication and management system for AI Knowledge Bank.

## 🔧 Prerequisites

1. **Supabase Account** - Sign up at [supabase.com](https://supabase.com)
2. **GitHub OAuth App** (optional but recommended) - Create at GitHub Developer Settings

## 🚀 Quick Start

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your **Project URL** and **Anon/Public Key** from Settings → API

### Step 2: Run Database Migrations

In your Supabase SQL Editor, run the migration files in order:

```sql
-- First, run the base CAS algorithm migration
-- Copy contents from: supabase/migrations/001_cas_emergence_algorithm.sql

-- Then, run the user system migration
-- Copy contents from: supabase/migrations/002_user_system.sql
```

### Step 3: Configure Authentication

#### Enable Email/Password Auth

1. Go to **Authentication → Providers**
2. Enable **Email** provider
3. Configure email templates (optional)

#### Enable GitHub OAuth (Recommended)

1. Go to **Authentication → Providers**
2. Enable **GitHub** provider
3. You'll need:
   - **Client ID**: From your GitHub OAuth App
   - **Client Secret**: From your GitHub OAuth App
   - **Redirect URL**: `https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback`

##### Creating GitHub OAuth App

1. Go to GitHub → Settings → Developer Settings → OAuth Apps
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: AI Knowledge Bank
   - **Homepage URL**: Your site URL (e.g., `https://yourdomain.com`)
   - **Authorization callback URL**: `https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback`
4. Copy Client ID and generate Client Secret
5. Paste both into Supabase GitHub provider settings

### Step 4: Update Frontend Configuration

#### Option A: Environment Variables (Recommended for Production)

Create a `.env` file in your project root:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

#### Option B: Direct Configuration (For Testing)

Update these values in `index.html` and `dashboard.html`:

```javascript
const SUPABASE_URL = 'https://your-project-id.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here';
```

### Step 5: Test the System

1. Open `index.html` in your browser
2. Click "Sign In" in the navigation
3. Sign in with GitHub or email
4. You should be redirected to `dashboard.html`
5. View your profile, badges, and notifications

## 📊 Database Schema Overview

### Tables Created

| Table | Purpose |
|-------|---------|
| `user_profiles` | Extended user information, reputation, stats |
| `user_sessions` | Session management |
| `badges` | Badge definitions |
| `user_badges` | User-badge associations |
| `notifications` | User notifications |
| `activity_log` | Audit trail of user actions |
| `user_leaderboard` | View for rankings |

### Key Features

- **Automatic Profile Creation**: Trigger creates profile on user signup
- **Reputation System**: Users earn reputation through validations
- **Badge System**: Automatic badge awards based on achievements
- **Notifications**: Real-time alerts for merges, badges, etc.
- **Activity Logging**: Complete audit trail
- **Row Level Security**: Secure data access policies

## 🔐 Security Considerations

### Row Level Security (RLS)

All tables have RLS enabled with appropriate policies:

- Users can only update their own profiles
- Users can only view their own notifications
- Public read access for badges and leaderboards
- System-only write access for sensitive operations

### Best Practices

1. **Never expose service role key** in frontend code
2. **Use environment variables** for configuration
3. **Enable email confirmation** for production
4. **Set up rate limiting** for auth endpoints
5. **Regular backups** of your Supabase database

## 🎨 Customization

### Modify Badge Criteria

Edit `002_user_system.sql` badge insertion:

```sql
INSERT INTO badges (name, description, icon, category, criteria) VALUES
('Your Badge', 'Description', '🏅', 'contributor', '{"action": "validate", "count": 5}');
```

### Customize Reputation Weights

Modify the `calculate_emergence_weight` function in `001_cas_emergence_algorithm.sql`:

```sql
-- Adjust the gravity constant for faster/slower decay
gravity_constant FLOAT := 1.8; -- Higher = faster decay
```

### Add New Notification Types

Update the notification trigger logic:

```sql
INSERT INTO notifications (user_id, type, title, message)
VALUES (user_id, 'custom_type', 'Title', 'Message');
```

## 🐛 Troubleshooting

### Issue: "Invalid API key"

**Solution**: Verify your Supabase URL and Anon key are correct

### Issue: RLS policy errors

**Solution**: Check that RLS is enabled and policies are correctly set:

```sql
-- Check RLS status
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- View policies
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

### Issue: OAuth redirect fails

**Solution**: Ensure your redirect URL in GitHub OAuth app matches exactly:
```
https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback
```

### Issue: User profile not created automatically

**Solution**: Check if the trigger exists:

```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

If missing, re-run the trigger creation SQL from migration 002.

## 📈 Next Steps

1. **Deploy to Production**: Use Vercel, Netlify, or Cloudflare Pages
2. **Add More Features**: 
   - User-to-user messaging
   - Advanced analytics dashboard
   - Email notifications
   - Webhook integrations
3. **Optimize Performance**: 
   - Add database indexes for common queries
   - Implement caching strategies
   - Use Supabase Edge Functions for heavy computations

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [OAuth Provider Setup](https://supabase.com/docs/guides/auth/social-login/auth-github)

## 💬 Support

For issues or questions:
- Open an issue on GitHub
- Join our Discord community
- Check existing documentation

---

**Version**: 1.0.0  
**Last Updated**: 2024  
**License**: MIT
