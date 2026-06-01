-- AI Knowledge Bank - CAS Emergence Algorithm
-- PostgreSQL Migration Script for Supabase
-- 基于复杂适应系统 (CAS) 的非线性权重计算与涌现机制

-- ============================================
-- 1. 创建基础数据表
-- ============================================

-- 节点表 (Nodes): 存储知识基因的基本单元
CREATE TABLE IF NOT EXISTS nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES nodes(id),
    title TEXT NOT NULL,
    description TEXT,
    content JSONB, -- 存储 Prompt 模板、SOP 等结构化内容
    node_type TEXT NOT NULL DEFAULT 'prompt', -- prompt, workflow, case_study
    weight FLOAT DEFAULT 1.0, -- 动态权重，核心 CAS 指标
    is_mainline BOOLEAN DEFAULT false, -- 是否为主干分支
    is_emerging BOOLEAN DEFAULT false, -- 是否处于涌现状态
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用户画像表 (User Profiles): 记录用户的声誉与专业领域
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    username TEXT UNIQUE,
    reputation_score FLOAT DEFAULT 10.0, -- 声誉分数，用于加权验证
    expertise_areas TEXT[], -- 专业领域标签
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 交互记录表 (Interactions): 记录所有用户与节点的交互行为
CREATE TABLE IF NOT EXISTS interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    node_id UUID REFERENCES nodes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    action_type TEXT NOT NULL, -- 'validate', 'fork', 'merge', 'comment'
    payload JSONB, -- 存储额外的交互数据，如评分、评论等
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以优化查询性能
CREATE INDEX IF NOT EXISTS idx_nodes_parent ON nodes(parent_id);
CREATE INDEX IF NOT EXISTS idx_nodes_weight ON nodes(weight DESC);
CREATE INDEX IF NOT EXISTS idx_interactions_node ON interactions(node_id);
CREATE INDEX IF NOT EXISTS idx_interactions_action ON interactions(action_type);

-- ============================================
-- 2. CAS 核心算法：非线性涌现权重计算函数
-- ============================================

-- 计算节点涌现权重的核心函数
-- 公式：Weight = Base + Σ(Validator_Reputation × Feedback_Score) / (Time_Delta + 2)^Gravity
CREATE OR REPLACE FUNCTION calculate_emergence_weight(target_node_id UUID)
RETURNS FLOAT
LANGUAGE plpgsql
AS $$
DECLARE
    base_weight FLOAT := 1.0;
    total_validation_score FLOAT := 0.0;
    gravity_constant FLOAT := 1.8; -- 重力因子，控制老知识衰减的速度
    hours_since_creation FLOAT;
    final_weight FLOAT;
BEGIN
    -- 获取节点创建至今的小时数 (加 2 是为了防止除以 0)
    SELECT EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600.0 + 2.0
    INTO hours_since_creation
    FROM nodes
    WHERE id = target_node_id;

    -- 核心 CAS 算法：聚合所有 'validate' 交互的得分
    -- 得分 = 验证者的声誉 (reputation_score) * 实战反馈系数 (payload->>'score')
    SELECT COALESCE(SUM(
        (up.reputation_score + 1.0) * 
        COALESCE((i.payload->>'score')::FLOAT, 1.0)
    ), 0.0)
    INTO total_validation_score
    FROM interactions i
    LEFT JOIN user_profiles up ON i.user_id = up.user_id
    WHERE i.node_id = target_node_id 
      AND i.action_type = 'validate';

    -- 计算最终权重：总得分 / 时间衰减因子
    final_weight := base_weight + (total_validation_score / POWER(hours_since_creation, gravity_constant));

    -- 更新数据库中的节点权重
    UPDATE nodes
    SET weight = final_weight,
        updated_at = NOW()
    WHERE id = target_node_id;

    RETURN final_weight;
END;
$$;

-- ============================================
-- 3. 触发器：自动重新计算权重
-- ============================================

-- 当有新的验证交互发生时，自动重新计算权重
CREATE OR REPLACE FUNCTION trigger_recalculate_weight()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.action_type = 'validate' THEN
        -- 调用权重计算函数
        PERFORM calculate_emergence_weight(NEW.node_id);
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_validation_update_weight
AFTER INSERT ON interactions
FOR EACH ROW
WHEN (NEW.action_type = 'validate')
EXECUTE FUNCTION trigger_recalculate_weight();

-- ============================================
-- 4. 涌现自动合并逻辑 (Auto-Merge Trigger)
-- ============================================

-- 当一个 Fork 分支的权重超过其父节点时，自动将其标记为新的主干推荐
CREATE OR REPLACE FUNCTION check_and_trigger_emergence()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    parent_weight FLOAT;
BEGIN
    IF NEW.parent_id IS NOT NULL THEN
        SELECT weight INTO parent_weight FROM nodes WHERE id = NEW.parent_id;
        
        -- 如果子分支权重超越父节点 20% 以上，触发涌现事件
        IF NEW.weight > (parent_weight * 1.2) THEN
            -- 标记为涌现状态
            UPDATE nodes 
            SET is_emerging = true 
            WHERE id = NEW.id;
            
            -- 这里可以发送一个事件到后端队列，通知 AI Agent 执行 Merge 操作并生成系统公告
            RAISE NOTICE 'EMERGENCE DETECTED: Node % (weight: %) has surpassed parent % (weight: %)', 
                NEW.id, NEW.weight, NEW.parent_id, parent_weight;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_weight_update_check_emergence
AFTER UPDATE OF weight ON nodes
FOR EACH ROW
EXECUTE FUNCTION check_and_trigger_emergence();

-- ============================================
-- 5. 辅助函数：Fork 节点
-- ============================================

-- 创建一个新分支 (Fork)
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
    -- 创建新节点
    INSERT INTO nodes (parent_id, title, description, content, node_type, weight, is_mainline)
    SELECT parent_id, new_title, new_description, new_content, node_type, 1.0, false
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
-- 6. 视图：演化树查询
-- ============================================

-- 查看完整的演化树结构
CREATE OR REPLACE VIEW evolution_tree AS
WITH RECURSIVE tree AS (
    -- 基础情况：根节点 (没有父节点的节点)
    SELECT 
        id, parent_id, title, description, content, node_type,
        weight, is_mainline, is_emerging, created_at, updated_at,
        0 as depth,
        ARRAY[id] as path
    FROM nodes
    WHERE parent_id IS NULL
    
    UNION ALL
    
    -- 递归情况：子节点
    SELECT 
        n.id, n.parent_id, n.title, n.description, n.content, n.node_type,
        n.weight, n.is_mainline, n.is_emerging, n.created_at, n.updated_at,
        t.depth + 1,
        t.path || n.id
    FROM nodes n
    INNER JOIN tree t ON n.parent_id = t.id
)
SELECT * FROM tree
ORDER BY path;

-- ============================================
-- 7. 插入创世节点 (Genesis Nodes)
-- ============================================

-- 创世节点 1: 跨境出海多语言本地化营销
INSERT INTO nodes (id, title, description, content, node_type, weight, is_mainline)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    '【跨境出海】多语言本地化营销物料生成流',
    'SOP 核心：引入霍夫斯泰德文化维度理论，挂载本地俚语 RAG，强制输出 Reels 脚本格式。',
    '{
        "role": "拉美区资深本土化营销专家",
        "context": "便携式咖啡机，客单价$50，目标受众墨西哥城 25-35 岁职场白领",
        "constraints": [
            "墨西哥文化在不确定性规避上得分较高",
            "文案必须强调耐用、售后保障、确定性",
            "避免使用过于激进或冒险的词汇"
        ],
        "task": "将英文卖点转化为 3 条 Instagram Reels 短视频脚本",
        "anti_hallucination": "严禁捏造产品不存在的功能，若遇到无法确定的本土化表达请用 [需人工校验] 标出"
    }'::jsonb,
    'prompt',
    85.0,
    true
);

-- 创世节点 2: 独立开发者 PRD 到代码骨架
INSERT INTO nodes (id, title, description, content, node_type, weight, is_mainline)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    '【独立开发】PRD 到全栈代码骨架自动化 Agent',
    'Workflow：读取 PRD -> 提取 DDD 领域模型 (Mermaid) -> 生成 OpenAPI 3.0 契约 -> 补全边缘测试。',
    '{
        "steps": [
            {
                "name": "领域建模",
                "action": "提取核心实体和值对象",
                "output": "Mermaid 类图代码"
            },
            {
                "name": "接口契约",
                "action": "基于 RESTful 规范生成 OpenAPI 3.0 YAML",
                "output": "包含所有错误码的 Schema"
            },
            {
                "name": "边缘用例",
                "action": "列出 PRD 中未提及的 5 个极端边缘场景",
                "output": "补充到测试用例列表"
            }
        ]
    }'::jsonb,
    'workflow',
    112.0,
    true
);

-- 创世节点 3: 金融分析财报风险因子抽取
INSERT INTO nodes (id, title, description, content, node_type, weight, is_mainline)
VALUES (
    '00000000-0000-0000-0000-000000000003',
    '【金融分析】长文本财报 (10-K) 风险因子自动抽取与对比矩阵',
    '痛点：几百页的 PDF 财报，人工提取风险因素并与去年对比极其耗时。',
    '{
        "role": "严苛的华尔街做空机构分析师",
        "input": "2023 年与 2024 年的 10-K 财报 PDF",
        "task": "执行风险因子差异分析",
        "output_format": "Markdown 表格，包含列：[风险类别] | [2023 年描述摘要] | [2024 年描述摘要] | [语气变化分析] | [潜在做空切入点]",
        "rule": "必须使用引用锚点 (如 [Page 45, Paragraph 2]) 来支撑每一个提取结论"
    }'::jsonb,
    'workflow',
    95.0,
    true
);

-- ============================================
-- 8. 注释说明
-- ============================================

COMMENT ON TABLE nodes IS '知识基因节点表：存储 Prompt、Workflow、Case Study 等知识单元';
COMMENT ON COLUMN nodes.weight IS '动态权重：基于 CAS 算法实时计算，反映知识的社区验证程度';
COMMENT ON COLUMN nodes.is_emerging IS '涌现标记：当分支权重超越主干时自动标记，触发合并流程';
COMMENT ON TABLE user_profiles IS '用户画像表：记录用户声誉分数和专业领域，用于加权验证';
COMMENT ON TABLE interactions IS '交互记录表：记录所有用户行为，是 CAS 系统的能量输入源';
COMMENT ON FUNCTION calculate_emergence_weight IS 'CAS 核心算法：基于 Hacker News Gravity 变体 + PageRank 声誉传递的非线性权重计算';
