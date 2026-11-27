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
BEGIN
  actor_is_reviewer :=
    COALESCE(auth.role(), '') = 'service_role'
    OR EXISTS (
      SELECT 1
      FROM public.user_profiles up
      WHERE up.user_id = auth.uid()
        AND up.role IN ('validator', 'admin')
    );

  IF actor_is_reviewer THEN
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
  NEW.fork_count := OLD.fork_count;
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
BEGIN
  actor_is_reviewer :=
    COALESCE(auth.role(), '') = 'service_role'
    OR EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.user_id = auth.uid() AND up.role IN ('validator', 'admin')
    );

  IF actor_is_reviewer THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.submitter_id := auth.uid();
    NEW.reviewer_id := NULL;
    NEW.status := 'pending';
    NEW.review_comments := NULL;
    NEW.reviewed_at := NULL;
    NEW.confidence_score := NULL;
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
BEGIN
  actor_is_reviewer :=
    COALESCE(auth.role(), '') = 'service_role'
    OR EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.user_id = auth.uid() AND up.role IN ('validator', 'admin')
    );

  IF actor_is_reviewer THEN
    RETURN NEW;
  END IF;

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

COMMENT ON FUNCTION public.guard_user_profile_security_fields() IS
  'Prevents self-assignment of roles, reputation, account state, and contribution counters.';
COMMENT ON FUNCTION public.guard_knowledge_node_workflow_fields() IS
  'Prevents authors from self-validating nodes or modifying system-maintained trust metrics.';
COMMENT ON FUNCTION public.guard_validation_request_workflow() IS
  'Prevents validation submitters from appointing themselves as reviewers or changing decisions.';
COMMENT ON FUNCTION public.guard_merge_proposal_workflow() IS
  'Prevents proposal authors from self-approving merges or forging vote totals.';
