-- AI Knowledge Bank - Knowledge Workflow Migration
-- PostgreSQL Migration Script for Supabase
-- 知识提交、验证、合并和演化工作流系统

-- ============================================
-- 1. 知识节点表 (Knowledge Nodes)
-- ============================================

CREATE TABLE IF NOT EXISTS knowledge_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    tags TEXT[] DEFAULT '{}',
    category TEXT DEFAULT 'general',
    
    -- CAS 属性
    emergence_level FLOAT DEFAULT 0.0,
    complexity_score FLOAT DEFAULT 0.0,
    connectivity_score FLOAT DEFAULT 0.0,
    adaptation_score FLOAT DEFAULT 0.0,
    
    -- 版本控制
    version INT DEFAULT 1,
    parent_id UUID REFERENCES knowledge_nodes(id),
    is_latest_version BOOLEAN DEFAULT true,
    
    -- 状态追踪
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'validated', 'merged', 'deprecated')),
    validation_count INT DEFAULT 0,
    fork_count INT DEFAULT 0,
    merge_count INT DEFAULT 0,
    
    -- 作者信息
    author_id UUID REFERENCES auth.users(id),
    co_authors UUID[] DEFAULT '{}',
    
    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    validated_at TIMESTAMP WITH TIME ZONE,
    merged_at TIMESTAMP WITH TIME ZONE,
    
    -- 元数据
    metadata JSONB DEFAULT '{}',
    source_url TEXT,
    license TEXT DEFAULT 'MIT'
);

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_nodes_status ON knowledge_nodes(status);
CREATE INDEX IF NOT EXISTS idx_nodes_category ON knowledge_nodes(category);
CREATE INDEX IF NOT EXISTS idx_nodes_tags ON knowledge_nodes USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_nodes_author ON knowledge_nodes(author_id);
CREATE INDEX IF NOT EXISTS idx_nodes_parent ON knowledge_nodes(parent_id);
CREATE INDEX IF NOT EXISTS idx_nodes_emergence ON knowledge_nodes(emergence_level DESC);
CREATE INDEX IF NOT EXISTS idx_nodes_created ON knowledge_nodes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_nodes_updated ON knowledge_nodes(updated_at DESC);

-- 全文搜索索引
CREATE INDEX IF NOT EXISTS idx_nodes_search ON knowledge_nodes USING GIN(
    to_tsvector('english', title || ' ' || content)
);

-- ============================================
-- 2. 验证请求表 (Validation Requests)
-- ============================================

CREATE TABLE IF NOT EXISTS validation_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    node_id UUID NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
    submitter_id UUID REFERENCES auth.users(id),
    
    -- 验证内容
    validation_type TEXT CHECK (validation_type IN ('fact_check', 'logic_review', 'completeness', 'relevance')),
    comments TEXT,
    suggested_changes TEXT,
    confidence_score FLOAT CHECK (confidence_score >= 0 AND confidence_score <= 1),
    
    -- 验证结果
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'needs_revision')),
    reviewer_id UUID REFERENCES auth.users(id),
    review_comments TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    
    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- 元数据
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_validation_node ON validation_requests(node_id);
CREATE INDEX IF NOT EXISTS idx_validation_submitter ON validation_requests(submitter_id);
CREATE INDEX IF NOT EXISTS idx_validation_reviewer ON validation_requests(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_validation_status ON validation_requests(status);
CREATE INDEX IF NOT EXISTS idx_validation_created ON validation_requests(created_at DESC);

-- ============================================
-- 3. 分支/Fork 表 (Node Forks)
-- ============================================

CREATE TABLE IF NOT EXISTS node_forks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_node_id UUID NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
    forked_node_id UUID NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
    fork_reason TEXT,
    fork_type TEXT CHECK (fork_type IN ('improvement', 'alternative', 'correction', 'extension')),
    
    -- 作者信息
    forked_by UUID REFERENCES auth.users(id),
    
    -- 合并状态
    merge_status TEXT DEFAULT 'pending' CHECK (merge_status IN ('pending', 'merged', 'rejected', 'abandoned')),
    merged_into UUID REFERENCES knowledge_nodes(id),
    
    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    merged_at TIMESTAMP WITH TIME ZONE,
    
    -- 元数据
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_forks_original ON node_forks(original_node_id);
CREATE INDEX IF NOT EXISTS idx_forks_forked ON node_forks(forked_node_id);
CREATE INDEX IF NOT EXISTS idx_forks_user ON node_forks(forked_by);
CREATE INDEX IF NOT EXISTS idx_forks_merge_status ON node_forks(merge_status);

-- ============================================
-- 4. 合并提案表 (Merge Proposals)
-- ============================================

CREATE TABLE IF NOT EXISTS merge_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_node_id UUID NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
    target_node_id UUID NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
    proposal_type TEXT CHECK (proposal_type IN ('merge', 'integrate', 'replace', 'supplement')),
    
    -- 提案内容
    justification TEXT,
    impact_analysis TEXT,
    confidence_score FLOAT,
    
    -- 审批流程
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn')),
    proposer_id UUID REFERENCES auth.users(id),
    approver_id UUID REFERENCES auth.users(id),
    
    -- 投票（去中心化决策）
    votes_for INT DEFAULT 0,
    votes_against INT DEFAULT 0,
    voters UUID[] DEFAULT '{}',
    
    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    decided_at TIMESTAMP WITH TIME ZONE,
    
    -- 元数据
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_merge_source ON merge_proposals(source_node_id);
CREATE INDEX IF NOT EXISTS idx_merge_target ON merge_proposals(target_node_id);
CREATE INDEX IF NOT EXISTS idx_merge_proposer ON merge_proposals(proposer_id);
CREATE INDEX IF NOT EXISTS idx_merge_status ON merge_proposals(status);

-- ============================================
-- 5. 演化历史表 (Evolution History)
-- ============================================

CREATE TABLE IF NOT EXISTS evolution_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    node_id UUID NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('created', 'updated', 'forked', 'merged', 'validated', 'deprecated')),
    
    -- 事件详情
    description TEXT,
    old_values JSONB,
    new_values JSONB,
    delta JSONB,
    
    -- 参与者
    actor_id UUID REFERENCES auth.users(id),
    related_node_ids UUID[] DEFAULT '{}',
    
    -- CAS 指标快照
    emergence_snapshot JSONB,
    complexity_snapshot JSONB,
    
    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 元数据
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_evolution_node ON evolution_history(node_id);
CREATE INDEX IF NOT EXISTS idx_evolution_type ON evolution_history(event_type);
CREATE INDEX IF NOT EXISTS idx_evolution_actor ON evolution_history(actor_id);
CREATE INDEX IF NOT EXISTS idx_evolution_created ON evolution_history(created_at DESC);

-- ============================================
-- 6. 评论与讨论表 (Comments & Discussions)
-- ============================================

CREATE TABLE IF NOT EXISTS node_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    node_id UUID NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES node_comments(id),
    
    -- 评论内容
    content TEXT NOT NULL,
    comment_type TEXT DEFAULT 'general' CHECK (comment_type IN ('general', 'question', 'suggestion', 'critique')),
    
    -- 作者信息
    author_id UUID REFERENCES auth.users(id),
    
    -- 互动
    upvotes INT DEFAULT 0,
    downvotes INT DEFAULT 0,
    voters UUID[] DEFAULT '{}',
    
    -- 状态
    is_resolved BOOLEAN DEFAULT false,
    is_edited BOOLEAN DEFAULT false,
    
    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 元数据
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_comments_node ON node_comments(node_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON node_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comments_author ON node_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_created ON node_comments(created_at DESC);

-- ============================================
-- 7. 订阅与关注表 (Subscriptions & Follows)
-- ============================================

CREATE TABLE IF NOT EXISTS node_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    node_id UUID NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_type TEXT DEFAULT 'all' CHECK (subscription_type IN ('all', 'updates', 'comments', 'validations')),
    
    -- 通知偏好
    notify_email BOOLEAN DEFAULT true,
    notify_in_app BOOLEAN DEFAULT true,
    
    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(node_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_node ON node_subscriptions(node_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON node_subscriptions(user_id);

-- 用户关注用户
CREATE TABLE IF NOT EXISTS user_follows (
    follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    PRIMARY KEY (follower_id, following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON user_follows(following_id);

-- ============================================
-- 8. 触发器函数 (Trigger Functions)
-- ============================================

-- 自动更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 知识节点更新触发器
DROP TRIGGER IF EXISTS trg_knowledge_nodes_updated ON knowledge_nodes;
CREATE TRIGGER trg_knowledge_nodes_updated
    BEFORE UPDATE ON knowledge_nodes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 评论更新触发器
DROP TRIGGER IF EXISTS trg_node_comments_updated ON node_comments;
CREATE TRIGGER trg_node_comments_updated
    BEFORE UPDATE ON node_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 自动记录演化历史
CREATE OR REPLACE FUNCTION record_node_evolution()
RETURNS TRIGGER AS $$
DECLARE
    event_type TEXT;
    old_vals JSONB;
    new_vals JSONB;
BEGIN
    IF TG_OP = 'INSERT' THEN
        event_type := 'created';
        old_vals := NULL;
        new_vals := to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN
        event_type := 'updated';
        old_vals := to_jsonb(OLD);
        new_vals := to_jsonb(NEW);
    ELSIF TG_OP = 'DELETE' THEN
        event_type := 'deprecated';
        old_vals := to_jsonb(OLD);
        new_vals := NULL;
    END IF;
    
    INSERT INTO evolution_history (
        node_id, event_type, description, old_values, new_values,
        actor_id, emergence_snapshot, complexity_snapshot
    ) VALUES (
        COALESCE(NEW.id, OLD.id),
        event_type,
        CASE 
            WHEN TG_OP = 'INSERT' THEN 'Node created: ' || NEW.title
            WHEN TG_OP = 'UPDATE' THEN 'Node updated: ' || NEW.title
            WHEN TG_OP = 'DELETE' THEN 'Node deprecated: ' || OLD.title
        END,
        old_vals,
        new_vals,
        COALESCE(NEW.author_id, OLD.author_id),
        CASE WHEN NEW IS NOT NULL THEN jsonb_build_object(
            'emergence_level', NEW.emergence_level,
            'complexity_score', NEW.complexity_score,
            'connectivity_score', NEW.connectivity_score,
            'adaptation_score', NEW.adaptation_score
        ) ELSE NULL END,
        CASE WHEN NEW IS NOT NULL THEN jsonb_build_object(
            'version', NEW.version,
            'status', NEW.status,
            'validation_count', NEW.validation_count
        ) ELSE NULL END
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 演化历史触发器
DROP TRIGGER IF EXISTS trg_record_node_evolution ON knowledge_nodes;
CREATE TRIGGER trg_record_node_evolution
    AFTER INSERT OR UPDATE OR DELETE ON knowledge_nodes
    FOR EACH ROW
    EXECUTE FUNCTION record_node_evolution();

-- 自动更新验证计数
CREATE OR REPLACE FUNCTION update_validation_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'approved' THEN
        UPDATE knowledge_nodes 
        SET validation_count = validation_count + 1,
            validated_at = NOW()
        WHERE id = NEW.node_id;
    ELSIF TG_OP = 'UPDATE' AND OLD.status != 'approved' AND NEW.status = 'approved' THEN
        UPDATE knowledge_nodes 
        SET validation_count = validation_count + 1,
            validated_at = NOW()
        WHERE id = NEW.node_id;
    ELSIF TG_OP = 'UPDATE' AND OLD.status = 'approved' AND NEW.status != 'approved' THEN
        UPDATE knowledge_nodes 
        SET validation_count = GREATEST(validation_count - 1, 0)
        WHERE id = NEW.node_id;
    ELSIF TG_OP = 'DELETE' AND OLD.status = 'approved' THEN
        UPDATE knowledge_nodes 
        SET validation_count = GREATEST(validation_count - 1, 0)
        WHERE id = OLD.node_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_validation_count ON validation_requests;
CREATE TRIGGER trg_update_validation_count
    AFTER INSERT OR UPDATE OR DELETE ON validation_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_validation_count();

-- 自动更新分叉计数
CREATE OR REPLACE FUNCTION update_fork_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE knowledge_nodes 
        SET fork_count = fork_count + 1
        WHERE id = NEW.original_node_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE knowledge_nodes 
        SET fork_count = GREATEst(fork_count - 1, 0)
        WHERE id = OLD.original_node_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_fork_count ON node_forks;
CREATE TRIGGER trg_update_fork_count
    AFTER INSERT OR DELETE ON node_forks
    FOR EACH ROW
    EXECUTE FUNCTION update_fork_count();

-- ============================================
-- 9. Row Level Security (RLS) 策略
-- ============================================

-- 启用 RLS
ALTER TABLE knowledge_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE node_forks ENABLE ROW LEVEL SECURITY;
ALTER TABLE merge_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE evolution_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE node_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE node_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

-- 知识节点策略
CREATE POLICY "Public can view published nodes"
    ON knowledge_nodes FOR SELECT
    USING (status != 'draft');

CREATE POLICY "Authors can manage their nodes"
    ON knowledge_nodes FOR ALL
    USING (auth.uid() = author_id)
    WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Validators can update node status"
    ON knowledge_nodes FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role IN ('validator', 'admin')
        )
    );

-- 验证请求策略
CREATE POLICY "Authenticated users can create validation requests"
    ON validation_requests FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Public can view validation requests"
    ON validation_requests FOR SELECT
    USING (true);

CREATE POLICY "Reviewers can update validation requests"
    ON validation_requests FOR UPDATE
    USING (
        auth.uid() = reviewer_id OR 
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role IN ('validator', 'admin')
        )
    );

-- 分叉策略
CREATE POLICY "Authenticated users can create forks"
    ON node_forks FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Public can view forks"
    ON node_forks FOR SELECT
    USING (true);

-- 合并提案策略
CREATE POLICY "Authenticated users can create merge proposals"
    ON merge_proposals FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Public can view merge proposals"
    ON merge_proposals FOR SELECT
    USING (true);

CREATE POLICY "Approvers can update merge proposals"
    ON merge_proposals FOR UPDATE
    USING (
        auth.uid() = approver_id OR
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role IN ('validator', 'admin')
        )
    );

-- 演化历史策略
CREATE POLICY "Public can view evolution history"
    ON evolution_history FOR SELECT
    USING (true);

-- 评论策略
CREATE POLICY "Authenticated users can create comments"
    ON node_comments FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Public can view comments"
    ON node_comments FOR SELECT
    USING (true);

CREATE POLICY "Authors can update their comments"
    ON node_comments FOR UPDATE
    USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete their comments"
    ON node_comments FOR DELETE
    USING (auth.uid() = author_id);

-- 订阅策略
CREATE POLICY "Authenticated users can manage subscriptions"
    ON node_subscriptions FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 关注策略
CREATE POLICY "Authenticated users can follow others"
    ON user_follows FOR ALL
    USING (auth.uid() = follower_id)
    WITH CHECK (auth.uid() = follower_id);

-- ============================================
-- 10. 视图和物化视图 (Views & Materialized Views)
-- ============================================

-- 热门知识节点视图
CREATE OR REPLACE VIEW hot_knowledge_nodes AS
SELECT 
    kn.*,
    up.display_name as author_name,
    up.avatar_url as author_avatar,
    (kn.validation_count * 10 + kn.fork_count * 5 + kn.merge_count * 15) as hotness_score
FROM knowledge_nodes kn
LEFT JOIN user_profiles up ON kn.author_id = up.user_id
WHERE kn.status IN ('validated', 'merged')
ORDER BY hotness_score DESC, kn.created_at DESC;

-- 待验证节点视图
CREATE OR REPLACE VIEW pending_validations AS
SELECT 
    kn.id,
    kn.title,
    kn.summary,
    kn.author_id,
    up.display_name as author_name,
    COUNT(vr.id) as validation_request_count,
    MAX(vr.created_at) as latest_request
FROM knowledge_nodes kn
LEFT JOIN validation_requests vr ON kn.id = vr.node_id AND vr.status = 'pending'
LEFT JOIN user_profiles up ON kn.author_id = up.user_id
WHERE kn.status = 'pending'
GROUP BY kn.id, kn.title, kn.summary, kn.author_id, up.display_name
ORDER BY latest_request DESC;

-- 活跃贡献者视图
CREATE OR REPLACE VIEW active_contributors AS
SELECT 
    up.id,
    up.user_id,
    up.display_name,
    up.avatar_url,
    up.reputation_score,
    COUNT(DISTINCT kn.id) as nodes_created,
    COUNT(DISTINCT vr.id) as validations_performed,
    COUNT(DISTINCT nf.id) as forks_created,
    SUM(kn.validation_count) as total_validations_received,
    SUM(kn.fork_count) as total_forks_received
FROM user_profiles up
LEFT JOIN knowledge_nodes kn ON up.user_id = kn.author_id
LEFT JOIN validation_requests vr ON up.user_id = vr.reviewer_id
LEFT JOIN node_forks nf ON up.user_id = nf.forked_by
WHERE up.is_active = true
GROUP BY up.id, up.user_id, up.display_name, up.avatar_url, up.reputation_score
ORDER BY reputation_score DESC;

-- 知识图谱连接视图
CREATE OR REPLACE VIEW knowledge_graph_edges AS
SELECT 
    parent.id as source_id,
    child.id as target_id,
    'parent-child' as relationship_type,
    child.version as weight
FROM knowledge_nodes parent
JOIN knowledge_nodes child ON parent.id = child.parent_id
WHERE child.is_latest_version = true

UNION ALL

SELECT 
    original_node_id as source_id,
    forked_node_id as target_id,
    'fork' as relationship_type,
    1 as weight
FROM node_forks

UNION ALL

SELECT 
    source_node_id as source_id,
    target_node_id as target_id,
    'merged' as relationship_type,
    1 as weight
FROM merge_proposals
WHERE status = 'approved';

-- ============================================
-- 11. 示例数据 (Sample Data)
-- ============================================

-- 插入示例知识节点
INSERT INTO knowledge_nodes (title, content, summary, tags, category, emergence_level, complexity_score, status, author_id)
SELECT 
    'Introduction to Complex Adaptive Systems',
    'Complex Adaptive Systems (CAS) are systems with many interacting components that adapt and evolve...',
    'A comprehensive introduction to CAS theory and applications',
    ARRAY['cas', 'complexity', 'systems-theory'],
    'theory',
    0.85,
    0.72,
    'validated',
    (SELECT id FROM auth.users LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM knowledge_nodes WHERE title = 'Introduction to Complex Adaptive Systems');

-- ============================================
-- 12. 注释说明 (Comments)
-- ============================================

COMMENT ON TABLE knowledge_nodes IS 'Core knowledge nodes with CAS properties and version control';
COMMENT ON TABLE validation_requests IS 'Peer review and validation workflow';
COMMENT ON TABLE node_forks IS 'Branching and alternative versions of knowledge';
COMMENT ON TABLE merge_proposals IS 'Decentralized decision making for knowledge integration';
COMMENT ON TABLE evolution_history IS 'Complete audit trail of knowledge evolution';
COMMENT ON TABLE node_comments IS 'Community discussions and feedback';

COMMENT ON COLUMN knowledge_nodes.emergence_level IS 'Measure of emergent properties (0-1)';
COMMENT ON COLUMN knowledge_nodes.complexity_score IS 'Algorithmic complexity metric';
COMMENT ON COLUMN knowledge_nodes.connectivity_score IS 'Network connectivity measure';
COMMENT ON COLUMN knowledge_nodes.adaptation_score IS 'Adaptive capacity indicator';

-- ============================================
-- Migration Complete
-- ============================================
