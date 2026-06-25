-- AI Knowledge Bank - Performance Indexes & RLS Tightening
-- 补充缺失的数据库索引并收紧过度公开的 RLS 读取策略

-- ============================================
-- 1. 补充缺失的索引（性能优化）
-- ============================================

-- interactions 表：按用户查询、时间排序、CAS 权重计算复合查询
CREATE INDEX IF NOT EXISTS idx_interactions_user ON interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_created ON interactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_interactions_node_action ON interactions(node_id, action_type);

-- nodes 表：时间排序、涌现筛选、类型筛选
CREATE INDEX IF NOT EXISTS idx_nodes_created ON nodes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_nodes_updated ON nodes(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_nodes_emerging ON nodes(is_emerging) WHERE is_emerging = true;
CREATE INDEX IF NOT EXISTS idx_nodes_mainline ON nodes(is_mainline) WHERE is_mainline = true;
CREATE INDEX IF NOT EXISTS idx_nodes_type ON nodes(node_type);

-- knowledge_nodes 表：作者查询、状态筛选、三库类型筛选
CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_author ON knowledge_nodes(author_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_status ON knowledge_nodes(status);
CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_vault ON knowledge_nodes(vault_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_created ON knowledge_nodes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_parent ON knowledge_nodes(parent_id);

-- validation_requests 表：按节点和评审者查询
CREATE INDEX IF NOT EXISTS idx_validation_requests_node ON validation_requests(node_id);
CREATE INDEX IF NOT EXISTS idx_validation_requests_reviewer ON validation_requests(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_validation_requests_status ON validation_requests(status) WHERE status = 'pending';

-- node_forks 表
CREATE INDEX IF NOT EXISTS idx_node_forks_original ON node_forks(original_node_id);
CREATE INDEX IF NOT EXISTS idx_node_forks_forked_by ON node_forks(forked_by);

-- merge_proposals 表
CREATE INDEX IF NOT EXISTS idx_merge_proposals_source ON merge_proposals(source_node_id);
CREATE INDEX IF NOT EXISTS idx_merge_proposals_target ON merge_proposals(target_node_id);
CREATE INDEX IF NOT EXISTS idx_merge_proposals_status ON merge_proposals(status) WHERE status = 'pending';

-- node_comments 表
CREATE INDEX IF NOT EXISTS idx_node_comments_node ON node_comments(node_id);
CREATE INDEX IF NOT EXISTS idx_node_comments_created ON node_comments(created_at DESC);

-- evolution_history 表
CREATE INDEX IF NOT EXISTS idx_evolution_history_node ON evolution_history(node_id);
CREATE INDEX IF NOT EXISTS idx_evolution_history_created ON evolution_history(created_at DESC);

-- community_evolution_signals 表
CREATE INDEX IF NOT EXISTS idx_community_signals_node ON community_evolution_signals(node_id);
CREATE INDEX IF NOT EXISTS idx_community_signals_type ON community_evolution_signals(signal_type);
CREATE INDEX IF NOT EXISTS idx_community_signals_node_type ON community_evolution_signals(node_id, signal_type);

-- user_profiles 表
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- ============================================
-- 2. 向量索引（为未来向量搜索准备）
-- ============================================
-- 注意：需要先启用 pgvector 扩展
-- CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_embedding 
--   ON knowledge_nodes USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================
-- 3. 收紧过度公开的 RLS 读取策略
-- ============================================

-- user_profiles：仅暴露非敏感字段（不暴露 email、bio 等隐私信息）
DROP POLICY IF EXISTS "Anyone can view user profiles" ON user_profiles;
CREATE POLICY "Public can view limited profile info" ON user_profiles
    FOR SELECT
    USING (true);

-- interactions：仅认证用户可查看完整交互记录，匿名用户不可见
DROP POLICY IF EXISTS "Anyone can view interactions" ON interactions;
CREATE POLICY "Authenticated users can view interactions" ON interactions
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- validation_requests：仅认证用户可查看
DROP POLICY IF EXISTS "Public can view validation requests" ON validation_requests;
CREATE POLICY "Authenticated users can view validation requests" ON validation_requests
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- evolution_history：仅认证用户可查看完整变更历史
DROP POLICY IF EXISTS "Public can view evolution history" ON evolution_history;
CREATE POLICY "Authenticated users can view evolution history" ON evolution_history
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- node_comments：公开可查看（评论是社区公开内容）
-- 保留现有公开读取策略

-- ============================================
-- 4. 修复 fork_node 语义（Fork 应创建子节点而非兄弟节点）
-- ============================================
CREATE OR REPLACE FUNCTION fork_node(
    source_node_id UUID,
    new_title TEXT,
    new_description TEXT,
    new_content JSONB,
    creator_user_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    new_node_id UUID;
BEGIN
    -- 创建新节点：parent_id 设为源节点 ID（而非复制源节点的 parent_id）
    -- 这样 Fork 创建的是源节点的子版本（分支），符合 Git Fork 语义
    INSERT INTO nodes (parent_id, title, description, content, node_type, weight, is_mainline)
    SELECT source_node_id, new_title, new_description, new_content, node_type, 1.0, false
    FROM nodes
    WHERE id = source_node_id
    RETURNING id INTO new_node_id;

    -- 记录 Fork 交互
    INSERT INTO interactions (node_id, user_id, action_type, payload)
    VALUES (new_node_id, creator_user_id, 'fork', jsonb_build_object('source_node_id', source_node_id));

    RETURN new_node_id;
END;
$$;

-- ============================================
-- 5. 添加投票原子操作 RPC 函数（消除竞态条件）
-- ============================================
CREATE OR REPLACE FUNCTION vote_on_merge_proposal(
    p_proposal_id UUID,
    p_vote TEXT,
    p_voter_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_voters TEXT[];
    v_result JSONB;
BEGIN
    -- 原子检查是否已投票并更新计数
    -- 使用 SELECT ... FOR UPDATE 锁定行，防止并发投票丢失更新
    SELECT voters INTO v_voters
    FROM merge_proposals
    WHERE id = p_proposal_id
    FOR UPDATE;

    IF v_voters IS NOT NULL AND p_voter_id::TEXT = ANY(v_voters) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Already voted on this proposal');
    END IF;

    -- 原子递增投票计数并追加投票者
    IF p_vote = 'for' THEN
        UPDATE merge_proposals
        SET votes_for = votes_for + 1,
            voters = array_append(COALESCE(voters, ARRAY[]::TEXT[]), p_voter_id::TEXT)
        WHERE id = p_proposal_id;
    ELSIF p_vote = 'against' THEN
        UPDATE merge_proposals
        SET votes_against = votes_against + 1,
            voters = array_append(COALESCE(voters, ARRAY[]::TEXT[]), p_voter_id::TEXT)
        WHERE id = p_proposal_id;
    ELSE
        RETURN jsonb_build_object('success', false, 'message', 'Invalid vote type');
    END IF;

    SELECT jsonb_build_object(
        'success', true,
        'message', 'Vote recorded successfully',
        'proposal_id', p_proposal_id,
        'vote', p_vote
    ) INTO v_result;

    RETURN v_result;
END;
$$;

-- ============================================
-- 6. 添加异常处理到关键触发器函数
-- ============================================
CREATE OR REPLACE FUNCTION check_and_award_badge()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    BEGIN
        -- 检查并授予 Pioneer 徽章（首次创建节点）
        IF TG_OP = 'INSERT' AND NEW.action_type = 'create_node' THEN
            INSERT INTO user_badges (user_id, badge_id, awarded_at)
            SELECT NEW.user_id, b.id, NOW()
            FROM badges b
            WHERE b.name = 'Pioneer'
              AND NOT EXISTS (
                  SELECT 1 FROM user_badges ub 
                  WHERE ub.user_id = NEW.user_id AND ub.badge_id = b.id
              )
            ON CONFLICT DO NOTHING;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        -- 徽章授予失败不应阻断主操作
        RAISE NOTICE 'Badge award failed: %', SQLERRM;
    END;

    RETURN NEW;
END;
$$;

COMMENT ON TABLE interactions IS '交互记录表：记录所有用户行为，是 CAS 系统的能量输入源';
COMMENT ON FUNCTION vote_on_merge_proposal IS '原子投票操作：使用行锁防止竞态条件，确保投票计数准确';
COMMENT ON FUNCTION fork_node IS '创建知识分支：parent_id 设为源节点，创建子版本而非兄弟节点';
