-- AI Knowledge Bank - User System Migration
-- PostgreSQL Migration Script for Supabase
-- 用户认证、会话管理和权限系统

-- ============================================
-- 1. 扩展用户画像表 (Enhanced User Profiles)
-- ============================================

-- 添加更多用户相关字段
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS total_validations INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_forks INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_merges INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS badges TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_reputation ON user_profiles(reputation_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_profiles_last_active ON user_profiles(last_active_at DESC);

-- ============================================
-- 2. 用户会话表 (User Sessions)
-- ============================================

CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active, expires_at);

-- ============================================
-- 3. 用户成就/徽章系统 (Badges & Achievements)
-- ============================================

CREATE TABLE IF NOT EXISTS badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    icon TEXT NOT NULL, -- emoji 或 SVG
    category TEXT NOT NULL, -- 'contributor', 'validator', 'expert', 'special'
    criteria JSONB NOT NULL, -- 获取条件
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
    awarded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    context JSONB, -- 获奖上下文
    UNIQUE(user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge ON user_badges(badge_id);

-- 插入初始徽章数据
INSERT INTO badges (name, description, icon, category, criteria) VALUES
(' Pioneer', 'First knowledge node creator', '🚀', 'contributor', '{"action": "create_node", "count": 1}'),
('Validator', 'Validated 10+ nodes successfully', '✅', 'validator', '{"action": "validate", "count": 10}'),
('Expert', 'Reputation score reached 100+', '🎓', 'expert', '{"reputation_threshold": 100}'),
('Emergence Master', 'Had a branch merged as new mainline', '✨', 'special', '{"emergence_count": 1}'),
('Polyglot', 'Contributed to 5+ language domains', '🌐', 'contributor', '{"language_domains": 5}');

-- ============================================
-- 4. 通知系统 (Notifications)
-- ============================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'validation', 'merge', 'badge', 'system'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link_url TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- ============================================
-- 5. 用户活动日志 (Activity Log)
-- ============================================

CREATE TABLE IF NOT EXISTS activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL, -- 'login', 'logout', 'create_node', 'validate', 'fork', 'merge'
    entity_type TEXT, -- 'node', 'interaction', 'profile'
    entity_id UUID,
    metadata JSONB,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_user ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_action ON activity_log(action);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON activity_log(created_at DESC);

-- ============================================
-- 6. 增强 RLS 策略 (Enhanced RLS Policies)
-- ============================================

-- User Profiles: 更新策略以支持更多操作
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE 
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- 允许认证用户创建自己的资料
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
CREATE POLICY "Users can insert their own profile" ON user_profiles
    FOR INSERT 
    WITH CHECK (user_id = auth.uid());

-- 新增：允许更新 last_active_at
CREATE POLICY "Users can update their own activity" ON user_profiles
    FOR UPDATE 
    USING (user_id = auth.uid())
    WITH CHECK (
        user_id = auth.uid() AND 
        (last_active_at IS DISTINCT FROM OLD.last_active_at)
    );

-- User Sessions: 严格限制访问
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions" ON user_sessions
    FOR SELECT 
    USING (user_id = auth.uid());

CREATE POLICY "System can manage sessions" ON user_sessions
    FOR ALL 
    USING (false); -- 只允许服务端通过 service role 管理

-- Badges: 公开可见
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view badges" ON badges
    FOR SELECT USING (true);

-- User Badges: 公开查看，系统授予
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view user badges" ON user_badges
    FOR SELECT USING (true);

-- Notifications: 用户只能查看自己的通知
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

-- Activity Log: 用户查看自己的，管理员可查看全部
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own activity" ON activity_log
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can log activities" ON activity_log
    FOR INSERT 
    WITH CHECK (true); -- 由 trigger 或服务端调用

-- ============================================
-- 7. 自动触发器 (Auto Triggers)
-- ============================================

-- 新用户自动创建 profile
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO user_profiles (user_id, email, username, reputation_score)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
        10.0
    );
    
    -- 记录活动
    INSERT INTO activity_log (user_id, action, metadata)
    VALUES (NEW.id, 'signup', jsonb_build_object('email', NEW.email));
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- 用户登录时更新 last_active_at
CREATE OR REPLACE FUNCTION update_user_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE user_profiles
    SET last_active_at = NOW()
    WHERE user_id = NEW.user_id;
    
    RETURN NEW;
END;
$$;

-- 验证交互时统计用户贡献
CREATE OR REPLACE FUNCTION track_user_contribution()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.action_type = 'validate' THEN
        UPDATE user_profiles
        SET total_validations = total_validations + 1,
            last_active_at = NOW()
        WHERE user_id = NEW.user_id;
        
        -- 检查是否应该授予 Validator 徽章
        PERFORM check_and_award_badge(NEW.user_id, 'validator');
        
    ELSIF NEW.action_type = 'fork' THEN
        UPDATE user_profiles
        SET total_forks = total_forks + 1,
            last_active_at = NOW()
        WHERE user_id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_interaction_track_contribution ON interactions;
CREATE TRIGGER on_interaction_track_contribution
    AFTER INSERT ON interactions
    FOR EACH ROW
    EXECUTE FUNCTION track_user_contribution();

-- ============================================
-- 8. 徽章授予函数 (Badge Awarding Function)
-- ============================================

CREATE OR REPLACE FUNCTION check_and_award_badge(target_user_id UUID, badge_category TEXT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    badge_record RECORD;
    should_award BOOLEAN := false;
    user_profile RECORD;
BEGIN
    -- 获取用户资料
    SELECT * INTO user_profile FROM user_profiles WHERE user_id = target_user_id;
    
    -- 根据类别检查并授予徽章
    FOR badge_record IN 
        SELECT * FROM badges WHERE category = badge_category
    LOOP
        -- 简化版：实际应检查 criteria JSONB
        IF badge_record.name = 'Validator' AND user_profile.total_validations >= 10 THEN
            should_award := true;
        ELSIF badge_record.name = 'Expert' AND user_profile.reputation_score >= 100 THEN
            should_award := true;
        END IF;
        
        IF should_award THEN
            -- 检查是否已拥有
            IF NOT EXISTS (
                SELECT 1 FROM user_badges 
                WHERE user_id = target_user_id AND badge_id = badge_record.id
            ) THEN
                -- 授予徽章
                INSERT INTO user_badges (user_id, badge_id, context)
                VALUES (target_user_id, badge_record.id, jsonb_build_object('awarded_for', badge_record.name));
                
                -- 发送通知
                INSERT INTO notifications (user_id, type, title, message)
                VALUES (
                    target_user_id,
                    'badge',
                    '🏆 Badge Earned!',
                    format('You earned the "%s" badge: %s', badge_record.name, badge_record.description)
                );
                
                -- 添加到用户的 badges 数组
                UPDATE user_profiles
                SET badges = array_append(badges, badge_record.icon)
                WHERE user_id = target_user_id;
            END IF;
            
            should_award := false;
        END IF;
    END LOOP;
END;
$$;

-- ============================================
-- 9. 视图：用户排行榜 (Leaderboard View)
-- ============================================

CREATE OR REPLACE VIEW user_leaderboard AS
SELECT 
    up.id,
    up.user_id,
    up.username,
    up.avatar_url,
    up.reputation_score,
    up.total_validations,
    up.total_forks,
    up.total_merges,
    up.badges,
    up.last_active_at,
    COUNT(DISTINCT n.id) as nodes_created,
    RANK() OVER (ORDER BY up.reputation_score DESC) as reputation_rank,
    RANK() OVER (ORDER BY up.total_validations DESC) as validator_rank
FROM user_profiles up
LEFT JOIN nodes n ON n.parent_id IS NOT NULL 
    AND EXISTS (SELECT 1 FROM interactions i WHERE i.node_id = n.id AND i.user_id = up.user_id AND i.action_type = 'fork')
GROUP BY up.id, up.user_id, up.username, up.avatar_url, up.reputation_score, 
         up.total_validations, up.total_forks, up.total_merges, up.badges, up.last_active_at
ORDER BY up.reputation_score DESC;

-- ============================================
-- 10. 注释和文档
-- ============================================

COMMENT ON TABLE user_sessions IS '用户会话管理表';
COMMENT ON TABLE badges IS '徽章定义表';
COMMENT ON TABLE user_badges IS '用户获得的徽章';
COMMENT ON TABLE notifications IS '用户通知表';
COMMENT ON TABLE activity_log IS '用户活动审计日志';
COMMENT ON FUNCTION check_and_award_badge IS '检查并授予用户徽章的函数';
COMMENT ON VIEW user_leaderboard IS '用户排行榜视图';
