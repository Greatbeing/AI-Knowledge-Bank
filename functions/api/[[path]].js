const API_VERSION = '2026-06-10.cross-vault-backend';
const VALID_SIGNAL_TYPES = new Set(['validated', 'used', 'forked', 'commented', 'merged', 'disputed']);
const VAULT_TYPES = ['knowledge', 'tool', 'case'];

const FALLBACK_NODES = [
  {
    id: 'demo-knowledge-localization-framework',
    vault_type: 'knowledge',
    title: '本地化判断框架',
    summary: '拆分语言、文化、渠道和合规四类变量，先判断任务边界，再决定 AI 介入方式。',
    recommendation_reason: '为跨境营销、客服和培训场景提供可复用的认知解释。',
    trust_score: 0.91,
    emergence_level: 0.84,
    source_refs: ['AI Knowledge Bank demo corpus'],
    scenario_tags: ['marketing', 'localization', 'sop'],
    language: 'bilingual',
    created_at: '2026-06-10T00:00:00.000Z'
  },
  {
    id: 'demo-tool-agent-review-chain',
    vault_type: 'tool',
    title: '翻译评审 Agent 链',
    summary: '生成、校验、风格统一、风险标注四步联动，让人工审核集中在高风险内容。',
    recommendation_reason: '把知识库里的判断框架转成可执行的工具路径。',
    trust_score: 0.86,
    emergence_level: 0.78,
    source_refs: ['AI Knowledge Bank demo workflow'],
    scenario_tags: ['agent', 'workflow', 'review'],
    language: 'bilingual',
    created_at: '2026-06-10T00:00:00.000Z'
  },
  {
    id: 'demo-case-latam-sop',
    vault_type: 'case',
    title: '拉美素材复用案例',
    summary: '复用 37 条广告素材，并用点击率和人工复审记录验证本地化 SOP 的有效性。',
    recommendation_reason: '用真实 Before/After 结果补足方案证据链。',
    trust_score: 0.83,
    emergence_level: 0.81,
    source_refs: ['AI Knowledge Bank demo case'],
    scenario_tags: ['case-study', 'before-after', 'marketing'],
    language: 'bilingual',
    created_at: '2026-06-10T00:00:00.000Z'
  },
  {
    id: 'demo-knowledge-teaching-boundary',
    vault_type: 'knowledge',
    title: 'AI 助教边界模型',
    summary: '区分解释、练习、反馈和评估四类教学任务，明确哪些环节适合 AI 先行。',
    recommendation_reason: '帮助教育场景先建立安全边界，再接入工具链。',
    trust_score: 0.88,
    emergence_level: 0.74,
    source_refs: ['AI Knowledge Bank teaching notes'],
    scenario_tags: ['education', 'assistant', 'teacher'],
    language: 'bilingual',
    created_at: '2026-06-10T00:00:00.000Z'
  },
  {
    id: 'demo-tool-lesson-workflow',
    vault_type: 'tool',
    title: '备课到反馈工作流',
    summary: '课程大纲、例题生成、学生画像和课后反馈摘要串联成一条可复盘流程。',
    recommendation_reason: '把教师的重复劳动转成可验证的标准流程。',
    trust_score: 0.84,
    emergence_level: 0.72,
    source_refs: ['AI Knowledge Bank workflow demo'],
    scenario_tags: ['education', 'workflow', 'feedback'],
    language: 'bilingual',
    created_at: '2026-06-10T00:00:00.000Z'
  },
  {
    id: 'demo-case-small-class-feedback',
    vault_type: 'case',
    title: '小班课反馈提效案例',
    summary: '教师把课后反馈整理时间从 90 分钟降到 20 分钟，同时保留人工确认节点。',
    recommendation_reason: '展示工具路径在真实教学组织中的收益和边界。',
    trust_score: 0.79,
    emergence_level: 0.7,
    source_refs: ['AI Knowledge Bank education case'],
    scenario_tags: ['education', 'case-study', 'feedback'],
    language: 'bilingual',
    created_at: '2026-06-10T00:00:00.000Z'
  }
];

export async function onRequest(context) {
  const { request } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  try {
    const route = getRoute(context);

    if (route === 'health' && request.method === 'GET') {
      return jsonResponse(handleHealth(context.env));
    }

    if (route === 'vaults' && request.method === 'GET') {
      return jsonResponse(await handleVaults(context.env));
    }

    if (route === 'search' && request.method === 'GET') {
      return jsonResponse(await handleSearch(request, context.env));
    }

    if (route === 'community-signals' && request.method === 'POST') {
      return jsonResponse(await handleCommunitySignals(request, context.env), 201);
    }

    return jsonResponse({
      ok: false,
      error: 'not_found',
      message: 'Unknown AI Knowledge Bank API route.'
    }, 404);
  } catch (error) {
    const status = Number.isInteger(error.status) ? error.status : 500;
    return jsonResponse({
      ok: false,
      error: status === 500 ? 'internal_error' : 'request_error',
      message: error.message || 'Unexpected API error.'
    }, status);
  }
}

function getRoute(context) {
  const rawPath = context.params.path;
  if (Array.isArray(rawPath)) return rawPath.join('/');
  return rawPath || '';
}

function handleHealth(env) {
  const supabase = getSupabaseConfig(env);

  return {
    ok: true,
    service: 'AI Knowledge Bank API',
    version: API_VERSION,
    runtime: 'cloudflare-pages-functions',
    supabase: {
      configured: Boolean(supabase),
      hasServiceRole: Boolean(env.SUPABASE_SERVICE_ROLE_KEY)
    },
    endpoints: ['/api/health', '/api/vaults', '/api/search', '/api/community-signals'],
    generatedAt: new Date().toISOString()
  };
}

async function handleVaults(env) {
  const supabase = getSupabaseConfig(env);

  if (!supabase) {
    return buildVaultPayload(FALLBACK_NODES, 'fallback');
  }

  try {
    const result = await fetchAvailableVaultNodes(env);
    const nodes = result.rows.length > 0 ? result.rows.map(normalizeNode) : FALLBACK_NODES;
    return {
      ...buildVaultPayload(nodes, result.rows.length > 0 ? 'supabase' : 'fallback'),
      schema: result.schema
    };
  } catch (error) {
    return {
      ...buildVaultPayload(FALLBACK_NODES, 'fallback'),
      warning: sanitizeError(error)
    };
  }
}

async function handleSearch(request, env) {
  const url = new URL(request.url);
  const query = (url.searchParams.get('q') || '').trim();
  const locale = normalizeLocale(url.searchParams.get('locale'));
  const limitPerVault = clampNumber(Number(url.searchParams.get('limit') || 3), 1, 6);
  const supabase = getSupabaseConfig(env);

  if (supabase) {
    try {
      const rows = await supabaseFetch(env, '/rest/v1/rpc/match_cross_vault_nodes', {
        method: 'POST',
        body: {
          search_query: query,
          locale_filter: locale,
          result_limit: limitPerVault * VAULT_TYPES.length
        }
      });

      if (Array.isArray(rows) && rows.length > 0) {
        return buildSearchPayload(query, locale, rows.map(normalizeNode), 'supabase', limitPerVault);
      }
    } catch (error) {
      const tableSearch = await searchSupabaseTables(env, query, locale, limitPerVault);
      if (tableSearch) {
        return {
          ...tableSearch,
          warning: `RPC unavailable, searched Supabase table instead: ${sanitizeError(error)}`
        };
      }

      return {
        ...buildSearchPayload(query, locale, filterFallbackNodes(query, locale), 'fallback', limitPerVault),
        warning: sanitizeError(error)
      };
    }
  }

  return buildSearchPayload(query, locale, filterFallbackNodes(query, locale), 'fallback', limitPerVault);
}

async function handleCommunitySignals(request, env) {
  const body = await parseJson(request);
  const signalType = body.signal_type;

  if (!VALID_SIGNAL_TYPES.has(signalType)) {
    throw httpError(400, 'Invalid signal_type.');
  }

  const confidence = clampNumber(Number(body.confidence ?? 0.72), 0, 1);
  const impactDelta = clampNumber(Number(body.impact_delta ?? defaultImpact(signalType)), -20, 50);
  const nodeId = typeof body.node_id === 'string' && body.node_id.trim() ? body.node_id.trim() : null;
  const event = {
    node_id: nodeId,
    signal_type: signalType,
    impact_delta: impactDelta,
    confidence,
    evidence_url: sanitizeOptionalString(body.evidence_url),
    metadata: typeof body.metadata === 'object' && body.metadata !== null ? body.metadata : {},
    weight_snapshot: typeof body.weight_snapshot === 'object' && body.weight_snapshot !== null ? body.weight_snapshot : {}
  };

  const supabase = getSupabaseConfig(env);
  if (supabase && nodeId) {
    try {
      const rows = await supabaseFetch(env, '/rest/v1/community_evolution_signals?select=id,node_id,signal_type,impact_delta,confidence,evidence_url,metadata,created_at', {
        method: 'POST',
        prefer: 'return=representation',
        body: event
      });
      const inserted = Array.isArray(rows) ? rows[0] : rows;
      return buildSignalResponse(inserted || event, 'supabase', true);
    } catch (error) {
      return {
        ...buildSignalResponse(event, 'fallback', false),
        warning: sanitizeError(error)
      };
    }
  }

  return buildSignalResponse(event, 'fallback', false);
}

function getSupabaseConfig(env) {
  const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return {
    url: String(url).replace(/\/+$/, ''),
    key
  };
}

async function supabaseFetch(env, path, options = {}) {
  const supabase = getSupabaseConfig(env);
  if (!supabase) throw httpError(503, 'Supabase is not configured.');

  const headers = {
    apikey: supabase.key,
    Authorization: `Bearer ${supabase.key}`,
    'Content-Type': 'application/json'
  };

  if (options.prefer) headers.Prefer = options.prefer;

  const response = await fetch(`${supabase.url}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (!response.ok) {
    const detail = await response.text();
    throw httpError(response.status, detail || 'Supabase request failed.');
  }

  if (response.status === 204) return null;
  return response.json();
}

async function fetchAvailableVaultNodes(env) {
  try {
    const rows = await supabaseFetch(env, '/rest/v1/knowledge_nodes?select=id,title,summary,content,tags,category,vault_type,trust_score,source_refs,scenario_tags,language,validation_count,fork_count,merge_count,emergence_level,created_at&order=created_at.desc&limit=36');
    return {
      rows: Array.isArray(rows) ? rows : [],
      schema: 'knowledge_nodes'
    };
  } catch (knowledgeError) {
    try {
      const rows = await supabaseFetch(env, '/rest/v1/nodes?select=id,title,content,node_type,weight,is_mainline,is_emerging,version_label,created_at,updated_at&order=created_at.desc&limit=36');
      return {
        rows: Array.isArray(rows) ? rows : [],
        schema: 'nodes',
        warning: sanitizeError(knowledgeError)
      };
    } catch (legacyError) {
      throw httpError(legacyError.status || knowledgeError.status || 500, sanitizeError(legacyError));
    }
  }
}

async function searchSupabaseTables(env, query, locale, limitPerVault) {
  try {
    const result = await fetchAvailableVaultNodes(env);
    const normalized = result.rows.map(normalizeNode);
    const filtered = filterNodes(normalized, query, locale);
    const nodes = filtered.length > 0 ? filtered : normalized;

    if (!nodes.length) return null;

    return {
      ...buildSearchPayload(query, locale, nodes, 'supabase', limitPerVault),
      schema: result.schema
    };
  } catch {
    return null;
  }
}

function buildVaultPayload(nodes, source) {
  const normalized = nodes.map(normalizeNode);
  const vaults = {
    knowledge: normalized.filter((node) => node.vault_type === 'knowledge'),
    tools: normalized.filter((node) => node.vault_type === 'tool'),
    cases: normalized.filter((node) => node.vault_type === 'case')
  };

  return {
    ok: true,
    source,
    vaults,
    stats: {
      knowledge: vaults.knowledge.length,
      tools: vaults.tools.length,
      cases: vaults.cases.length,
      total: normalized.length
    },
    generatedAt: new Date().toISOString()
  };
}

function buildSearchPayload(query, locale, nodes, source, limitPerVault) {
  const normalized = nodes.map(normalizeNode);
  const covered = source === 'fallback' ? ensureVaultCoverage(normalized, locale, limitPerVault) : normalized;
  const grouped = {
    knowledge: covered.filter((node) => node.vault_type === 'knowledge'),
    tools: covered.filter((node) => node.vault_type === 'tool'),
    cases: covered.filter((node) => node.vault_type === 'case')
  };
  const results = {
    knowledge: grouped.knowledge.slice(0, limitPerVault),
    tools: grouped.tools.slice(0, limitPerVault),
    cases: grouped.cases.slice(0, limitPerVault)
  };

  return {
    ok: true,
    query,
    locale,
    source,
    results,
    synthesis: buildSynthesis(query, results, locale),
    generatedAt: new Date().toISOString()
  };
}

function ensureVaultCoverage(nodes, locale, limitPerVault) {
  const covered = [...nodes];
  const seen = new Set(covered.map((node) => node.id));
  const fallbackCandidates = FALLBACK_NODES.map(normalizeNode).filter((node) => {
    return locale === 'bilingual' || node.language === 'bilingual' || node.language === locale;
  });

  VAULT_TYPES.forEach((vaultType) => {
    const currentCount = covered.filter((node) => node.vault_type === vaultType).length;
    const missingCount = Math.max(0, Math.min(limitPerVault, 1) - currentCount);
    if (!missingCount) return;

    fallbackCandidates
      .filter((node) => node.vault_type === vaultType && !seen.has(node.id))
      .slice(0, missingCount)
      .forEach((node) => {
        covered.push(node);
        seen.add(node.id);
      });
  });

  return covered;
}

function buildSignalResponse(signal, source, persisted) {
  const weightedImpact = Number((Number(signal.impact_delta || 0) * Number(signal.confidence || 0)).toFixed(2));

  return {
    ok: true,
    source,
    persisted,
    signal: {
      id: signal.id || `demo-signal-${Date.now()}`,
      node_id: signal.node_id,
      signal_type: signal.signal_type,
      impact_delta: Number(signal.impact_delta || 0),
      confidence: Number(signal.confidence || 0),
      weighted_impact: weightedImpact,
      evidence_url: signal.evidence_url || null,
      metadata: signal.metadata || {},
      created_at: signal.created_at || new Date().toISOString()
    }
  };
}

function normalizeNode(row) {
  const vaultType = normalizeVaultType(row.vault_type, row.category, row.node_type);
  const summary = row.summary || row.description || summarizeText(row.content) || fallbackSummary(vaultType);
  const weight = Number(row.weight);
  const trustScore = clampNumber(
    Number(row.trust_score ?? (Number.isFinite(weight) ? weight / 120 : 0.72)),
    0,
    1
  );
  const emergence = clampNumber(
    Number(row.emergence_level ?? (row.is_emerging ? 0.86 : Number.isFinite(weight) ? weight / 140 : 0.5)),
    0,
    1
  );

  return {
    id: String(row.id),
    vault_type: vaultType,
    title: row.title || fallbackTitle(vaultType),
    summary,
    recommendation_reason: row.recommendation_reason || buildReason(vaultType, trustScore, emergence),
    trust_score: trustScore,
    emergence_level: emergence,
    confidence: Math.round((trustScore * 0.65 + emergence * 0.35) * 100),
    source_refs: normalizeRefs(row.source_refs),
    scenario_tags: Array.isArray(row.scenario_tags) ? row.scenario_tags : [],
    language: row.language || 'bilingual',
    validation_count: Number(row.validation_count || 0),
    fork_count: Number(row.fork_count || 0),
    merge_count: Number(row.merge_count || 0),
    created_at: row.created_at || null
  };
}

function normalizeVaultType(vaultType, category = '', nodeType = '') {
  if (vaultType === 'tool' || vaultType === 'case' || vaultType === 'knowledge') return vaultType;
  if (nodeType === 'workflow') return 'tool';
  if (nodeType === 'case_study') return 'case';
  if (nodeType === 'prompt') return 'knowledge';

  const categoryText = String(category || '').toLowerCase();
  if (['tool', 'workflow', 'agent', 'sandbox'].some((term) => categoryText.includes(term))) return 'tool';
  if (['case', 'study', 'sop', 'example'].some((term) => categoryText.includes(term))) return 'case';
  return 'knowledge';
}

function normalizeRefs(value) {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      return [value];
    }
  }
  return [];
}

function filterNodes(nodes, query, locale) {
  const normalized = query.trim().toLowerCase();
  return nodes.filter((node) => {
    const localeMatch = locale === 'bilingual' || node.language === 'bilingual' || node.language === locale;
    if (!localeMatch) return false;
    if (!normalized) return true;
    const haystack = [
      node.title,
      node.summary,
      node.recommendation_reason,
      ...node.scenario_tags,
      ...node.source_refs
    ].join(' ').toLowerCase();
    return normalized.split(/\s+/).some((term) => haystack.includes(term));
  });
}

function filterFallbackNodes(query, locale) {
  return filterNodes(FALLBACK_NODES.map(normalizeNode), query, locale);
}

function buildSynthesis(query, results, locale) {
  const hasResults = results.knowledge.length || results.tools.length || results.cases.length;
  if (!hasResults) {
    return locale === 'en'
      ? 'No cross-vault route is available yet. Add validated nodes to expand retrieval coverage.'
      : '暂时没有匹配到跨库路径。继续沉淀已验证节点后，检索覆盖会自动扩大。';
  }

  if (locale === 'en') {
    return `For "${query || 'this scenario'}", start with the knowledge frame, select an executable tool route, then verify with case evidence.`;
  }

  return `针对“${query || '当前场景'}”，先调用知识库形成判断框架，再选择工具库里的执行路径，最后用案例库证据验证可行性。`;
}

function buildReason(vaultType, trustScore, emergence) {
  const score = Math.round((trustScore * 0.65 + emergence * 0.35) * 100);
  const labels = {
    knowledge: '适合作为判断框架和认知解释',
    tool: '适合作为可执行工具路径',
    case: '适合作为真实结果和证据链'
  };
  return `${labels[vaultType]}，综合可信度 ${score}。`;
}

function summarizeText(text) {
  if (text === null || text === undefined) return '';
  const raw = typeof text === 'string' ? text : JSON.stringify(text);
  const trimmed = raw.replace(/\s+/g, ' ').trim();
  return trimmed.length > 130 ? `${trimmed.slice(0, 130)}...` : trimmed;
}

function fallbackSummary(vaultType) {
  const summaries = {
    knowledge: '认知模型、原理解释、判断框架和边界条件。',
    tool: 'Agent、Prompt、自动化流程和工具组合。',
    case: 'Before/After、SOP 复盘和真实验证记录。'
  };
  return summaries[vaultType];
}

function fallbackTitle(vaultType) {
  const titles = {
    knowledge: '未命名知识节点',
    tool: '未命名工具节点',
    case: '未命名案例节点'
  };
  return titles[vaultType];
}

async function parseJson(request) {
  try {
    return await request.json();
  } catch {
    throw httpError(400, 'Request body must be valid JSON.');
  }
}

function defaultImpact(signalType) {
  const impact = {
    validated: 12,
    used: 6,
    forked: 8,
    commented: 3,
    merged: 24,
    disputed: -10
  };
  return impact[signalType] || 1;
}

function normalizeLocale(locale) {
  if (locale === 'zh' || locale === 'en') return locale;
  return 'bilingual';
}

function clampNumber(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function sanitizeOptionalString(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, 500) : null;
}

function sanitizeError(error) {
  const message = error && error.message ? String(error.message) : 'Unknown backend warning.';
  return message.slice(0, 220);
}

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders(),
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Max-Age': '86400'
  };
}
