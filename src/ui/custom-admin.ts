/**
 * Worker Settings Page — standalone admin page for non-standard Waline features.
 * Uses the shared reading theme (paper palette, WenKai serif) so it matches both
 * the blog and the @waline/admin dashboard. Tabs and forms reflow on mobile.
 */
import {
	normalizeSiteUrl,
	themeBaseCss,
	themeBootstrapScript,
	themeFontLinks,
} from "./theme.js";

export interface CustomSettingsOptions {
	siteName?: string;
	siteUrl?: string;
}

export function getCustomSettingsPage(
	requestUrl: string,
	options: CustomSettingsOptions = {},
): string {
	const url = new URL(requestUrl);
	const apiBase = url.origin;
	const siteName = (options.siteName || "").trim();
	const siteUrl = normalizeSiteUrl(options.siteUrl);
	const brandLogo = /^https?:\/\//.test(siteUrl) ? `${siteUrl}/logo.webp` : "";
	const htmlVars = brandLogo
		? ` style="--wa-brand-logo:url('${escapeAttr(brandLogo)}')"`
		: "";

	return `<!doctype html>
<html lang="zh-CN"${htmlVars}>
<head>
<meta charset="utf-8">
<title>${siteName ? `${escapeHtml(siteName)} · ` : ""}Worker Settings</title>
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#FFFCF0">
<meta name="color-scheme" content="light dark">
${siteUrl ? `<link rel="icon" href="${escapeAttr(`${siteUrl}/favicon.ico`)}">` : ""}
${themeFontLinks}
${themeBootstrapScript}
<style>
${themeBaseCss}
${workerSettingsCss()}
</style>
</head>
<body>
<script>
window.__I18N = {
  'zh-CN': {
    title: 'Worker 设置',
    loading: '正在验证权限…',
    back: '← 返回管理面板',
    tabFrontend: '前端版本',
    tabComment: '评论策略',
    clientVersionLabel: '@waline/client CDN 版本',
    clientVersionHint: '输入版本号（如 <code>v3</code>），留空默认使用 <code>latest</code>。',
    adminVersionLabel: '@waline/admin CDN 版本',
    adminVersionHint: '输入版本号（如 <code>0.34.1</code>），留空默认使用 <code>latest</code>。',
    workerDisplayLabel: 'Worker 信息显示',
    workerDisplayAlways: '始终显示',
    workerDisplayAdmin: '仅管理员登录',
    workerDisplayDisabled: '禁用',
    workerDisplayHint: '控制 Waline on Worker 标识的可见性。「始终」对所有人可见，「仅管理员」仅管理员登录后可见，「禁用」完全隐藏。',
    defaultStatus: '默认状态',
    anonymousStatusLabel: '匿名评论默认状态',
    anonymousStatusHint: '未登录用户发表评论的默认状态。此设置优先于环境变量 AUDIT。',
    userStatusLabel: '已登录用户评论默认状态',
    userStatusHint: '已登录用户发表评论的默认状态。',
    approved: '直接通过 (approved)',
    waiting: '等待审核 (waiting)',
    spamReview: '反垃圾评论',
    spamModeLabel: '反垃圾模式',
    spamModeHint: '「关」不检测；「Akismet」使用 Akismet 服务；「LLM」使用大模型；「Mix」两者并用，任一判定为垃圾则标记。',
    spamOff: '关',
    akismetKeyLabel: 'Akismet API Key',
    akismetKeyHint: '在此输入密钥，或通过 <strong>AKISMET_KEY</strong> 环境变量（<code>wrangler secret put AKISMET_KEY</code>）设置。环境变量优先级高于此处填写的值。',
    llmSkipAdminLabel: '管理员跳过 LLM 审查',
    llmSkipAdminToggle: '管理员发表的评论跳过 LLM 审查（默认开启）',
    llmEndpointLabel: 'API Endpoint',
    llmEndpointHint: 'OpenAI 兼容的 Chat Completions 端点',
    llmKeyLabel: 'API Key',
    llmModelLabel: 'Model',
    llmPromptLabel: 'System Prompt',
    llmFallbackHint: 'LLM 调用失败时，将遵循对应的评论默认状态设置。',
    testBtn: '测试 LLM 连接',
    saveBtn: '保存设置',
    refreshBtn: '↻ 刷新',
    chooseVersion: '选择版本…',
    versionsRefreshed: '版本列表已刷新',
    adminVersionsRefreshed: 'Admin 版本列表已刷新',
    fetchFailed: '获取版本失败: {msg}',
    loadFailed: '加载设置失败',
    saveOk: '设置已保存！',
    saveFailed: '保存失败',
    unauthorized: '权限不足，正在跳转登录页…',
    authFailed: '验证失败，请刷新重试。',
    llmOk: 'LLM 连接正常！',
    llmFail: '失败: {code}',
    llmError: '错误: {msg}',
    envOverride: '此设置被环境变量 / wrangler secret 覆盖',
    akismetLink: '申请地址：',
    themeToggle: '切换深色模式',
  },
  en: {
    title: 'Worker Settings',
    loading: 'Verifying permissions…',
    back: '← Back to Dashboard',
    tabFrontend: 'Frontend Versions',
    tabComment: 'Comment Policy',
    clientVersionLabel: '@waline/client CDN Version',
    clientVersionHint: 'Enter a version (e.g. <code>v3</code>). Leave blank to use <code>latest</code>.',
    adminVersionLabel: '@waline/admin CDN Version',
    adminVersionHint: 'Enter a version (e.g. <code>0.34.1</code>). Leave blank to use <code>latest</code>.',
    workerDisplayLabel: 'Worker Branding',
    workerDisplayAlways: 'Always Visible',
    workerDisplayAdmin: 'Admin Only',
    workerDisplayDisabled: 'Disabled',
    workerDisplayHint: 'Controls visibility of the Waline on Worker badge.',
    defaultStatus: 'Default Status',
    anonymousStatusLabel: 'Anonymous Comment Default',
    anonymousStatusHint: 'Default status for comments from unauthenticated users. Takes precedence over the AUDIT env var.',
    userStatusLabel: 'Authenticated User Comment Default',
    userStatusHint: 'Default status for comments from logged-in users.',
    approved: 'Approved',
    waiting: 'Pending Review (waiting)',
    spamReview: 'Spam Review',
    spamModeLabel: 'Spam Detection Mode',
    spamModeHint: '"Off" — no detection; "Akismet" — Akismet only; "LLM" — LLM only; "Mix" — both, mark as spam if either flags it.',
    spamOff: 'Off',
    akismetKeyLabel: 'Akismet API Key',
    akismetKeyHint: 'Enter the key here, or set <strong>AKISMET_KEY</strong> env var (<code>wrangler secret put AKISMET_KEY</code>). Env var takes precedence.',
    llmSkipAdminLabel: 'Skip Admin LLM Review',
    llmSkipAdminToggle: 'Skip LLM review for admin comments (enabled by default)',
    llmEndpointLabel: 'API Endpoint',
    llmEndpointHint: 'OpenAI-compatible Chat Completions endpoint',
    llmKeyLabel: 'API Key',
    llmModelLabel: 'Model',
    llmPromptLabel: 'System Prompt',
    llmFallbackHint: 'If the LLM call fails, the corresponding default comment status is used.',
    testBtn: 'Test LLM Connection',
    saveBtn: 'Save Settings',
    refreshBtn: '↻ Refresh',
    chooseVersion: 'Choose version…',
    versionsRefreshed: 'Version list refreshed',
    adminVersionsRefreshed: 'Admin version list refreshed',
    fetchFailed: 'Failed to fetch versions: {msg}',
    loadFailed: 'Failed to load settings',
    saveOk: 'Settings saved!',
    saveFailed: 'Failed to save',
    unauthorized: 'Access denied. Redirecting to login…',
    authFailed: 'Verification failed. Please refresh.',
    llmOk: 'LLM connection OK!',
    llmFail: 'Failed: {code}',
    llmError: 'Error: {msg}',
    envOverride: 'Overridden by environment variable / wrangler secret',
    akismetLink: 'Get a key at ',
    themeToggle: 'Toggle dark mode',
  }
};
</script>

<!-- Header -->
<header class="typecho-head-nav">
  <div class="waline-header">
    <div class="brand">
      <a class="brand-link" href="/ui" aria-label="${siteName ? escapeAttr(siteName) : "Admin"}">
        <span class="brand-mark"></span>
        <span class="brand-copy">
          <strong>${siteName ? escapeHtml(siteName) : "Waline"}</strong>
          <small>Waline on Worker</small>
        </span>
      </a>
    </div>
    <div class="nav-links">
      <button type="button" class="wk-theme-toggle" aria-label="Toggle dark mode" title="Toggle dark mode" onclick="window.__walineTheme && window.__walineTheme.toggle()">
        <svg class="wk-theme-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.4 5.4l1.6 1.6M17 17l1.6 1.6M18.6 5.4 17 7M7 17l-1.6 1.6"/></svg>
        <svg class="wk-theme-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.5 14.4A8.6 8.6 0 1 1 9.6 3.5a6.9 6.9 0 0 0 10.9 10.9Z"/></svg>
      </button>
      <div class="lang-toggle" role="group" aria-label="Language">
        <button data-lang="zh-CN" class="active" type="button">中</button>
        <button data-lang="en" type="button">EN</button>
      </div>
      <a class="back-link" href="/ui" data-i18n="back">← Back to Dashboard</a>
    </div>
  </div>
</header>

<div id="auth-loading">
  <span class="spinner"></span>
  <span data-i18n="loading">Verifying permissions…</span>
</div>

<div id="main-content" class="hidden">
<div class="container">
  <h1 class="page-title" data-i18n="title">Worker Settings</h1>
  <div class="tabs" id="tabs" role="tablist">
    <button class="tab-btn active" data-tab="frontend" data-i18n="tabFrontend" role="tab" aria-selected="true">Frontend Versions</button>
    <button class="tab-btn" data-tab="comment" data-i18n="tabComment" role="tab" aria-selected="false">Comment Policy</button>
  </div>

  <div class="tab-panel active" id="tab-frontend" role="tabpanel">
    <div class="field">
      <label class="field-label" for="set-version" data-i18n="clientVersionLabel">@waline/client CDN Version</label>
      <div class="version-row">
        <input type="text" id="set-version" placeholder="v3" />
        <select id="version-select" aria-label="Version list">
          <option value="">Choose version…</option>
          <option value="latest">latest</option>
        </select>
        <button class="btn btn-secondary btn-xs" id="refresh-versions" type="button" data-i18n-title="refreshBtn">↻ Refresh</button>
      </div>
      <p class="field-hint" data-i18n-html="clientVersionHint">Enter a version (e.g. <code>v3</code>). Leave blank to use <code>latest</code>.</p>
    </div>
    <div class="field">
      <label class="field-label" for="set-admin-version" data-i18n="adminVersionLabel">@waline/admin CDN Version</label>
      <div class="version-row">
        <input type="text" id="set-admin-version" placeholder="latest" />
        <select id="admin-version-select" aria-label="Admin version list">
          <option value="">Choose version…</option>
          <option value="latest">latest</option>
        </select>
        <button class="btn btn-secondary btn-xs" id="refresh-admin-versions" type="button" data-i18n-title="refreshBtn">↻ Refresh</button>
      </div>
      <p class="field-hint" data-i18n-html="adminVersionHint">Enter a version (e.g. <code>0.34.1</code>). Leave blank to use <code>latest</code>.</p>
    </div>
    <div class="field">
      <label class="field-label" for="set-worker-display" data-i18n="workerDisplayLabel">Worker Branding</label>
      <select id="set-worker-display">
        <option value="always" data-i18n="workerDisplayAlways">Always Visible</option>
        <option value="admin" selected data-i18n="workerDisplayAdmin">Admin Only</option>
        <option value="disabled" data-i18n="workerDisplayDisabled">Disabled</option>
      </select>
      <p class="field-hint" data-i18n="workerDisplayHint">Controls visibility of the Waline on Worker badge.</p>
    </div>
  </div>

  <div class="tab-panel" id="tab-comment" role="tabpanel">
    <h4 class="section-heading" data-i18n="defaultStatus">Default Status</h4>
    <div class="field">
      <label class="field-label" for="set-comment-status" data-i18n="anonymousStatusLabel">Anonymous Comment Default</label>
      <select id="set-comment-status">
        <option value="approved" data-i18n="approved">Approved</option>
        <option value="waiting" data-i18n="waiting">Pending Review (waiting)</option>
      </select>
      <p class="field-hint" data-i18n="anonymousStatusHint">Default status for comments from unauthenticated users.</p>
    </div>
    <div class="field">
      <label class="field-label" for="set-user-comment-status" data-i18n="userStatusLabel">Authenticated User Comment Default</label>
      <select id="set-user-comment-status">
        <option value="approved" data-i18n="approved">Approved</option>
        <option value="waiting" data-i18n="waiting">Pending Review (waiting)</option>
      </select>
      <p class="field-hint" data-i18n="userStatusHint">Default status for comments from logged-in users.</p>
    </div>

    <h4 class="section-heading" data-i18n="spamReview">Spam Review</h4>
    <div class="field">
      <label class="field-label" for="set-spam-mode" data-i18n="spamModeLabel">Spam Detection Mode</label>
      <select id="set-spam-mode">
        <option value="off" data-i18n="spamOff">Off</option>
        <option value="akismet">Akismet</option>
        <option value="llm">LLM</option>
        <option value="mix">Mix (Akismet + LLM)</option>
      </select>
      <p class="field-hint" data-i18n="spamModeHint">Select the spam detection method.</p>
    </div>

    <div id="section-akismet" style="display:none">
      <div class="field">
        <label class="field-label" for="set-akismet-key" data-i18n="akismetKeyLabel">Akismet API Key</label>
        <input type="text" id="set-akismet-key" placeholder="xxxxxxxxxxxx" autocomplete="off" />
        <p class="field-hint"><span data-i18n="akismetKeyHint">Enter the key here.</span> <span data-i18n="akismetLink">Get a key at </span><a href="https://akismet.com" target="_blank" rel="noopener">akismet.com</a></p>
      </div>
    </div>

    <div id="section-llm" style="display:none">
      <div class="field">
        <label class="field-label" data-i18n="llmSkipAdminLabel">Skip Admin LLM Review</label>
        <div class="toggle-row">
          <label class="toggle"><input type="checkbox" id="set-llm-skip-admin" checked /><span class="toggle-slider"></span></label>
          <span class="toggle-label" data-i18n="llmSkipAdminToggle">Skip LLM review for admin comments</span>
        </div>
      </div>
      <div class="field">
        <label class="field-label" for="set-llm-ep" data-i18n="llmEndpointLabel">API Endpoint</label>
        <input type="url" id="set-llm-ep" placeholder="https://api.openai.com/v1/chat/completions" autocomplete="off" />
        <p class="field-hint" data-i18n="llmEndpointHint">OpenAI-compatible Chat Completions endpoint</p>
      </div>
      <div class="field">
        <label class="field-label" for="set-llm-key" data-i18n="llmKeyLabel">API Key</label>
        <input type="text" id="set-llm-key" placeholder="sk-..." autocomplete="off" />
      </div>
      <div class="field">
        <label class="field-label" for="set-llm-model" data-i18n="llmModelLabel">Model</label>
        <input type="text" id="set-llm-model" placeholder="gpt-4o-mini" autocomplete="off" />
      </div>
      <div class="field">
        <label class="field-label" for="set-llm-prompt" data-i18n="llmPromptLabel">System Prompt</label>
        <textarea id="set-llm-prompt" rows="5" placeholder="You are a review bot. Output a single word: approved or spam."></textarea>
      </div>
      <p class="field-hint" data-i18n="llmFallbackHint">If the LLM call fails, the corresponding default comment status is used.</p>
      <div class="test-row">
        <button class="btn btn-secondary btn-xs" id="test-btn" type="button" data-i18n="testBtn">Test LLM Connection</button>
      </div>
    </div>
  </div>

  <div class="actions">
    <button class="btn btn-primary" id="save-btn" type="button" data-i18n="saveBtn">Save Settings</button>
  </div>
</div>
</div>

<script>
(function(){
  var API = ${JSON.stringify(apiBase)};

  var currentLang = 'zh-CN';
  var SETTINGS_DATA = null;

  function t(key) { return window.__I18N[currentLang][key] || key; }

  var langBtns = document.querySelectorAll('.lang-toggle button');
  function applyLang(lang) {
    currentLang = lang;
    document.documentElement.lang = lang === 'zh-CN' ? 'zh-CN' : 'en';
    langBtns.forEach(function(b){ b.classList.toggle('active', b.getAttribute('data-lang') === lang); });
    document.querySelectorAll('[data-i18n]').forEach(function(el){
      var k = el.getAttribute('data-i18n');
      if (k && !el.hasAttribute('data-i18n-html')) el.textContent = t(k);
    });
    document.querySelectorAll('[data-i18n-html]').forEach(function(el){
      var k = el.getAttribute('data-i18n-html');
      if (k) el.innerHTML = t(k);
    });
    document.querySelectorAll('[data-i18n-title]').forEach(function(el){
      var k = el.getAttribute('data-i18n-title');
      if (k) el.title = t(k);
    });
    document.querySelectorAll('#version-select option:first-child').forEach(function(o){ o.textContent = t('chooseVersion'); });
    document.querySelectorAll('#admin-version-select option:first-child').forEach(function(o){ o.textContent = t('chooseVersion'); });
    // Re-populate form with settings data
    if (SETTINGS_DATA) populateForm(SETTINGS_DATA);
  }
  langBtns.forEach(function(b){ b.addEventListener('click', function(){ applyLang(b.getAttribute('data-lang')); }); });

  var navLang = (navigator.language || 'en').toLowerCase();
  applyLang(navLang.startsWith('zh') ? 'zh-CN' : 'en');

  function esc(s) { if (!s) return ''; var d = document.createElement('div'); d.textContent = String(s); return d.innerHTML; }

  function toast(msg, ok) {
    var el = document.createElement('div');
    el.className = 'toast ' + (ok ? 'toast-ok' : 'toast-err');
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function(){ el.remove(); }, 3000);
  }

  // --- Auth gate ---
  var urlToken = new URLSearchParams(location.search).get('token');
  var token = urlToken || localStorage.getItem('TOKEN') || sessionStorage.getItem('TOKEN');

  function showUnauthorized() {
    document.getElementById('auth-loading').innerHTML = '<span style="color:var(--wa-danger)">' + t('unauthorized') + '</span>';
    setTimeout(function(){
      location.href = '/ui/login?redirect=' + encodeURIComponent('/ui/worker-setting');
    }, 1200);
  }

  if (!token) { showUnauthorized(); return; }

  fetch(API + '/api/token', { headers: { Authorization: 'Bearer ' + token } })
    .then(function(r){ return r.json(); })
    .then(function(d){
      if (d.errno !== 0 || !d.data || d.data.type !== 'administrator') {
        showUnauthorized(); return;
      }
      document.getElementById('auth-loading').style.display = 'none';
      document.getElementById('main-content').classList.remove('hidden');
      initPage();
    })
    .catch(function(){
      document.getElementById('auth-loading').innerHTML = '<span style="color:var(--wa-danger)">' + t('authFailed') + '</span>';
    });

  function api(path, opts) {
    opts = opts || {};
    var headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});
    if (token) headers['Authorization'] = 'Bearer ' + token;
    return fetch(API + '/api' + path, Object.assign({}, opts, { headers: headers })).then(function(r){ return r.json(); });
  }

  function updateSpamSections(mode) {
    var showAkismet = mode === 'akismet' || mode === 'mix';
    var showLlm = mode === 'llm' || mode === 'mix';
    document.getElementById('section-akismet').style.display = showAkismet ? '' : 'none';
    document.getElementById('section-llm').style.display = showLlm ? '' : 'none';
  }

  // Select dropdown to match a saved version string (by text or by rebuilding options)
  function selectVersionInDropdown(sel, version) {
    for (var i = 0; i < sel.options.length; i++) {
      if (sel.options[i].value === version) { sel.selectedIndex = i; return; }
    }
    // If not in dropdown (custom version), add it as an option
    if (version && version !== 'latest') {
      var opt = document.createElement('option');
      opt.value = version;
      opt.textContent = version;
      sel.appendChild(opt);
      sel.value = version;
    }
  }

  // Populate form fields from settings object (does NOT touch version dropdowns)
  function populateForm(s) {
    document.getElementById('set-version').value = s.waline_client_version || 'v3';
    document.getElementById('set-admin-version').value = s.waline_admin_version || '';
    document.getElementById('set-comment-status').value = s.comment_default_status || 'approved';
    document.getElementById('set-user-comment-status').value = s.user_comment_default_status || 'approved';
    document.getElementById('set-worker-display').value = s.worker_display || 'admin';
    var spamMode = s.spam_mode || ((s.llm_mode && s.llm_mode !== 'off') ? 'llm' : 'off');
    document.getElementById('set-spam-mode').value = spamMode;
    updateSpamSections(spamMode);
    document.getElementById('set-akismet-key').value = s.akismet_key || '';
    document.getElementById('set-llm-skip-admin').checked = s.llm_skip_admin !== '0';
    document.getElementById('set-llm-ep').value = s.llm_endpoint || '';
    document.getElementById('set-llm-key').value = s.llm_api_key || '';
    document.getElementById('set-llm-model').value = s.llm_model || 'gpt-4o-mini';
    document.getElementById('set-llm-prompt').value = s.llm_prompt || 'You are a review bot. Output a single word: approved or spam.';
  }

  // Reselect dropdowns after versions are loaded (called from fetchVersions success callback)
  function reselectVersions() {
    if (!SETTINGS_DATA) return;
    selectVersionInDropdown(document.getElementById('version-select'), SETTINGS_DATA.waline_client_version || 'v3');
    selectVersionInDropdown(document.getElementById('admin-version-select'), SETTINGS_DATA.waline_admin_version || '');
  }

  function initPage() {
    // Tab switching
    var tabs = document.querySelectorAll('.tab-btn');
    var panels = document.querySelectorAll('.tab-panel');
    tabs.forEach(function(tab) {
      tab.addEventListener('click', function() {
        var target = this.getAttribute('data-tab');
        tabs.forEach(function(t){
          var on = t === tab;
          t.classList.toggle('active', on);
          t.setAttribute('aria-selected', on ? 'true' : 'false');
        });
        panels.forEach(function(p){ p.classList.toggle('active', p.id === 'tab-' + target); });
      });
    });

    function fetchVersions(packageName, btnId, selId, okMsg, silent) {
      var btn = document.getElementById(btnId);
      var sel = document.getElementById(selId);
      if (!btn || !sel) return;
      btn.disabled = true;
      btn.innerHTML = '↻<span class="spinner"></span>';
      fetch('https://data.jsdelivr.com/v1/packages/npm/' + packageName)
        .then(function(r){ return r.json(); })
        .then(function(data) {
          sel.innerHTML = '<option value="">' + t('chooseVersion') + '</option><option value="latest">latest' +
            (data.tags && data.tags.latest ? ' (' + esc(data.tags.latest) + ')' : '') + '</option>';
          if (data.versions) {
            data.versions.slice(0, 30).forEach(function(v) {
              var opt = document.createElement('option');
              opt.value = v.version;
              opt.textContent = v.version;
              sel.appendChild(opt);
            });
          }
          reselectVersions();
          if (!silent) toast(okMsg, true);
        })
        .catch(function(e){ if (!silent) toast(t('fetchFailed').replace('{msg}', e.message), false); })
        .finally(function(){ btn.disabled = false; btn.textContent = t('refreshBtn'); });
    }

    document.getElementById('refresh-versions').addEventListener('click', function(){
      fetchVersions('@waline/client', 'refresh-versions', 'version-select', t('versionsRefreshed'));
    });
    document.getElementById('version-select').addEventListener('change', function() {
      if (this.value) document.getElementById('set-version').value = this.value;
    });
    document.getElementById('refresh-admin-versions').addEventListener('click', function(){
      fetchVersions('@waline/admin', 'refresh-admin-versions', 'admin-version-select', t('adminVersionsRefreshed'));
    });
    document.getElementById('admin-version-select').addEventListener('change', function() {
      if (this.value) document.getElementById('set-admin-version').value = this.value;
    });

    document.getElementById('set-spam-mode').addEventListener('change', function() {
      updateSpamSections(this.value);
    });

    // Load settings first, then fetch versions (which reselect after fetch completes)
    api('/settings').then(function(sr) {
      var s = sr.data || {};
      SETTINGS_DATA = s;
      populateForm(s);

      var overrides = sr.env_overrides || [];
      var overrideDisabledFields = ['akismet_key','spam_mode','llm_skip_admin','llm_endpoint','llm_api_key','llm_model','llm_prompt'];
      overrideDisabledFields.forEach(function(k) {
        if (overrides.indexOf(k) !== -1) {
          var el = document.getElementById('set-' + k) ||
                   document.getElementById('set-' + k.replace(/_/g, '-'));
          if (el) { el.disabled = true; el.title = t('envOverride'); }
        }
      });

      // Now that SETTINGS_DATA is populated, fetch versions (will reselect on complete)
      fetchVersions('@waline/client', 'refresh-versions', 'version-select', t('versionsRefreshed'), true);
      fetchVersions('@waline/admin', 'refresh-admin-versions', 'admin-version-select', t('adminVersionsRefreshed'), true);
    }).catch(function(){ toast(t('loadFailed'), false); });

    document.getElementById('save-btn').addEventListener('click', function() {
      var settings = {
        waline_client_version: document.getElementById('set-version').value.trim() || 'v3',
        waline_admin_version: document.getElementById('set-admin-version').value.trim() || '',
        comment_default_status: document.getElementById('set-comment-status').value,
        user_comment_default_status: document.getElementById('set-user-comment-status').value,
        worker_display: document.getElementById('set-worker-display').value,
        spam_mode: document.getElementById('set-spam-mode').value,
        akismet_key: document.getElementById('set-akismet-key').value.trim(),
        llm_skip_admin: document.getElementById('set-llm-skip-admin').checked ? '1' : '0',
        llm_endpoint: document.getElementById('set-llm-ep').value.trim(),
        llm_api_key: document.getElementById('set-llm-key').value.trim(),
        llm_model: document.getElementById('set-llm-model').value.trim(),
        llm_prompt: document.getElementById('set-llm-prompt').value.trim(),
      };
      api('/settings', { method: 'PUT', body: JSON.stringify(settings) }).then(function(r) {
        toast(r.errno ? (r.errmsg || t('saveFailed')) : t('saveOk'), !r.errno);
      }).catch(function(){ toast(t('saveFailed'), false); });
    });

    document.getElementById('test-btn').addEventListener('click', function() {
      var ep = document.getElementById('set-llm-ep').value.trim();
      var key = document.getElementById('set-llm-key').value.trim();
      var model = document.getElementById('set-llm-model').value.trim();
      if (!ep || !key) { toast(t('fetchFailed').replace('{msg}','Endpoint and Key required'), false); return; }
      fetch(ep, { method:'POST', headers:{ 'Content-Type':'application/json', 'Authorization':'Bearer '+key },
        body: JSON.stringify({ model: model || 'gpt-4o-mini', messages: [{ role:'user', content:'Hello, respond with OK' }], max_tokens:10 }) })
      .then(function(r) { toast(r.ok ? t('llmOk') : t('llmFail').replace('{code}',r.status), r.ok); })
      .catch(function(e) { toast(t('llmError').replace('{msg}',e.message), false); });
    });
  }
})();
</script>
</body>
</html>`;
}

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

function escapeAttr(value: string): string {
	return escapeHtml(value).replace(/'/g, "&#39;");
}

function workerSettingsCss(): string {
	return `
html,body{background:var(--wa-bg)}
body{
  margin:0;color:var(--wa-text);background:var(--wa-bg);
  font-family:var(--wa-font-serif);font-size:15px;line-height:1.7;
  -webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;
}
*{box-sizing:border-box}
a{color:var(--wa-link);text-decoration:none}
a:hover{color:var(--wa-accent-hover)}
::selection{background:var(--wa-accent-soft-strong)}

/* Header */
.typecho-head-nav{
  position:sticky;top:0;z-index:30;
  padding:0 24px;height:auto;
  background:var(--wa-header-bg);
  -webkit-backdrop-filter:saturate(1.4) blur(14px);
  backdrop-filter:saturate(1.4) blur(14px);
  border-bottom:1px solid var(--wa-rule);
  display:block;
}
.waline-header{
  display:flex;align-items:center;justify-content:space-between;gap:20px;
  max-width:1040px;margin:0 auto;padding:11px 0;
}
.brand{display:flex;align-items:center;min-width:0}
.brand-link{display:inline-flex;align-items:center;gap:10px;min-width:0;color:var(--wa-text)}
.brand-link:hover{color:var(--wa-text);text-decoration:none}
.brand-mark{
  width:34px;height:34px;flex:none;border-radius:50%;
  background:var(--wa-brand-logo) center/cover no-repeat;
  box-shadow:0 0 0 1px var(--wa-rule) inset;
}
.brand-copy{display:flex;flex-direction:column;line-height:1.25;min-width:0}
.brand-copy strong{
  font-size:.98rem;font-weight:700;letter-spacing:.02em;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}
.brand-copy small{
  font-family:var(--wa-font-mono);font-size:.6rem;font-weight:400;
  letter-spacing:.13em;text-transform:uppercase;color:var(--wa-muted);
}
.nav-links{display:flex;align-items:center;gap:10px;flex:none}
.lang-toggle{
  display:inline-flex;align-items:center;gap:2px;padding:3px;
  border:1px solid var(--wa-rule);border-radius:999px;background:transparent;
}
.lang-toggle button{
  min-width:32px;height:28px;padding:0 9px;border:0;border-radius:999px;
  background:transparent;color:var(--wa-muted);font-family:inherit;
  font-size:.76rem;line-height:1;cursor:pointer;transition:color .16s,background-color .16s;
}
.lang-toggle button:hover{color:var(--wa-text)}
.lang-toggle button.active{background:var(--wa-accent-soft);color:var(--wa-accent-hover);font-weight:700}
.back-link{
  display:inline-flex;align-items:center;height:36px;padding:0 14px;
  border:1px solid var(--wa-rule);border-radius:999px;
  color:var(--wa-text-3);font-size:.82rem;white-space:nowrap;
  transition:border-color .16s,color .16s,background-color .16s;
}
.back-link:hover{border-color:var(--wa-rule-strong);background:var(--wa-accent-soft);color:var(--wa-text);text-decoration:none}

/* Content */
.container{max-width:1040px;margin:0 auto;padding:30px 24px 80px}
.page-title{margin:0 0 22px;font-size:1.6rem;font-weight:700;letter-spacing:.015em;line-height:1.3}
.page-title:after{content:"";display:block;width:28px;height:3px;margin-top:10px;border-radius:2px;background:var(--wa-accent)}

/* Tabs */
.tabs{display:flex;flex-wrap:wrap;gap:22px;margin:0 0 26px;border-bottom:1px solid var(--wa-rule)}
.tab-btn{
  min-height:0;padding:0 0 10px;margin-bottom:-1px;
  border:0;border-bottom:2px solid transparent;border-radius:0;background:transparent;
  color:var(--wa-text-3);font-family:inherit;font-size:.95rem;font-weight:400;
  cursor:pointer;transition:color .16s,border-color .16s;
}
.tab-btn:hover{color:var(--wa-text)}
.tab-btn.active{color:var(--wa-text);font-weight:700;border-bottom-color:var(--wa-accent)}

.tab-panel{display:none}
.tab-panel.active{display:block;animation:fadeIn .18s ease}
@keyframes fadeIn{from{opacity:0;transform:translateY(2px)}to{opacity:1;transform:none}}

.section-heading{
  margin:6px 0 18px;padding-bottom:8px;border-bottom:1px solid var(--wa-rule);
  color:var(--wa-muted);font-family:var(--wa-font-mono);font-size:.72rem;
  font-weight:500;letter-spacing:.1em;text-transform:uppercase;
}
#tab-comment .section-heading:not(:first-child){margin-top:34px}

/* Fields */
.field{margin-bottom:22px}
.field-label{display:block;margin-bottom:6px;color:var(--wa-text-2);font-size:.82rem;font-weight:700}
.field-hint{margin:6px 0 0;color:var(--wa-muted);font-size:.78rem;line-height:1.65}
.field-hint code,.field-hint strong{
  font-family:var(--wa-font-mono);font-size:.95em;color:var(--wa-text-2);
  background:var(--wa-code-bg);border-radius:4px;padding:1px 5px;
}
.field-hint strong{font-weight:500}
.field-hint a{color:var(--wa-link)}

input[type="text"],input[type="url"],input[type="password"],textarea,select{
  width:100%;max-width:560px;
  border:1px solid var(--wa-rule-strong);border-radius:9px;
  background:var(--wa-paper);color:var(--wa-text);
  font-family:inherit;font-size:.92rem;line-height:1.5;
  box-shadow:none;outline:none;
  transition:border-color .16s,box-shadow .16s;
}
input[type="text"],input[type="url"],input[type="password"],select{height:40px;padding:0 12px}
textarea{padding:9px 12px;resize:vertical;min-height:110px}
select{
  padding-right:30px;-webkit-appearance:none;appearance:none;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236f6e69' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat:no-repeat;background-position:right 11px center;
}
html.dark select{
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239f9d96' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
}
input::placeholder,textarea::placeholder{color:var(--wa-muted);opacity:1}
input[type="text"]:focus,input[type="url"]:focus,input[type="password"]:focus,textarea:focus,select:focus{
  border-color:var(--wa-accent);box-shadow:0 0 0 3px var(--wa-accent-soft);
}
input:disabled,select:disabled,textarea:disabled{
  background:var(--wa-paper-soft);color:var(--wa-muted);cursor:not-allowed;
}

/* Version picker */
.version-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.version-row input{flex:1 1 200px;max-width:300px}
.version-row select{flex:0 1 auto;width:auto;min-width:170px;max-width:220px}
.version-row .btn{flex:none}

/* Toggle */
.toggle-row{display:flex;align-items:center;gap:12px}
.toggle{position:relative;display:inline-block;width:40px;height:23px;flex:none;cursor:pointer}
.toggle input{opacity:0;width:0;height:0}
.toggle-slider{position:absolute;inset:0;background:var(--wa-rule-strong);border-radius:999px;transition:background-color .2s}
.toggle-slider:before{
  content:"";position:absolute;left:3px;bottom:3px;width:17px;height:17px;
  border-radius:50%;background:var(--wa-paper);transition:transform .2s;
  box-shadow:0 1px 2px rgba(16,15,15,.2);
}
.toggle input:checked+.toggle-slider{background:var(--wa-accent)}
.toggle input:checked+.toggle-slider:before{transform:translateX(17px)}
.toggle input:focus-visible+.toggle-slider{box-shadow:0 0 0 3px var(--wa-accent-soft)}
.toggle-label{color:var(--wa-text-3);font-size:.85rem;line-height:1.6}

/* Buttons */
.btn{
  display:inline-flex;align-items:center;justify-content:center;gap:6px;
  height:38px;padding:0 18px;border:1px solid var(--wa-rule-strong);border-radius:999px;
  background:transparent;color:var(--wa-text-2);font-family:inherit;
  font-size:.88rem;font-weight:500;line-height:1;cursor:pointer;
  transition:border-color .16s,color .16s,background-color .16s;
}
.btn:hover{background:var(--wa-accent-soft);border-color:var(--wa-accent);color:var(--wa-accent-hover)}
.btn:disabled{opacity:.5;cursor:not-allowed}
.btn-xs{height:32px;padding:0 13px;font-size:.8rem;white-space:nowrap}
.btn-primary{border-color:var(--wa-primary);background:var(--wa-primary);color:#fff}
.btn-primary:hover{background:var(--wa-primary-hover);border-color:var(--wa-primary-hover);color:#fff}
.btn-secondary{color:var(--wa-text-3)}
.test-row{margin-top:14px}
.actions{margin-top:30px;padding-top:24px;border-top:1px solid var(--wa-rule);display:flex;gap:10px}
.actions .btn{min-width:150px;height:44px;font-size:.95rem;font-weight:700}

/* Toast */
.toast{
  position:fixed;top:18px;right:18px;z-index:9999;max-width:min(380px,calc(100vw - 32px));
  padding:11px 15px;border-radius:10px;border:1px solid var(--wa-rule);
  background:var(--wa-paper-raised);color:var(--wa-text-2);font-size:.84rem;line-height:1.55;
  box-shadow:0 10px 30px rgba(16,15,15,.12);
  animation:slideIn .22s ease;
}
html.dark .toast{box-shadow:0 10px 30px rgba(0,0,0,.5)}
.toast-ok{border-left:3px solid var(--wa-success)}
.toast-err{border-left:3px solid var(--wa-danger);color:var(--wa-danger)}
@keyframes slideIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}

/* Spinner */
.spinner{
  display:inline-block;width:13px;height:13px;margin-left:6px;vertical-align:-1px;
  border:2px solid var(--wa-rule-strong);border-top-color:var(--wa-accent);
  border-radius:50%;animation:spin .6s linear infinite;
}
@keyframes spin{to{transform:rotate(360deg)}}

/* Auth */
#auth-loading{
  display:flex;align-items:center;justify-content:center;gap:8px;
  min-height:50vh;padding:40px 20px;color:var(--wa-muted);font-size:.9rem;
}
#main-content.hidden{display:none}

@media (max-width:720px){
  .typecho-head-nav{padding:8px 16px}
  .waline-header{flex-wrap:wrap;row-gap:6px;gap:10px;padding:0}
  .brand{flex:1 1 auto}
  .brand-mark{width:30px;height:30px}
  .brand-copy strong{font-size:.9rem}
  .nav-links{width:100%;justify-content:space-between;gap:8px}
  .back-link{flex:1 1 auto;justify-content:center;height:34px;font-size:.78rem;padding:0 10px}
  .lang-toggle{padding:2px}
  .lang-toggle button{min-width:30px;height:26px}
  .wk-theme-toggle{width:34px;height:34px}
  .container{padding:22px 16px 80px}
  .page-title{font-size:1.35rem}
  .tabs{gap:18px;margin-bottom:22px}
  .tab-btn{font-size:.9rem}
  .version-row input{flex:1 1 100%;max-width:none}
  .version-row select{flex:1 1 auto;max-width:none;min-width:0}
  .version-row .btn{flex:0 0 auto}
  input[type="text"],input[type="url"],input[type="password"],textarea,select{max-width:none;font-size:16px}
  input[type="text"],input[type="url"],input[type="password"],select{height:44px}
  .actions .btn{width:100%;min-width:0}
  .toast{top:12px;left:12px;right:12px;max-width:none}
}
`;
}
