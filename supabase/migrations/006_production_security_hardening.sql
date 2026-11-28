-- AI Knowledge Bank 1.0 - Production security hardening
-- Apply after 004_three_vault_cross_rag.sql.
-- This migration tightens trust boundaries without changing existing data.

-- ---------------------------------------------------------------------------
-- 1. User profile: prevent self-assignment of privileged/system-managed fields.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_user_profile_security_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  actor_is_admin BOOLEAN := FALSE;
BEGIN
  actor_is_admin :=
    COALESCE(auth.role(), '') = 'service_role'
    OR EXISTS (
      SELECT 1
      FROM public.user_profiles up
      WHERE up.user_id = auth.uid()
        AND up.role = 'admin'
    );

  IF actor_is_admin THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.role := 'member';
    NEW.is_active := TRUE;
    NEW.reputation_score := 10.0;
    NEW.total_validations := 0;
    NEW.total_forks := 0;
    NEW.total_merges := 0;
    NEW.badges := '{}'::TEXT[];
    NEW.email := (
      SELECT u.email FROM auth.users u WHERE u.id = NEW.user_id
    );
    RETURN NEW;
  END IF;

  -- Users may edit presentation/profile fields, never identity, role,
  -- account state, reputation, contribution counters, badges, or email.
  NEW.id := OLD.id;
  NEW.user_id := OLD.user_id;
  NEW.email := OLD.email;
  NEW.role := OLD.role;
  NEW.is_active := OLD.is_active;
  NEW.reputation_score := OLD.reputation_score;
  NEW.total_validations := OLD.total_validations;
  NEW.total_forks := OLD.total_forks;
  NEW.total_merges := OLD.total_merges;
  NEW.badges := OLD.badges;
  NEW.created_at := OLD.created_at;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_user_profile_security_fields ON public.user_profiles;
CREATE TRIGGER trg_guard_user_profile_security_fields
BEFORE INSERT OR UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.guard_user_profile_security_fields();

-- Public access to user_profiles previously exposed every column, including
-- email. Keep private profile rows owner-readable and expose a sanitized view.
DROP POLICY IF EXISTS "Anyone can view user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
CREATE POLICY "Users can view their own profile"
  ON public.user_profiles FOR SELECT
  USING (user_id = auth.uid());

CREATE OR REPLACE VIEW public.public_user_profiles AS
SELECT
  id,
  username,
  avatar_url,
  bio,
  display_name,
  expertise_areas,
  reputation_score,
  total_validations,
  total_forks,
  total_merges,
  badges,
  created_at
FROM public.user_profiles;

GRANT SELECT ON public.public_user_profiles TO anon, authenticated;

-- Preserve the existing leaderboard response shape while removing the auth
-- user UUID and last-active timestamp from public output.
CREATE OR REPLACE VIEW public.user_leaderboard AS
SELECT
  up.id,
  NULL::UUID AS user_id,
  up.username,
  up.avatar_url,
  up.reputation_score,
  up.total_validations,
  up.total_forks,
  up.total_merges,
  up.badges,
  NULL::TIMESTAMPTZ AS last_active_at,
  COUNT(DISTINCT kn.id) AS nodes_created,
  RANK() OVER (ORDER BY up.reputation_score DESC) AS reputation_rank,
  RANK() OVER (ORDER BY up.total_validations DESC) AS validator_rank
FROM public.user_profiles up
LEFT JOIN public.knowledge_nodes kn
  ON kn.author_id = up.user_id AND kn.parent_id IS NOT NULL
GROUP BY
  up.id, up.username, up.avatar_url, up.reputation_score,
  up.total_validations, up.total_forks, up.total_merges, up.badges;

GRANT SELECT ON public.user_leaderboard TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Knowledge nodes: drafts are private; authors cannot self-validate or
--    rewrite system-maintained trust/evolution counters.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view published nodes" ON public.knowledge_nodes;
CREATE POLICY "Public can view published nodes"
  ON public.knowledge_nodes FOR SELECT
  USING (status IN ('validated', 'merged'));

CREATE OR REPLACE FUNCTION public.guard_knowledge_node_workflow_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  actor_is_reviewer BOOLEAN := FALSE;
  actor_is_admin BOOLEAN := FALSE;
BEGIN
  IF COALESCE(auth.role(), '') = 'service_role' THEN
    RETURN NEW;
  END IF;

  SELECT
    COALESCE(BOOL_OR(role IN ('validator', 'admin')), FALSE),
    COALESCE(BOOL_OR(role = 'admin'), FALSE)
  INTO actor_is_reviewer, actor_is_admin
  FROM public.user_profiles
  WHERE user_id = auth.uid();

  IF actor_is_admin THEN
    RETURN NEW;
  END IF;

  IF actor_is_reviewer AND TG_OP = 'INSERT' THEN
    -- Validators may contribute nodes, but publication always requires a
    -- separate review action by another validator/admin.
    NEW.author_id := auth.uid();
    NEW.status := 'draft';
    NEW.validation_count := 0;
    NEW.fork_count := 0;
    NEW.merge_count := 0;
    NEW.validated_at := NULL;
    NEW.merged_at := NULL;
    NEW.trust_score := 0.5;
    NEW.emergence_level := 0;
    NEW.complexity_score := 0;
    NEW.connectivity_score := 0;
    NEW.adaptation_score := 0;
    NEW.version := 1;
    NEW.is_latest_version := TRUE;
    RETURN NEW;
  END IF;

  IF actor_is_reviewer THEN
    IF OLD.author_id = auth.uid()
       AND NEW.status IS DISTINCT FROM OLD.status
       AND NEW.status IN ('validated', 'merged') THEN
      RAISE EXCEPTION 'A validator cannot publish or merge their own node'
        USING ERRCODE = '42501';
    END IF;

    -- A validator may change only the workflow state and review timestamps.
    -- They cannot rewrite knowledge content, authorship, versioning or CAS
    -- metrics while performing a review.
    IF pg_trigger_depth() > 1 THEN
      -- Trusted nested database triggers maintain these derived counters
      -- after validation/fork events. Clients cannot fake trigger depth.
      IF (to_jsonb(NEW) - ARRAY[
            'status', 'validated_at', 'merged_at', 'updated_at',
            'validation_count', 'fork_count', 'merge_count'
          ])
         IS DISTINCT FROM
         (to_jsonb(OLD) - ARRAY[
            'status', 'validated_at', 'merged_at', 'updated_at',
            'validation_count', 'fork_count', 'merge_count'
          ]) THEN
        RAISE EXCEPTION 'Nested workflow triggers may only update derived counters'
          USING ERRCODE = '42501';
      END IF;
    ELSE
      IF (to_jsonb(NEW) - ARRAY['status', 'validated_at', 'merged_at', 'updated_at'])
         IS DISTINCT FROM
         (to_jsonb(OLD) - ARRAY['status', 'validated_at', 'merged_at', 'updated_at']) THEN
        RAISE EXCEPTION 'Validators may only change node workflow state'
          USING ERRCODE = '42501';
      END IF;
    END IF;

    IF NEW.status IS DISTINCT FROM OLD.status THEN
      IF NEW.status = 'validated' THEN
        NEW.validated_at := COALESCE(NEW.validated_at, NOW());
      ELSIF NEW.status = 'merged' THEN
        IF OLD.status <> 'validated' THEN
          RAISE EXCEPTION 'Only validated nodes may be merged'
            USING ERRCODE = '42501';
        END IF;
        NEW.merged_at := COALESCE(NEW.merged_at, NOW());
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.author_id := auth.uid();
    NEW.status := 'draft';
    NEW.validation_count := 0;
    NEW.fork_count := 0;
    NEW.merge_count := 0;
    NEW.validated_at := NULL;
    NEW.merged_at := NULL;
    NEW.trust_score := 0.5;
    NEW.emergence_level := 0;
    NEW.complexity_score := 0;
    NEW.connectivity_score := 0;
    NEW.adaptation_score := 0;
    NEW.version := 1;
    NEW.is_latest_version := TRUE;
    RETURN NEW;
  END IF;

  NEW.author_id := OLD.author_id;
  NEW.status := OLD.status;
  NEW.validation_count := OLD.validation_count;
  -- Recompute this derived counter from source records so the existing
  -- fork-maintenance trigger can update it without trusting client values.
  NEW.fork_count := (
    SELECT COUNT(*)::INT FROM public.node_forks nf
    WHERE nf.original_node_id = OLD.id
  );
  NEW.merge_count := OLD.merge_count;
  NEW.validated_at := OLD.validated_at;
  NEW.merged_at := OLD.merged_at;
  NEW.trust_score := OLD.trust_score;
  NEW.emergence_level := OLD.emergence_level;
  NEW.complexity_score := OLD.complexity_score;
  NEW.connectivity_score := OLD.connectivity_score;
  NEW.adaptation_score := OLD.adaptation_score;
  NEW.version := OLD.version;
  NEW.is_latest_version := OLD.is_latest_version;
  NEW.created_at := OLD.created_at;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_knowledge_node_workflow_fields ON public.knowledge_nodes;
CREATE TRIGGER trg_guard_knowledge_node_workflow_fields
BEFORE INSERT OR UPDATE ON public.knowledge_nodes
FOR EACH ROW
EXECUTE FUNCTION public.guard_knowledge_node_workflow_fields();

-- ---------------------------------------------------------------------------
-- 3. Validation requests: submitters cannot appoint themselves as reviewers
--    or approve their own submissions.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can create validation requests" ON public.validation_requests;
CREATE POLICY "Authenticated users can create validation requests"
  ON public.validation_requests FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND submitter_id = auth.uid()
    AND reviewer_id IS NULL
    AND status = 'pending'
  );

DROP POLICY IF EXISTS "Reviewers can update validation requests" ON public.validation_requests;
CREATE POLICY "Validators and admins can update validation requests"
  ON public.validation_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.user_id = auth.uid() AND up.role IN ('validator', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.user_id = auth.uid() AND up.role IN ('validator', 'admin')
    )
  );

CREATE OR REPLACE FUNCTION public.guard_validation_request_workflow()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  actor_is_reviewer BOOLEAN := FALSE;
  actor_is_admin BOOLEAN := FALSE;
BEGIN
  IF COALESCE(auth.role(), '') = 'service_role' THEN
    RETURN NEW;
  END IF;

  SELECT
    COALESCE(BOOL_OR(role IN ('validator', 'admin')), FALSE),
    COALESCE(BOOL_OR(role = 'admin'), FALSE)
  INTO actor_is_reviewer, actor_is_admin
  FROM public.user_profiles
  WHERE user_id = auth.uid();

  IF TG_OP = 'INSERT' THEN
    NEW.submitter_id := auth.uid();
    NEW.reviewer_id := NULL;
    NEW.status := 'pending';
    NEW.review_comments := NULL;
    NEW.reviewed_at := NULL;
    NEW.confidence_score := NULL;
    RETURN NEW;
  END IF;

  IF actor_is_reviewer THEN
    IF NOT actor_is_admin
       AND NEW.submitter_id = auth.uid()
       AND NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'A validator cannot review their own submission'
        USING ERRCODE = '42501';
    END IF;
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      NEW.reviewer_id := auth.uid();
      NEW.reviewed_at := COALESCE(NEW.reviewed_at, NOW());
    END IF;
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Only validators or admins may update validation decisions'
    USING ERRCODE = '42501';
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_validation_request_workflow ON public.validation_requests;
CREATE TRIGGER trg_guard_validation_request_workflow
BEFORE INSERT OR UPDATE ON public.validation_requests
FOR EACH ROW
EXECUTE FUNCTION public.guard_validation_request_workflow();

-- ---------------------------------------------------------------------------
-- 4. Merge proposals: prevent self-approval and forged approval counters.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can create merge proposals" ON public.merge_proposals;
CREATE POLICY "Authenticated users can create merge proposals"
  ON public.merge_proposals FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND proposer_id = auth.uid()
    AND approver_id IS NULL
    AND status = 'pending'
  );

DROP POLICY IF EXISTS "Approvers can update merge proposals" ON public.merge_proposals;
CREATE POLICY "Validators and admins can update merge proposals"
  ON public.merge_proposals FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.user_id = auth.uid() AND up.role IN ('validator', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.user_id = auth.uid() AND up.role IN ('validator', 'admin')
    )
  );

CREATE OR REPLACE FUNCTION public.guard_merge_proposal_workflow()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  actor_is_reviewer BOOLEAN := FALSE;
  actor_is_admin BOOLEAN := FALSE;
BEGIN
  IF COALESCE(auth.role(), '') = 'service_role' THEN
    RETURN NEW;
  END IF;

  SELECT
    COALESCE(BOOL_OR(role IN ('validator', 'admin')), FALSE),
    COALESCE(BOOL_OR(role = 'admin'), FALSE)
  INTO actor_is_reviewer, actor_is_admin
  FROM public.user_profiles
  WHERE user_id = auth.uid();

  IF TG_OP = 'INSERT' THEN
    NEW.proposer_id := auth.uid();
    NEW.approver_id := NULL;
    NEW.status := 'pending';
    NEW.votes_for := 0;
    NEW.votes_against := 0;
    NEW.voters := '{}'::UUID[];
    NEW.decided_at := NULL;
    RETURN NEW;
  END IF;

  IF actor_is_reviewer THEN
    IF NOT actor_is_admin
       AND NEW.proposer_id = auth.uid()
       AND NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'A validator cannot approve their own merge proposal'
        USING ERRCODE = '42501';
    END IF;
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      NEW.approver_id := auth.uid();
      NEW.decided_at := COALESCE(NEW.decided_at, NOW());
    END IF;
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Only validators or admins may update merge decisions'
    USING ERRCODE = '42501';
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_merge_proposal_workflow ON public.merge_proposals;
CREATE TRIGGER trg_guard_merge_proposal_workflow
BEFORE INSERT OR UPDATE ON public.merge_proposals
FOR EACH ROW
EXECUTE FUNCTION public.guard_merge_proposal_workflow();

-- ---------------------------------------------------------------------------
-- 5. Fork provenance: a user may only record a fork they authored.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_node_fork_provenance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  IF COALESCE(auth.role(), '') = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required to create a fork'
      USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.knowledge_nodes kn
    WHERE kn.id = NEW.forked_node_id AND kn.author_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'A fork must reference a node authored by the current user'
      USING ERRCODE = '42501';
  END IF;

  NEW.forked_by := auth.uid();
  NEW.merge_status := 'pending';
  NEW.merged_into := NULL;
  NEW.merged_at := NULL;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_node_fork_provenance ON public.node_forks;
CREATE TRIGGER trg_guard_node_fork_provenance
BEFORE INSERT ON public.node_forks
FOR EACH ROW
EXECUTE FUNCTION public.guard_node_fork_provenance();

-- ---------------------------------------------------------------------------
-- 6. Community signals are untrusted input until independently verified.
--    User-generated usage/dispute events cannot increase retrieval ranking.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_community_signal_trust()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  actor_role TEXT := COALESCE(auth.role(), '');
  actor_is_reviewer BOOLEAN := FALSE;
BEGIN
  actor_is_reviewer :=
    actor_role = 'service_role'
    OR EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.user_id = auth.uid() AND up.role IN ('validator', 'admin')
    );

  IF actor_role = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS NULL OR NEW.user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Community signals must be attributed to the signed-in user'
      USING ERRCODE = '42501';
  END IF;

  IF actor_is_reviewer THEN
    IF NEW.signal_type NOT IN ('validated', 'used', 'forked', 'commented', 'merged', 'disputed') THEN
      RAISE EXCEPTION 'Unsupported community signal type'
        USING ERRCODE = '22023';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.signal_type NOT IN ('used', 'forked', 'commented', 'disputed') THEN
    RAISE EXCEPTION 'Only validators may submit validation or merge signals'
      USING ERRCODE = '42501';
  END IF;

  -- Community activity is recorded, but it does not alter trust/ranking until
  -- reviewed. A later validator/service event can record verified impact.
  NEW.impact_delta := 0;
  NEW.confidence := 0.5;
  NEW.weight_snapshot := '{}'::jsonb;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_community_signal_trust ON public.community_evolution_signals;
CREATE TRIGGER trg_guard_community_signal_trust
BEFORE INSERT OR UPDATE ON public.community_evolution_signals
FOR EACH ROW
EXECUTE FUNCTION public.guard_community_signal_trust();

-- ---------------------------------------------------------------------------
-- 7. Cross-Vault RAG: make the index view invoker-secured and publish-only.
--    A normal PostgreSQL view can otherwise execute with its owner's rights
--    and bypass the caller's knowledge_nodes RLS policies.
-- ---------------------------------------------------------------------------
-- The original view exposed every knowledge_nodes column. Drop the
-- dependent search RPC first because PostgreSQL cannot remove view columns
-- through CREATE OR REPLACE VIEW.
DROP FUNCTION IF EXISTS public.match_cross_vault_nodes(TEXT, TEXT, INT);
DROP VIEW IF EXISTS public.cross_vault_rag_index;

CREATE VIEW public.cross_vault_rag_index
WITH (security_invoker = true)
AS
SELECT
  kn.id,
  kn.title,
  kn.summary,
  kn.vault_type,
  kn.trust_score,
  kn.emergence_level,
  kn.source_refs,
  kn.language,
  concat_ws(
    ' ',
    kn.title,
    kn.summary,
    kn.content,
    array_to_string(kn.tags, ' '),
    array_to_string(kn.scenario_tags, ' ')
  ) AS search_document,
  COALESCE(
    SUM(
      CASE
        WHEN ces.signal_type IN ('validated', 'merged')
          THEN ces.impact_delta * ces.confidence
        ELSE 0
      END
    ),
    0
  ) AS signal_strength
FROM public.knowledge_nodes kn
LEFT JOIN public.community_evolution_signals ces
  ON ces.node_id = kn.id
WHERE kn.status IN ('validated', 'merged')
GROUP BY kn.id;

CREATE OR REPLACE FUNCTION public.match_cross_vault_nodes(
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
SET search_path = public, pg_temp
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
      to_tsvector('simple', COALESCE(cvri.search_document, '')) AS document_vector
    FROM public.cross_vault_rag_index cvri
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
        ELSE ts_rank(
          indexed.document_vector,
          plainto_tsquery('simple', search_query)
        )
      END
      + COALESCE(indexed.trust_score, 0) * 0.35
      + COALESCE(indexed.emergence_level, 0) * 0.25
      + LEAST(GREATEST(COALESCE(indexed.signal_strength, 0), 0), 10) * 0.05
    ) AS rank_score,
    indexed.source_refs
  FROM indexed
  WHERE
    COALESCE(search_query, '') = ''
    OR indexed.document_vector @@ plainto_tsquery('simple', search_query)
    OR indexed.search_document ILIKE '%' || search_query || '%'
  ORDER BY rank_score DESC, indexed.title ASC
  LIMIT LEAST(GREATEST(COALESCE(result_limit, 9), 1), 30);
$$;

GRANT SELECT ON public.cross_vault_rag_index TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.match_cross_vault_nodes(TEXT, TEXT, INT)
  TO anon, authenticated;

COMMENT ON FUNCTION public.guard_user_profile_security_fields() IS
  'Prevents self-assignment of roles, reputation, account state, and contribution counters.';
COMMENT ON FUNCTION public.guard_knowledge_node_workflow_fields() IS
  'Prevents authors from self-validating nodes or modifying system-maintained trust metrics.';
COMMENT ON FUNCTION public.guard_validation_request_workflow() IS
  'Prevents validation submitters from appointing themselves as reviewers or changing decisions.';
COMMENT ON FUNCTION public.guard_merge_proposal_workflow() IS
  'Prevents proposal authors from self-approving merges or forging vote totals.';
