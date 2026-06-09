-- AI Knowledge Bank - Three Vaults and Cross-Vault RAG
-- Incremental migration: keeps the existing workflow schema intact.

CREATE EXTENSION IF NOT EXISTS vector;

-- Add explicit three-vault semantics to existing knowledge nodes.
ALTER TABLE knowledge_nodes
  ADD COLUMN IF NOT EXISTS vault_type TEXT DEFAULT 'knowledge'
    CHECK (vault_type IN ('knowledge', 'tool', 'case')),
  ADD COLUMN IF NOT EXISTS source_refs JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS scenario_tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'bilingual'
    CHECK (language IN ('zh', 'en', 'bilingual')),
  ADD COLUMN IF NOT EXISTS trust_score FLOAT DEFAULT 0.5
    CHECK (trust_score >= 0 AND trust_score <= 1),
  ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Map existing categories/tags into the new vault model without losing old values.
UPDATE knowledge_nodes
SET vault_type = CASE
  WHEN category ILIKE ANY (ARRAY['%tool%', '%workflow%', '%agent%', '%sandbox%']) THEN 'tool'
  WHEN category ILIKE ANY (ARRAY['%case%', '%study%', '%sop%', '%example%']) THEN 'case'
  WHEN tags && ARRAY['tool', 'workflow', 'agent', 'sandbox'] THEN 'tool'
  WHEN tags && ARRAY['case', 'case_study', 'sop', 'example'] THEN 'case'
  ELSE COALESCE(vault_type, 'knowledge')
END
WHERE vault_type IS NULL OR vault_type = 'knowledge';

CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_vault_type ON knowledge_nodes(vault_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_language ON knowledge_nodes(language);
CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_scenario_tags ON knowledge_nodes USING GIN(scenario_tags);
CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_source_refs ON knowledge_nodes USING GIN(source_refs);
CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_trust_score ON knowledge_nodes(trust_score DESC);

-- Community signals are the raw material for Community Evolution.
CREATE TABLE IF NOT EXISTS community_evolution_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id UUID NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  signal_type TEXT NOT NULL CHECK (
    signal_type IN ('validated', 'used', 'forked', 'commented', 'merged', 'disputed')
  ),
  impact_delta FLOAT NOT NULL DEFAULT 0,
  confidence FLOAT NOT NULL DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
  evidence_url TEXT,
  weight_snapshot JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_community_signals_node ON community_evolution_signals(node_id);
CREATE INDEX IF NOT EXISTS idx_community_signals_user ON community_evolution_signals(user_id);
CREATE INDEX IF NOT EXISTS idx_community_signals_type ON community_evolution_signals(signal_type);
CREATE INDEX IF NOT EXISTS idx_community_signals_created ON community_evolution_signals(created_at DESC);

-- A stable index view for the future RAG layer.
CREATE OR REPLACE VIEW cross_vault_rag_index AS
SELECT
  kn.*,
  concat_ws(' ', kn.title, kn.summary, kn.content, array_to_string(kn.tags, ' '), array_to_string(kn.scenario_tags, ' ')) AS search_document,
  COALESCE(SUM(ces.impact_delta * ces.confidence), 0) AS signal_strength
FROM knowledge_nodes kn
LEFT JOIN community_evolution_signals ces ON ces.node_id = kn.id
GROUP BY kn.id;

-- MVP search RPC. It uses text ranking now and can be replaced with vector search later.
CREATE OR REPLACE FUNCTION match_cross_vault_nodes(
  search_query TEXT,
  locale_filter TEXT DEFAULT 'bilingual',
  result_limit INT DEFAULT 9
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  summary TEXT,
  vault_type TEXT,
  trust_score FLOAT,
  emergence_level FLOAT,
  rank_score FLOAT,
  source_refs JSONB
)
LANGUAGE sql
STABLE
AS $$
  WITH indexed AS (
    SELECT
      cvri.id,
      cvri.title,
      cvri.summary,
      cvri.vault_type,
      cvri.trust_score,
      cvri.emergence_level,
      cvri.source_refs,
      cvri.search_document,
      cvri.signal_strength,
      to_tsvector('english', COALESCE(cvri.search_document, '')) AS document_vector
    FROM cross_vault_rag_index cvri
    WHERE
      locale_filter IS NULL
      OR locale_filter = 'bilingual'
      OR cvri.language IN (locale_filter, 'bilingual')
  )
  SELECT
    indexed.id,
    indexed.title,
    indexed.summary,
    indexed.vault_type,
    indexed.trust_score,
    indexed.emergence_level,
    (
      CASE
        WHEN COALESCE(search_query, '') = '' THEN 0
        ELSE ts_rank(indexed.document_vector, plainto_tsquery('english', search_query))
      END
      + COALESCE(indexed.trust_score, 0) * 0.35
      + COALESCE(indexed.emergence_level, 0) * 0.25
      + COALESCE(indexed.signal_strength, 0) * 0.05
    ) AS rank_score,
    indexed.source_refs
  FROM indexed
  WHERE
    COALESCE(search_query, '') = ''
    OR indexed.document_vector @@ plainto_tsquery('english', search_query)
    OR indexed.search_document ILIKE '%' || search_query || '%'
  ORDER BY rank_score DESC, indexed.title ASC
  LIMIT LEAST(GREATEST(result_limit, 1), 30);
$$;

ALTER TABLE community_evolution_signals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Community signals are public readable" ON community_evolution_signals;
CREATE POLICY "Community signals are public readable"
  ON community_evolution_signals FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create community signals" ON community_evolution_signals;
CREATE POLICY "Authenticated users can create community signals"
  ON community_evolution_signals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

COMMENT ON COLUMN knowledge_nodes.vault_type IS 'Three-vault routing key: knowledge, tool, or case.';
COMMENT ON COLUMN knowledge_nodes.embedding IS 'Reserved pgvector embedding for future semantic Cross-Vault RAG.';
COMMENT ON TABLE community_evolution_signals IS 'Community validation, use, fork, merge, and dispute signals for evolution scoring.';
COMMENT ON FUNCTION match_cross_vault_nodes(TEXT, TEXT, INT) IS 'MVP Cross-Vault RAG retrieval contract using text ranking and evolution signals.';
