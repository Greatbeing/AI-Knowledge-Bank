const pageType = document.body.dataset.page || 'knowledge';
const vaultKeyByPage = {
  knowledge: 'knowledge',
  tools: 'tools',
  cases: 'cases'
};

const dictionaries = {
  zh: {
    navKnowledge: '知识库',
    navTools: '工具库',
    navCases: '案例库',
    navCommunity: '社区',
    backHome: '首页',
    startLearning: '开始学习',
    toggle: 'EN',
    loading: '正在读取真实内容...',
    empty: '暂时没有可展示的内容',
    searchPlaceholder: '筛选当前页面内容',
    sourceAll: '全部来源',
    trustAll: '全部可信度',
    liveSource: '实时数据',
    trust: '可信度',
    resultLoading: '正在加载内容',
    resultUnavailable: '内容服务暂不可用',
    resultEmpty: '没有可展示的节点',
    resultNoMatch: '没有符合筛选条件的节点',
    dispatchKicker: 'CROSS-VAULT DISPATCH',
    dispatchTitle: '用一个场景调度知识、工具和案例',
    dispatchCopy: '输入你的目标或问题，系统会跨三库组合认知解释、执行路径和案例证据。',
    dispatchPlaceholder: '例如：跨境营销团队要优化 AI 本地化 SOP',
    dispatchRun: '运行调度',
    dispatchRunning: '正在跨三库检索与组合...',
    dispatchReady: '准备调度三库内容',
    dispatchFallback: 'API 暂不可用，已显示本地演示路径',
    dispatchNoResults: '没有匹配到跨库结果，已显示演示路径',
    dispatchKnowledge: '知识解释',
    dispatchTools: '工具路径',
    dispatchCases: '案例证据',
    dispatchSynthesis: '综合建议',
    dispatchSource: '来源',
    detailButton: '查看详情',
    detailSummary: '节点摘要',
    detailReason: '推荐理由',
    detailSources: '来源引用',
    detailScenarios: '适用场景',
    detailMetadata: '节点信息',
    validationResultTitle: '验证结果',
    validationModePersisted: '已写入后端',
    validationModeQueued: '演示队列',
    validationModeLocal: '本地演示',
    validationSignal: '信号类型',
    validationImpact: '影响权重',
    validationConfidence: '置信度',
    nodeCount: '节点',
    signalCount: '信号',
    routeCount: '路径',
    sourceSupabase: 'Supabase',
    sourceFallback: 'Demo',
    pageKickerKnowledge: 'KNOWLEDGE VAULT',
    pageTitleKnowledge: '知识库：沉淀可解释、可验证、可迁移的 AI 判断框架。',
    pageCopyKnowledge: '这里保存认知模型、原则、边界条件和判断框架。它回答“为什么这样做”，帮助用户在选择工具之前先看清场景结构。',
    sectionTitleKnowledge: '可复用认知节点',
    sectionCopyKnowledge: '这些节点来自 Supabase 三库内容，可被 Cross-Vault RAG 调度为解释层。',
    insightTitleKnowledge: '知识库如何工作',
    insightCopyKnowledge: '知识库不是文章目录，而是可被检索、引用和验证的判断资产。',
    pageKickerTools: 'TOOLS VAULT',
    pageTitleTools: '工具库：把有效方法变成可执行的 Agent、Prompt 和工作流。',
    pageCopyTools: '这里组织工具路径、自动化流程、Prompt 模板和组合方案。它回答“怎么做”，把知识库的判断框架转成可执行步骤。',
    sectionTitleTools: '可执行工具路径',
    sectionCopyTools: '这些工具节点可被调度引擎选中，组合成面向具体目标的执行路线。',
    insightTitleTools: '工具库如何工作',
    insightCopyTools: '工具库强调输入、步骤、质量标准和人工确认点，而不是只保存工具名称。',
    pageKickerCases: 'CASES VAULT',
    pageTitleCases: '案例库：用真实 Before/After 和证据链证明方法是否有效。',
    pageCopyCases: '这里保存真实场景、SOP 复盘、实验结果和可复用边界。它回答“在哪些场景有效”，让 AI 建议有证据。',
    sectionTitleCases: '真实验证案例',
    sectionCopyCases: '这些案例节点为 RAG 调度提供证据层，让建议不只停留在理论和流程。',
    insightTitleCases: '案例库如何工作',
    insightCopyCases: '案例库记录背景、做法、结果和限制，让成功经验能被迁移，也能被质疑。',
    pageKickerCommunity: 'COMMUNITY EVOLUTION',
    pageTitleCommunity: '社区：让验证、分叉、合并和信誉信号推动知识自然演化。',
    pageCopyCommunity: '社区不是简单点赞，而是把真实使用、验证、复用、争议和合并变成演化信号，帮助好方法成为公共标准。',
    sectionTitleCommunity: '可验证内容池',
    sectionCopyCommunity: '这里优先展示当前三库中可信度较高、适合继续验证和复用的节点。',
    insightTitleCommunity: '社区如何推动演化',
    insightCopyCommunity: '社区把个人实践转化为共同资产：先验证，再复用，再分叉，最后在证据足够时合并。',
    runValidation: '运行社区验证',
    validationReady: '准备接收社区验证信号',
    validationRunning: '正在写入验证信号...',
    validationPersisted: '验证信号已写入后端，节点演化权重已更新',
    validationQueued: '验证信号已进入演示队列',
    validationFailed: '后端暂不可用，已保留为本地演示状态',
    panelTitleCommunity: '实时验证信号',
    panelCopyCommunity: '点击后会向现有 Cloudflare API 提交一次社区验证信号，用来模拟内容从个人经验进入公共演化循环。',
    footer: 'AI Knowledge Bank：AI 时代的公共知识银行。'
  },
  en: {
    navKnowledge: 'Knowledge',
    navTools: 'Tools',
    navCases: 'Cases',
    navCommunity: 'Community',
    backHome: 'Home',
    startLearning: 'Start Learning',
    toggle: '中',
    loading: 'Loading real content...',
    empty: 'No content is available yet',
    searchPlaceholder: 'Filter this page',
    sourceAll: 'All sources',
    trustAll: 'All trust levels',
    liveSource: 'Live data',
    trust: 'Trust',
    resultLoading: 'Loading content',
    resultUnavailable: 'Content service is unavailable',
    resultEmpty: 'No nodes are available',
    resultNoMatch: 'No nodes match the filters',
    dispatchKicker: 'CROSS-VAULT DISPATCH',
    dispatchTitle: 'Dispatch one scenario across knowledge, tools, and cases',
    dispatchCopy: 'Enter a goal or question to combine cognitive framing, execution route, and case evidence.',
    dispatchPlaceholder: 'Example: improve an AI localization SOP for a cross-border marketing team',
    dispatchRun: 'Run Dispatch',
    dispatchRunning: 'Searching and composing across the three vaults...',
    dispatchReady: 'Ready to dispatch across the three vaults',
    dispatchFallback: 'API unavailable; showing a local demo route',
    dispatchNoResults: 'No matching cross-vault result; showing a demo route',
    dispatchKnowledge: 'Knowledge Frame',
    dispatchTools: 'Tool Route',
    dispatchCases: 'Case Evidence',
    dispatchSynthesis: 'Synthesis',
    dispatchSource: 'Source',
    detailButton: 'View details',
    detailSummary: 'Node summary',
    detailReason: 'Recommendation reason',
    detailSources: 'Source references',
    detailScenarios: 'Scenarios',
    detailMetadata: 'Node metadata',
    validationResultTitle: 'Validation Result',
    validationModePersisted: 'Persisted to backend',
    validationModeQueued: 'Demo queue',
    validationModeLocal: 'Local demo',
    validationSignal: 'Signal type',
    validationImpact: 'Impact weight',
    validationConfidence: 'Confidence',
    nodeCount: 'Nodes',
    signalCount: 'Signals',
    routeCount: 'Routes',
    sourceSupabase: 'Supabase',
    sourceFallback: 'Demo',
    pageKickerKnowledge: 'KNOWLEDGE VAULT',
    pageTitleKnowledge: 'Knowledge Vault: explainable, verifiable, transferable AI judgment frames.',
    pageCopyKnowledge: 'This vault stores cognitive models, principles, boundary conditions, and decision frames. It answers why a method works before users choose tools.',
    sectionTitleKnowledge: 'Reusable Knowledge Nodes',
    sectionCopyKnowledge: 'These nodes come from Supabase vault content and can be dispatched by Cross-Vault RAG as the explanation layer.',
    insightTitleKnowledge: 'How the Knowledge Vault Works',
    insightCopyKnowledge: 'The vault is not an article directory. It is a set of judgment assets that can be retrieved, cited, and validated.',
    pageKickerTools: 'TOOLS VAULT',
    pageTitleTools: 'Tools Vault: turn effective methods into executable agents, prompts, and workflows.',
    pageCopyTools: 'This vault organizes tool routes, automation flows, prompt templates, and combinations. It answers how to execute a goal.',
    sectionTitleTools: 'Executable Tool Routes',
    sectionCopyTools: 'These tool nodes can be selected by the dispatch engine and assembled into concrete execution paths.',
    insightTitleTools: 'How the Tools Vault Works',
    insightCopyTools: 'The vault focuses on inputs, steps, quality bars, and human checkpoints instead of only saving tool names.',
    pageKickerCases: 'CASES VAULT',
    pageTitleCases: 'Cases Vault: prove what works through real before/after evidence.',
    pageCopyCases: 'This vault stores scenarios, SOP reviews, experiment results, and reuse boundaries. It answers where a method works.',
    sectionTitleCases: 'Validated Case Evidence',
    sectionCopyCases: 'These case nodes provide the evidence layer for RAG dispatch, keeping recommendations grounded in outcomes.',
    insightTitleCases: 'How the Cases Vault Works',
    insightCopyCases: 'The vault records context, action, result, and limits so success can be transferred and challenged.',
    pageKickerCommunity: 'COMMUNITY EVOLUTION',
    pageTitleCommunity: 'Community: validation, forks, merges, and reputation signals evolve knowledge.',
    pageCopyCommunity: 'Community is not a like counter. Real usage, validation, reuse, disputes, and merges become evolution signals that help strong methods become shared standards.',
    sectionTitleCommunity: 'Validation Pool',
    sectionCopyCommunity: 'This pool surfaces high-trust nodes from the three vaults that are ready for further validation and reuse.',
    insightTitleCommunity: 'How Community Drives Evolution',
    insightCopyCommunity: 'Community turns individual practice into shared assets: validate, reuse, fork, then merge when evidence is strong.',
    runValidation: 'Run Community Validation',
    validationReady: 'Ready to receive a community validation signal',
    validationRunning: 'Writing validation signal...',
    validationPersisted: 'Validation signal written to backend; node evolution weight updated',
    validationQueued: 'Validation signal entered the demo queue',
    validationFailed: 'Backend unavailable; kept as local demo state',
    panelTitleCommunity: 'Live Validation Signal',
    panelCopyCommunity: 'This sends one community validation signal to the existing Cloudflare API and simulates how personal practice enters the shared evolution loop.',
    footer: 'AI Knowledge Bank: Where AI experience grows together.'
  }
};

const insights = {
  zh: {
    knowledge: [
      ['场景边界', '先定义目标、输入、约束和验证方式，避免 AI 实践直接从工具开始。'],
      ['判断框架', '把经验整理成可解释结构，让不同团队能理解同一个方法为什么成立。'],
      ['可信引用', '每个知识节点都应保留来源、适用场景和过期复审条件。']
    ],
    tools: [
      ['输入契约', '明确工具需要什么数据、权限、样例和上下文。'],
      ['执行步骤', '把 Prompt、Agent、人工确认点和质量检查串成稳定流程。'],
      ['复用边界', '说明适用和不适用条件，避免把一次成功误用到所有场景。']
    ],
    cases: [
      ['Before/After', '保留使用前后的状态、指标和人工复核结论。'],
      ['证据链', '用真实结果支撑方法，而不是只写主观评价。'],
      ['迁移条件', '记录行业、团队、数据和流程限制，帮助他人判断能否复用。']
    ]
  },
  en: {
    knowledge: [
      ['Scenario Boundary', 'Define goals, inputs, constraints, and validation before jumping into tools.'],
      ['Decision Frame', 'Turn practice into explainable structure so teams understand why a method works.'],
      ['Trusted References', 'Each node should keep sources, scenarios, and review conditions.']
    ],
    tools: [
      ['Input Contract', 'Clarify required data, permissions, examples, and context.'],
      ['Execution Steps', 'Connect prompts, agents, human checkpoints, and quality checks into a stable flow.'],
      ['Reuse Boundary', 'State where the route works and where it should not be reused.']
    ],
    cases: [
      ['Before/After', 'Keep the state, metrics, and human review before and after use.'],
      ['Evidence Chain', 'Support methods with real outcomes instead of subjective praise.'],
      ['Transfer Conditions', 'Record industry, team, data, and process limits for reuse decisions.']
    ]
  }
};

const communitySignals = {
  zh: [
    ['验证', '提交真实结果、证据链接和置信度，让节点获得可信增量。'],
    ['使用', '记录一次被采用的场景，帮助系统识别高复用方法。'],
    ['分叉', '把方法适配到新行业、新角色或新约束，形成场景分支。'],
    ['合并', '当分支验证足够强，社区可把它提升为新的公共版本。'],
    ['争议', '标记证据不足、过期或高风险实践，阻止错误经验进入主干。'],
    ['衰减', '过时内容自然降权，避免旧方法长期占据推荐位置。']
  ],
  en: [
    ['Validation', 'Submit real outcomes, evidence links, and confidence to increase trust.'],
    ['Usage', 'Record adoption in a concrete scenario so reusable methods can surface.'],
    ['Fork', 'Adapt a method to a new industry, role, or constraint as a scenario branch.'],
    ['Merge', 'Promote a branch into a shared version when validation is strong enough.'],
    ['Dispute', 'Flag weak evidence, outdated practice, or high-risk methods.'],
    ['Decay', 'Reduce weight for outdated content so old methods do not dominate.']
  ]
};

const dispatchLayers = ['knowledge', 'tools', 'cases'];
const dispatchLabelKeys = {
  knowledge: 'dispatchKnowledge',
  tools: 'dispatchTools',
  cases: 'dispatchCases'
};
const dispatchFallbackCatalog = {
  zh: {
    query: '跨境营销团队要优化 AI 本地化 SOP',
    synthesis: '先用知识库定义本地化判断框架，再选择工具库里的评审 Agent 链，最后用案例库的 Before/After 证据验证 SOP 是否可迁移。',
    results: {
      knowledge: [{
        title: '本地化判断框架',
        summary: '拆分语言、文化、渠道和合规四类变量，先判断任务边界，再决定 AI 介入方式。',
        confidence: 91
      }],
      tools: [{
        title: '翻译评审 Agent 链',
        summary: '生成、校验、风格统一、风险标注四步联动，让人工审核集中在高风险内容。',
        confidence: 86
      }],
      cases: [{
        title: '拉美素材复用案例',
        summary: '复用 37 条广告素材，并用点击率和人工复审记录验证本地化 SOP 的有效性。',
        confidence: 83
      }]
    }
  },
  en: {
    query: 'Improve an AI localization SOP for a cross-border marketing team',
    synthesis: 'Start with a localization decision frame, select an agent review chain, then verify transferability with before/after case evidence.',
    results: {
      knowledge: [{
        title: 'Localization Decision Frame',
        summary: 'Separate language, culture, channel, and compliance variables before deciding where AI should assist.',
        confidence: 91
      }],
      tools: [{
        title: 'Translation Review Agent Chain',
        summary: 'Connect generation, validation, style alignment, and risk tagging so human review focuses on high-risk content.',
        confidence: 86
      }],
      cases: [{
        title: 'LATAM Creative Reuse Case',
        summary: 'Reuse 37 ad creatives and validate the localization SOP with click-through data and human review records.',
        confidence: 83
      }]
    }
  }
};

let currentLanguage = ['zh', 'en'].includes(localStorage.getItem('language'))
  ? localStorage.getItem('language')
  : 'zh';
let latestNodes = [];
let latestSource = 'fallback';
let loadState = 'loading';
let latestDispatchPayload = null;
let latestDispatchSource = 'fallback';
let latestDispatchQuery = '';
let dispatchHasRun = false;

const languageToggle = document.getElementById('language-toggle');
const nodeGrid = document.getElementById('node-grid');
const searchInput = document.getElementById('page-search');
const sourceFilter = document.getElementById('source-filter');
const trustFilter = document.getElementById('trust-filter');
const resultStatus = document.getElementById('result-status');
const detailPanel = document.getElementById('detail-panel');
const detailContent = document.getElementById('detail-content');
const validationResult = document.getElementById('validation-result');
const statusLine = document.getElementById('status-line');
const runValidationButton = document.getElementById('run-validation');
const dispatchForm = document.getElementById('dispatch-form');
const dispatchQuery = document.getElementById('dispatch-query');
const dispatchRunButton = document.getElementById('dispatch-run');
const dispatchStatus = document.getElementById('dispatch-status');
const dispatchResults = document.getElementById('dispatch-results');

function resolveApiBase() {
  if (window.location.hostname.endsWith('github.io') || window.location.protocol === 'file:') {
    return 'https://aiknowledgebank.pages.dev/api';
  }

  return `${window.location.origin}/api`;
}

const apiBase = resolveApiBase();

async function fetchApi(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (options.body) headers['Content-Type'] = 'application/json';

  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers
  });

  if (!response.ok) throw new Error(`API request failed with ${response.status}`);
  return response.json();
}

function pageSuffix() {
  return pageType.charAt(0).toUpperCase() + pageType.slice(1);
}

function applyLanguage(lang) {
  currentLanguage = lang;
  localStorage.setItem('language', lang);
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';

  const dict = dictionaries[lang];
  const suffix = pageSuffix();

  document.querySelectorAll('[data-i18n]').forEach((element) => {
    const key = element.dataset.i18n;
    if (dict[key]) element.textContent = dict[key];
  });

  document.querySelectorAll('[data-page-i18n]').forEach((element) => {
    const key = `${element.dataset.pageI18n}${suffix}`;
    if (dict[key]) element.textContent = dict[key];
  });

  if (searchInput) searchInput.placeholder = dict.searchPlaceholder;
  if (dispatchQuery) {
    dispatchQuery.placeholder = dict.dispatchPlaceholder;
    if (!dispatchQuery.value.trim()) dispatchQuery.value = latestDispatchQuery || getDefaultDispatchQuery();
  }
  if (languageToggle) languageToggle.textContent = dict.toggle;
  if (statusLine) statusLine.textContent = dict.validationReady;

  renderInsights();
  renderCommunitySignals();
  renderNodes(latestNodes);
  renderCurrentDispatch();
}

function renderInsights() {
  const grid = document.getElementById('insight-grid');
  if (!grid || pageType === 'community') return;

  const entries = insights[currentLanguage][pageType] || [];
  grid.replaceChildren(...entries.map(([titleText, copyText]) => {
    const card = document.createElement('article');
    card.className = 'insight-card';

    const title = document.createElement('h3');
    title.textContent = titleText;

    const copy = document.createElement('p');
    copy.textContent = copyText;

    card.append(title, copy);
    return card;
  }));
}

function renderCommunitySignals() {
  const grid = document.getElementById('signal-grid');
  if (!grid || pageType !== 'community') return;

  const entries = communitySignals[currentLanguage];
  grid.replaceChildren(...entries.map(([titleText, copyText]) => {
    const card = document.createElement('article');
    card.className = 'signal-card';

    const title = document.createElement('h3');
    title.textContent = titleText;

    const copy = document.createElement('p');
    copy.textContent = copyText;

    card.append(title, copy);
    return card;
  }));
}

function updateMetrics(stats = {}) {
  const nodeCount = document.getElementById('metric-nodes');
  const routeCount = document.getElementById('metric-routes');
  const signalCount = document.getElementById('metric-signals');
  const pageCount = latestNodes.length || Number(stats.total || 0);

  if (nodeCount) nodeCount.textContent = pageType === 'community' ? Number(stats.total || 0).toLocaleString() : pageCount.toLocaleString();
  if (routeCount) routeCount.textContent = Math.max(pageCount * 2, 6).toLocaleString();
  if (signalCount) signalCount.textContent = Math.max(pageCount * 8, 18).toLocaleString();
}

async function loadPageData() {
  loadState = 'loading';
  if (nodeGrid) {
    nodeGrid.replaceChildren(createEmptyCard(dictionaries[currentLanguage].loading));
  }
  updateResultStatus(0, 0);

  try {
    const data = await fetchApi(`/vaults?locale=${currentLanguage}`);
    loadState = 'ready';
    latestSource = data.source || 'fallback';

    if (pageType === 'community') {
      const allNodes = [
        ...(data.vaults?.knowledge || []),
        ...(data.vaults?.tools || []),
        ...(data.vaults?.cases || [])
      ];
      latestNodes = allNodes
        .slice()
        .sort((a, b) => Number(b.confidence || 0) - Number(a.confidence || 0))
        .slice(0, 6);
    } else {
      latestNodes = data.vaults?.[vaultKeyByPage[pageType]] || [];
    }

    updateMetrics(data.stats || {});
    renderNodes(latestNodes);
  } catch {
    loadState = 'unavailable';
    latestNodes = [];
    updateMetrics();
    renderNodes([]);
  }
}

function renderNodes(nodes) {
  if (!nodeGrid) return;
  const query = (searchInput?.value || '').trim().toLowerCase();
  const selectedSource = sourceFilter?.value || 'all';
  const minimumTrust = Number(trustFilter?.value || 0);
  const filtered = nodes.filter((node) => {
    const matchesSource = selectedSource === 'all' || latestSource === selectedSource;
    const matchesTrust = Number(node.confidence || 0) >= minimumTrust;
    const matchesQuery = !query || collectNodeText(node).includes(query);
    return matchesSource && matchesTrust && matchesQuery;
  });

  if (!filtered.length) {
    nodeGrid.replaceChildren(createEmptyCard(dictionaries[currentLanguage].empty));
    updateResultStatus(0, nodes.length);
    return;
  }

  nodeGrid.replaceChildren(...filtered.map(createNodeCard));
  updateResultStatus(filtered.length, nodes.length);
}

function collectNodeText(node) {
  return [
    node.title,
    node.summary,
    node.recommendation_reason,
    node.vault_type,
    ...normalizeList(node.source_refs),
    ...normalizeList(node.scenario_tags)
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function updateResultStatus(shown, total) {
  if (!resultStatus) return;

  const dict = dictionaries[currentLanguage];
  const sourceName = latestSource === 'supabase' ? dict.sourceSupabase : dict.sourceFallback;

  if (loadState === 'loading') {
    resultStatus.textContent = dict.resultLoading;
    return;
  }

  if (loadState === 'unavailable') {
    resultStatus.textContent = dict.resultUnavailable;
    return;
  }

  if (!total) {
    resultStatus.textContent = dict.resultEmpty;
    return;
  }

  if (!shown) {
    resultStatus.textContent = `${dict.resultNoMatch} · ${dict.liveSource}: ${sourceName}`;
    return;
  }

  resultStatus.textContent = currentLanguage === 'zh'
    ? `显示 ${shown}/${total} 个节点 · ${dict.liveSource}: ${sourceName}`
    : `Showing ${shown}/${total} nodes · ${dict.liveSource}: ${sourceName}`;
}

function getDefaultDispatchQuery() {
  return dispatchFallbackCatalog[currentLanguage].query;
}

function buildFallbackDispatch(query) {
  const fallback = dispatchFallbackCatalog[currentLanguage];
  return {
    ok: true,
    query: query || fallback.query,
    source: 'fallback',
    results: fallback.results,
    synthesis: fallback.synthesis
  };
}

function hasDispatchResults(payload) {
  return dispatchLayers.some((layer) => {
    return Array.isArray(payload?.results?.[layer]) && payload.results[layer].length > 0;
  });
}

function renderCurrentDispatch() {
  if (!dispatchResults) return;

  const query = dispatchQuery?.value.trim() || latestDispatchQuery || getDefaultDispatchQuery();
  if (!latestDispatchPayload || latestDispatchSource === 'fallback') {
    renderDispatchPayload(buildFallbackDispatch(query), 'fallback');
    if (!dispatchHasRun && dispatchStatus) {
      dispatchStatus.textContent = dictionaries[currentLanguage].dispatchReady;
    }
    return;
  }

  renderDispatchPayload(latestDispatchPayload, latestDispatchSource);
}

function renderDispatchPayload(payload, source = payload?.source || 'fallback') {
  if (!dispatchResults) return;

  latestDispatchPayload = payload;
  latestDispatchSource = source;
  latestDispatchQuery = payload?.query || latestDispatchQuery || getDefaultDispatchQuery();

  dispatchLayers.forEach((layer) => {
    renderDispatchResult(layer, payload?.results?.[layer]?.[0], source);
  });

  if (dispatchStatus) {
    const synthesis = payload?.synthesis || dispatchFallbackCatalog[currentLanguage].synthesis;
    dispatchStatus.textContent = `${dictionaries[currentLanguage].dispatchSynthesis}: ${synthesis}`;
  }
}

function renderDispatchResult(layer, item, source) {
  const card = dispatchResults?.querySelector(`[data-dispatch-layer="${layer}"]`);
  if (!card) return;

  const dict = dictionaries[currentLanguage];
  const sourceName = source === 'supabase' ? dict.sourceSupabase : dict.sourceFallback;
  const confidence = Math.max(0, Number(item?.confidence || 0));

  const label = document.createElement('span');
  label.className = 'card-label';
  label.textContent = dict[dispatchLabelKeys[layer]];

  const title = document.createElement('h3');
  title.textContent = item?.title || dict.dispatchNoResults;

  const summary = document.createElement('p');
  summary.textContent = item?.summary || item?.recommendation_reason || dict.dispatchNoResults;

  const meta = document.createElement('div');
  meta.className = 'dispatch-result-meta';
  meta.append(createTag(`${dict.dispatchSource}: ${sourceName}`));
  if (confidence) meta.append(createTag(`${dict.trust} ${confidence}%`));

  card.replaceChildren(label, title, summary, meta);
}

async function runCrossVaultDispatch(query) {
  if (!dispatchResults) return;

  const dict = dictionaries[currentLanguage];
  const nextQuery = (query || '').trim() || getDefaultDispatchQuery();
  dispatchHasRun = true;
  latestDispatchQuery = nextQuery;
  if (dispatchQuery) dispatchQuery.value = nextQuery;
  if (dispatchRunButton) dispatchRunButton.disabled = true;
  if (dispatchStatus) dispatchStatus.textContent = dict.dispatchRunning;

  try {
    const payload = await fetchApi(`/search?q=${encodeURIComponent(nextQuery)}&locale=${currentLanguage}&limit=1`);
    if (!payload?.ok || !hasDispatchResults(payload)) {
      const fallback = buildFallbackDispatch(nextQuery);
      renderDispatchPayload(fallback, 'fallback');
      if (dispatchStatus) dispatchStatus.textContent = `${dict.dispatchNoResults}: ${fallback.synthesis}`;
      return;
    }

    renderDispatchPayload(payload, payload.source || 'fallback');
  } catch {
    const fallback = buildFallbackDispatch(nextQuery);
    renderDispatchPayload(fallback, 'fallback');
    if (dispatchStatus) dispatchStatus.textContent = `${dict.dispatchFallback}: ${fallback.synthesis}`;
  } finally {
    if (dispatchRunButton) dispatchRunButton.disabled = false;
  }
}

function createNodeCard(node) {
  const dict = dictionaries[currentLanguage];
  const article = document.createElement('article');
  article.className = 'content-card';

  const top = document.createElement('div');
  top.className = 'card-top';

  const label = document.createElement('span');
  label.className = 'card-label';
  label.textContent = vaultLabel(node.vault_type);

  const trust = document.createElement('span');
  trust.className = 'trust-badge';
  trust.textContent = `${dict.trust} ${Math.max(0, Number(node.confidence || 0))}%`;

  top.append(label, trust);

  const title = document.createElement('h3');
  title.textContent = node.title || vaultLabel(node.vault_type);

  const summary = document.createElement('p');
  summary.textContent = node.summary || '';

  const reason = document.createElement('p');
  reason.className = 'reason';
  reason.textContent = node.recommendation_reason || '';

  const tagRow = document.createElement('div');
  tagRow.className = 'tag-row';
  tagRow.append(createTag(`${dict.liveSource}: ${latestSource === 'supabase' ? dict.sourceSupabase : dict.sourceFallback}`));
  (node.scenario_tags || []).slice(0, 3).forEach((tag) => tagRow.append(createTag(tag)));

  const actions = document.createElement('div');
  actions.className = 'card-actions';

  const detailButton = document.createElement('button');
  detailButton.className = 'detail-button';
  detailButton.type = 'button';
  detailButton.textContent = dict.detailButton;
  detailButton.addEventListener('click', () => openDetail(node));
  actions.append(detailButton);

  article.append(top, title, summary);
  if (reason.textContent && reason.textContent !== summary.textContent) article.append(reason);
  article.append(tagRow, actions);
  return article;
}

function createTag(text) {
  const tag = document.createElement('span');
  tag.className = 'tag';
  tag.textContent = text;
  return tag;
}

function normalizeList(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value !== 'string' || !value.trim()) return [];

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map((item) => String(item).trim()).filter(Boolean);
  } catch {
    // Keep plain strings usable below.
  }

  return value.split(/[,，]/).map((item) => item.trim()).filter(Boolean);
}

function createDetailSection(titleText, content) {
  const section = document.createElement('section');
  section.className = 'detail-section';

  const title = document.createElement('h3');
  title.textContent = titleText;
  section.append(title);

  const listItems = Array.isArray(content) ? content.filter(Boolean) : [];
  if (listItems.length) {
    const list = document.createElement('ul');
    listItems.forEach((item) => {
      const listItem = document.createElement('li');
      listItem.textContent = item;
      list.append(listItem);
    });
    section.append(list);
    return section;
  }

  const copy = document.createElement('p');
  copy.textContent = content || '-';
  section.append(copy);
  return section;
}

function openDetail(node) {
  if (!detailPanel || !detailContent) return;

  const dict = dictionaries[currentLanguage];
  const sourceRefs = normalizeList(node.source_refs);
  const scenarioTags = normalizeList(node.scenario_tags);
  const sourceName = latestSource === 'supabase' ? dict.sourceSupabase : dict.sourceFallback;
  const confidence = `${dict.trust} ${Math.max(0, Number(node.confidence || 0))}%`;

  const header = document.createElement('header');
  header.className = 'detail-header';

  const label = document.createElement('span');
  label.className = 'card-label';
  label.textContent = vaultLabel(node.vault_type);

  const title = document.createElement('h2');
  title.id = 'detail-title';
  title.textContent = node.title || vaultLabel(node.vault_type);

  const meta = document.createElement('div');
  meta.className = 'detail-meta';
  meta.append(createTag(`${dict.liveSource}: ${sourceName}`), createTag(confidence));
  if (node.created_at) {
    meta.append(createTag(new Date(node.created_at).toLocaleDateString(currentLanguage === 'zh' ? 'zh-CN' : 'en-US')));
  }

  header.append(label, title, meta);

  const tagGroup = document.createElement('div');
  tagGroup.className = 'detail-tags';
  scenarioTags.forEach((tag) => tagGroup.append(createTag(tag)));

  const metadata = [
    `ID: ${node.id || '-'}`,
    `${dict.liveSource}: ${sourceName}`,
    confidence
  ];

  detailContent.replaceChildren(
    header,
    createDetailSection(dict.detailSummary, node.summary || ''),
    createDetailSection(dict.detailReason, node.recommendation_reason || ''),
    createDetailSection(dict.detailSources, sourceRefs.length ? sourceRefs : ['AI Knowledge Bank']),
    tagGroup,
    createDetailSection(dict.detailMetadata, metadata)
  );

  detailPanel.classList.add('is-open');
  detailPanel.setAttribute('aria-hidden', 'false');
  document.body.classList.add('detail-open');
  detailPanel.querySelector('.detail-close')?.focus();
}

function closeDetail() {
  if (!detailPanel) return;
  detailPanel.classList.remove('is-open');
  detailPanel.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('detail-open');
}

function createEmptyCard(text) {
  const empty = document.createElement('div');
  empty.className = 'empty-card';
  empty.textContent = text;
  return empty;
}

function vaultLabel(vaultType) {
  const dict = dictionaries[currentLanguage];
  if (vaultType === 'tool') return dict.navTools;
  if (vaultType === 'case') return dict.navCases;
  return dict.navKnowledge;
}

async function submitCommunityValidation() {
  if (!runValidationButton || !statusLine) return;

  runValidationButton.disabled = true;
  statusLine.classList.remove('is-hot');
  statusLine.textContent = dictionaries[currentLanguage].validationRunning;
  if (validationResult) validationResult.replaceChildren();

  try {
    const result = await fetchApi('/community-signals', {
      method: 'POST',
      body: JSON.stringify({
        node_id: latestNodes[0]?.id || null,
        signal_type: 'validated',
        impact_delta: 12,
        confidence: 0.86,
        metadata: {
          page: pageType,
          language: currentLanguage,
          source: 'community-page'
        }
      })
    });

    statusLine.textContent = result.persisted
      ? dictionaries[currentLanguage].validationPersisted
      : dictionaries[currentLanguage].validationQueued;
    renderValidationResult(result);
  } catch {
    statusLine.textContent = dictionaries[currentLanguage].validationFailed;
    renderValidationResult({
      ok: true,
      persisted: false,
      source: 'fallback',
      signal: {
        signal_type: 'validated',
        impact_delta: 12,
        confidence: 0.86,
        weighted_impact: 10.32
      }
    });
  } finally {
    statusLine.classList.add('is-hot');
    window.setTimeout(() => {
      runValidationButton.disabled = false;
    }, 900);
  }
}

function renderValidationResult(result) {
  if (!validationResult) return;

  const dict = dictionaries[currentLanguage];
  const signal = result?.signal || {};
  const mode = result?.persisted
    ? dict.validationModePersisted
    : result?.source === 'fallback'
      ? dict.validationModeLocal
      : dict.validationModeQueued;

  const title = document.createElement('h4');
  title.textContent = dict.validationResultTitle;

  const rows = document.createElement('dl');
  rows.append(
    createValidationRow(dict.liveSource, mode),
    createValidationRow(dict.validationSignal, signal.signal_type || 'validated'),
    createValidationRow(dict.validationImpact, String(signal.weighted_impact ?? signal.impact_delta ?? 0)),
    createValidationRow(dict.validationConfidence, `${Math.round(Number(signal.confidence || 0) * 100)}%`)
  );

  validationResult.replaceChildren(title, rows);
}

function createValidationRow(labelText, valueText) {
  const term = document.createElement('dt');
  term.textContent = labelText;

  const value = document.createElement('dd');
  value.textContent = valueText;

  const fragment = document.createDocumentFragment();
  fragment.append(term, value);
  return fragment;
}

function initParticles() {
  const canvas = document.getElementById('network-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const pointer = { x: null, y: null };
  let particles = [];

  function resizeCanvas() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(window.innerWidth * ratio);
    canvas.height = Math.floor(window.innerHeight * ratio);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    createParticles();
  }

  function createParticles() {
    const area = window.innerWidth * window.innerHeight;
    const count = Math.max(42, Math.min(110, Math.floor(area / 16000)));
    const palette = ['#0f9f8e', '#2563eb', '#d3912c', '#d96a43', '#6d5bd0'];
    particles = Array.from({ length: count }, (_, index) => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.28,
      vy: (Math.random() - 0.5) * 0.28,
      size: Math.random() * 2.1 + 0.8,
      color: palette[index % palette.length]
    }));
  }

  function drawNetwork() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    particles.forEach((particle, index) => {
      particle.x += particle.vx;
      particle.y += particle.vy;

      if (particle.x < -20) particle.x = window.innerWidth + 20;
      if (particle.x > window.innerWidth + 20) particle.x = -20;
      if (particle.y < -20) particle.y = window.innerHeight + 20;
      if (particle.y > window.innerHeight + 20) particle.y = -20;

      for (let next = index + 1; next < particles.length; next += 1) {
        const other = particles[next];
        const dx = particle.x - other.x;
        const dy = particle.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 150) {
          const opacity = (1 - distance / 150) * 0.18;
          ctx.strokeStyle = `rgba(17, 24, 39, ${opacity})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(other.x, other.y);
          ctx.stroke();
        }
      }

      if (pointer.x !== null) {
        const dx = particle.x - pointer.x;
        const dy = particle.y - pointer.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 210) {
          const opacity = (1 - distance / 210) * 0.35;
          ctx.strokeStyle = `rgba(15, 159, 142, ${opacity})`;
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(pointer.x, pointer.y);
          ctx.stroke();
        }
      }

      ctx.globalAlpha = 0.62;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    requestAnimationFrame(drawNetwork);
  }

  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('pointermove', (event) => {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
  });
  window.addEventListener('pointerleave', () => {
    pointer.x = null;
    pointer.y = null;
  });

  resizeCanvas();
  drawNetwork();
}

dispatchForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  runCrossVaultDispatch(dispatchQuery?.value || '');
});

languageToggle?.addEventListener('click', () => {
  applyLanguage(currentLanguage === 'zh' ? 'en' : 'zh');
  loadPageData();
});

searchInput?.addEventListener('input', () => renderNodes(latestNodes));
sourceFilter?.addEventListener('change', () => renderNodes(latestNodes));
trustFilter?.addEventListener('change', () => renderNodes(latestNodes));
runValidationButton?.addEventListener('click', submitCommunityValidation);
document.querySelectorAll('[data-detail-close]').forEach((element) => {
  element.addEventListener('click', closeDetail);
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeDetail();
});

document.querySelectorAll('[data-nav]').forEach((link) => {
  link.classList.toggle('is-active', link.dataset.nav === pageType);
});

applyLanguage(currentLanguage);
loadPageData();
initParticles();
