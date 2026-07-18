import { buildCommunitySignalRequest, fetchApi } from '../lib/shared/api.js';

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
    startLearning: '运行调度',
    toggle: 'EN',
    loading: '正在读取已发布节点...',
    empty: '这里还没有已发布节点',
    searchPlaceholder: '筛选本页节点',
    sourceAll: '全部数据来源',
    trustAll: '全部可信度',
    liveSource: '实时数据',
    trust: '可信度',
    resultLoading: '正在读取节点',
    resultUnavailable: '暂时无法读取节点，请稍后再试',
    resultEmpty: '这里还没有已发布节点',
    resultNoMatch: '没有符合筛选条件的节点',
    dispatchKicker: '跨库调度',
    dispatchTitle: '从一个问题，找到解释、路径和证据。',
    dispatchCopy: '输入你的目标，系统会跨三库返回知识解释、执行路径和真实案例。',
    dispatchPlaceholder: '例如：跨境营销团队要优化 AI 本地化 SOP',
    dispatchRun: '查找三层结果',
    dispatchRunning: '正在检索知识、工具和案例...',
    dispatchReady: '输入一个真实问题，开始跨库查找',
    dispatchFallback: '实时服务暂不可用，当前显示本地演示结果',
    dispatchNoResults: '没有匹配结果，当前显示本地演示结果',
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
    pageKickerKnowledge: '知识库 / Knowledge',
    pageTitleKnowledge: '先理解为什么，再决定用什么。',
    pageCopyKnowledge: '这里保存可解释的原则、判断框架和边界条件。每个节点都应说明适用场景、证据来源和需要重新验证的条件。',
    sectionTitleKnowledge: '可解释的判断节点',
    sectionCopyKnowledge: '从真实三库中读取知识节点，作为跨库调度的解释层。',
    insightTitleKnowledge: '判断框架如何获得可信度',
    insightCopyKnowledge: '它必须说清问题边界、推理依据、适用条件和复审时机。',
    pageKickerTools: '工具库 / Tools',
    pageTitleTools: '把有效方法，变成可以重复执行的路径。',
    pageCopyTools: '这里组织 Agent、Prompt、工作流和人工确认点。工具节点不仅告诉你用什么，也说明输入、步骤、质量标准和复用边界。',
    sectionTitleTools: '可执行的方法节点',
    sectionCopyTools: '这些节点可以被调度并组合成面向具体目标的执行路线。',
    insightTitleTools: '方法如何变成可复用流程',
    insightCopyTools: '把输入契约、执行步骤、人工判断和质量标准放在同一条路径里。',
    pageKickerCases: '案例库 / Cases',
    pageTitleCases: '用真实结果，判断一种方法能否迁移。',
    pageCopyCases: '这里记录背景、做法、Before/After、结果与限制。案例不是成功展示，而是帮助你判断“在什么条件下有效”。',
    sectionTitleCases: '可追溯的案例证据',
    sectionCopyCases: '这些节点为跨库调度提供证据层，让建议可以被核对。',
    insightTitleCases: '案例如何成为证据',
    insightCopyCases: '保留上下文、过程、结果、限制和人工复核，才有迁移价值。',
    pageKickerCommunity: '社区 / Community',
    pageTitleCommunity: '知识的可信度，来自一次次真实使用。',
    pageCopyCommunity: '验证、复用、分叉、合并、争议和衰减共同构成演化信号。社区不负责制造热度，而是帮助可靠方法进入公共主干。',
    sectionTitleCommunity: '等待进一步验证的节点',
    sectionCopyCommunity: '这里优先展示适合继续使用、质疑和补充证据的三库节点。',
    insightTitleCommunity: '实践如何进入公共主干',
    insightCopyCommunity: '先提交证据，再由不同场景复用和分叉；只有信号足够强，分支才会合并。',
    runValidation: '验证当前节点',
    validationReady: '选择一个节点并提交你的真实使用结果。',
    validationRunning: '正在验证会话并提交信号...',
    validationPersisted: '验证已记录，并计入节点的社区信号。',
    validationQueued: '演示验证已在本地完成，不会写入数据库。',
    validationFailed: '暂时无法提交验证，请稍后再试。',
    validationAuthRequired: '登录后才能验证真实节点；演示节点仍可在本地体验。',
    panelTitleCommunity: '提交一次真实验证',
    panelCopyCommunity: '真实节点会以当前登录用户的身份写入；演示节点只在本地模拟，不会写入数据库。',
    footer: 'AI Knowledge Bank：使用被验证的方法，也为下一版本贡献证据。'
  },
  en: {
    navKnowledge: 'Knowledge',
    navTools: 'Tools',
    navCases: 'Cases',
    navCommunity: 'Community',
    backHome: 'Home',
    startLearning: 'Run Dispatch',
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
    pageKickerKnowledge: 'Knowledge / 知识库',
    pageTitleKnowledge: 'Understand why before choosing what to use.',
    pageCopyKnowledge: 'This vault stores explainable principles, decision frames, and boundary conditions. Every node should state where it applies, what supports it, and when it needs review.',
    sectionTitleKnowledge: 'Explainable decision nodes',
    sectionCopyKnowledge: 'Live knowledge nodes form the explanation layer of cross-vault dispatch.',
    insightTitleKnowledge: 'How a decision frame earns trust',
    insightCopyKnowledge: 'It must make the problem boundary, reasoning, conditions, and review point explicit.',
    pageKickerTools: 'Tools / 工具库',
    pageTitleTools: 'Turn effective methods into repeatable execution paths.',
    pageCopyTools: 'This vault organizes agents, prompts, workflows, and human checkpoints. A tool node explains inputs, steps, quality bars, and reuse boundaries—not just what to install.',
    sectionTitleTools: 'Executable method nodes',
    sectionCopyTools: 'These nodes can be dispatched and combined into routes for a concrete goal.',
    insightTitleTools: 'How a method becomes repeatable',
    insightCopyTools: 'Put the input contract, execution steps, human judgment, and quality bar on one path.',
    pageKickerCases: 'Cases / 案例库',
    pageTitleCases: 'Use real outcomes to decide whether a method can transfer.',
    pageCopyCases: 'This vault records context, action, before/after state, outcome, and limits. Cases are not success stories; they help people judge where a method holds up.',
    sectionTitleCases: 'Traceable case evidence',
    sectionCopyCases: 'These nodes ground cross-vault recommendations in outcomes that can be checked.',
    insightTitleCases: 'How a case becomes evidence',
    insightCopyCases: 'Keep the context, process, outcome, limits, and human review so others can judge transferability.',
    pageKickerCommunity: 'Community / 社区',
    pageTitleCommunity: 'Knowledge earns trust through repeated real-world use.',
    pageCopyCommunity: 'Validation, reuse, forks, merges, disputes, and decay become evolution signals. Community is not here to manufacture attention; it helps reliable methods enter the shared mainline.',
    sectionTitleCommunity: 'Nodes ready for further validation',
    sectionCopyCommunity: 'This view surfaces nodes that are ready to be used, challenged, or supported with more evidence.',
    insightTitleCommunity: 'How practice enters the shared mainline',
    insightCopyCommunity: 'Submit evidence, reuse and fork it across contexts, and merge only when the signal is strong enough.',
    runValidation: 'Validate current node',
    validationReady: 'Choose a node and submit a result from real use.',
    validationRunning: 'Verifying your session and submitting the signal...',
    validationPersisted: 'Validation recorded and added to the node’s community signals.',
    validationQueued: 'Demo validation completed locally; nothing was written to the database.',
    validationFailed: 'Validation could not be submitted. Try again later.',
    validationAuthRequired: 'Sign in to validate real nodes; demo nodes remain available locally.',
    panelTitleCommunity: 'Contribute real validation',
    panelCopyCommunity: 'Real nodes are written with the signed-in user’s session. Demo nodes are simulated locally and never written to the database.',
    footer: 'AI Knowledge Bank: use what is verified, and contribute evidence for what comes next.'
  }
};

const insights = {
  zh: {
    knowledge: [
      ['问题边界', '先写清目标、输入、约束和验证方式，再讨论工具。'],
      ['推理依据', '把判断过程整理成别人可以检查和质疑的结构。'],
      ['复审条件', '保留来源、适用场景和需要重新验证的时间或条件。']
    ],
    tools: [
      ['输入契约', '明确流程需要的数据、权限、样例和上下文。'],
      ['执行路径', '把 Prompt、Agent、人工确认和质量检查串成稳定步骤。'],
      ['退出条件', '说明何时需要人工接管，以及哪些场景不应复用。']
    ],
    cases: [
      ['上下文', '记录团队、数据、流程和目标，避免结果脱离条件。'],
      ['Before/After', '保留使用前后的状态、指标和人工复核结论。'],
      ['限制', '公开失败、风险和迁移边界，而不只展示成功结果。']
    ]
  },
  en: {
    knowledge: [
      ['Problem boundary', 'State the goal, inputs, constraints, and validation before discussing tools.'],
      ['Reasoning', 'Turn judgment into a structure that others can inspect and challenge.'],
      ['Review conditions', 'Keep sources, applicable contexts, and the point when the node needs review.']
    ],
    tools: [
      ['Input contract', 'Clarify required data, permissions, examples, and context.'],
      ['Execution path', 'Connect prompts, agents, human judgment, and quality checks into stable steps.'],
      ['Exit conditions', 'State when people must take over and where the route should not be reused.']
    ],
    cases: [
      ['Context', 'Record the team, data, process, and goal so the outcome keeps its conditions.'],
      ['Before/after', 'Keep the state, metrics, and human review before and after use.'],
      ['Limits', 'Publish failure, risk, and transfer boundaries instead of only success.']
    ]
  }
};

const communitySignals = {
  zh: [
    ['验证', '提交真实结果、证据和置信度，为节点增加可追踪信号。'],
    ['使用', '记录一次具体采用，帮助系统识别真正可复用的方法。'],
    ['分叉', '为新行业、角色或约束建立清楚的场景版本。'],
    ['合并', '只有分支的验证足够强，才提升为新的共享版本。'],
    ['争议', '标记证据不足、过期或高风险内容，阻止错误经验进入主干。'],
    ['衰减', '让过时节点自然降权，避免旧方法长期占据推荐位置。']
  ],
  en: [
    ['Validation', 'Submit real outcomes, evidence, and confidence as a traceable signal.'],
    ['Usage', 'Record adoption in a concrete context so reusable methods can surface.'],
    ['Fork', 'Create a clear scenario version for a new industry, role, or constraint.'],
    ['Merge', 'Promote a branch only when its validation is strong enough.'],
    ['Dispute', 'Flag weak evidence, outdated practice, or high-risk content.'],
    ['Decay', 'Lower the weight of outdated nodes so old methods do not dominate.']
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
    let accessToken = null;
    if (latestSource === 'supabase' && latestNodes[0]) {
      const { getCurrentUser } = await import('../lib/auth.ts');
      const session = await getCurrentUser();
      accessToken = session?.accessToken || null;
    }

    const signalRequest = buildCommunitySignalRequest({
      source: latestSource,
      node: latestNodes[0],
      accessToken,
      signal: {
        signal_type: 'validated',
        impact_delta: 12,
        confidence: 0.86,
        metadata: {
          page: pageType,
          language: currentLanguage,
          source: 'community-page'
        }
      }
    });

    if (signalRequest.requiresAuthentication) {
      statusLine.textContent = dictionaries[currentLanguage].validationAuthRequired;
      return;
    }

    const result = await fetchApi('/community-signals', signalRequest.options);

    statusLine.textContent = result.persisted
      ? dictionaries[currentLanguage].validationPersisted
      : dictionaries[currentLanguage].validationQueued;
    renderValidationResult(result);
  } catch (error) {
    if (error?.status === 401) {
      statusLine.textContent = dictionaries[currentLanguage].validationAuthRequired;
      return;
    }
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
