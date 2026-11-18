/**
 * Admin Panel - loads @waline/admin from CDN (matching original Waline implementation)
 * Includes Worker branding and menu injection based on worker_display setting
 * Menu injection uses client-side API check (server-side auth validation) so it
 * works on first login without page refresh
 *
 * The visuals are retuned to the suenyiyang.com reading theme via a stylesheet
 * appended after the CDN bundle, plus a small enhancer that adds the dark-mode
 * toggle and marks the active navigation item.
 */
import type { Env } from "../env.js";
import { getSettings } from "../router/settings.js";
import { adminThemeCss } from "./admin-theme.js";
import {
	normalizeSiteUrl,
	themeBaseCss,
	themeBootstrapScript,
	themeFontLinks,
	themeToggleButton,
} from "./theme.js";

export async function getAdminPage(
	env: Env,
	requestUrl: string,
): Promise<string> {
	const settings = await getSettings(env.DB, [
		"worker_display",
		"waline_admin_version",
	]).catch(() => ({}) as Record<string, string>);
	const workerDisplay = settings.worker_display || "admin";
	const adminVersion = (settings.waline_admin_version || "latest").trim();
	const url = new URL(requestUrl);
	const serverURL = `${url.origin}/api/`;
	const siteName = env.SITE_NAME || "";
	const siteUrl = normalizeSiteUrl(env.SITE_URL);
	const recaptchaV3Key = env.RECAPTCHA_V3_KEY || "";
	const turnstileKey = env.TURNSTILE_KEY || "";
	const origin = url.origin;

	const showWorker = workerDisplay !== "disabled";
	const showAlways = workerDisplay === "always";

	const brandLogo = /^https?:\/\//.test(siteUrl) ? `${siteUrl}/logo.webp` : "";
	const htmlVars = brandLogo
		? ` style="--wa-brand-logo:url('${escapeAttr(brandLogo)}')"`
		: "";

	// Build unpkg script src. Examples:
	//   latest        -> //unpkg.com/@waline/admin
	//   0.34.1        -> //unpkg.com/@waline/admin@0.34.1
	//   v0.34.1       -> //unpkg.com/@waline/admin@v0.34.1
	//   @0.34.1       -> //unpkg.com/@waline/admin@0.34.1 (strip leading @)
	//   npm:@waline/admin@latest  -> //unpkg.com/@waline/admin@latest
	const cleanVersion = adminVersion
		.replace(/^npm:@waline\/admin@?/, "")
		.replace(/^@/, "")
		.trim();
	const adminScript =
		cleanVersion && cleanVersion !== "latest"
			? `//unpkg.com/@waline/admin@${cleanVersion}`
			: "//unpkg.com/@waline/admin";

	return `<!doctype html>
<html lang="zh-CN"${htmlVars}>
<head>
  <meta charset="utf-8">
  <title>${siteName ? `${escapeHtml(siteName)} · ` : ""}Waline Management</title>
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="theme-color" content="#FFFCF0">
  <meta name="color-scheme" content="light dark">
${siteUrl ? `  <link rel="icon" href="${escapeAttr(`${siteUrl}/favicon.ico`)}">` : ""}
  ${themeFontLinks}
  ${themeBootstrapScript}
  <script>
    window.serverURL = ${JSON.stringify(serverURL)};
    window.SITE_NAME = ${JSON.stringify(siteName || undefined)};
    window.SITE_URL = ${JSON.stringify(siteUrl || undefined)};
    window.recaptchaV3Key = ${JSON.stringify(recaptchaV3Key || undefined)};
    window.turnstileKey = ${JSON.stringify(turnstileKey || undefined)};
  </script>
  <!-- Block @waline/vercel upgrade notification: irrelevant for Workers deployment.
       The admin header fetches registry.npmjs.org to compare x-waline-version against
       the latest @waline/vercel release. Intercepting that request prevents the popup. -->
  <script>
  (function(){
    var _fetch = window.fetch;
    window.fetch = function(input, init) {
      var url = typeof input === 'string' ? input : (input instanceof Request ? input.url : '');
      if (url.indexOf('registry.npmjs.org/@waline/vercel') !== -1) {
        return Promise.resolve(new Response('{}', {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }));
      }
      return _fetch.call(this, input, init);
    };
  })();
  </script>
  <script src="${adminScript}"></script>
</head>
<body>
<!-- Theme enhancer: runs for every admin page, independent of worker_display. -->
<script>
(function(){
  var TOGGLE_HTML = ${JSON.stringify(themeToggleButton)};
  var scheduled = false;

  function markNav() {
    var path = location.pathname.replace(/\\/+$/, '') || '/ui';
    var links = document.querySelectorAll('#typecho-nav-list a');
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      var href = (a.getAttribute('href') || '').replace(/\\/+$/, '');
      var active =
        href === path || (href !== '/ui' && path.indexOf(href + '/') === 0);
      a.classList.toggle('active', active);
      if (active) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    }
  }

  function addThemeToggle() {
    if (document.querySelector('.wk-theme-toggle')) return;
    var host = document.querySelector('.typecho-head-nav .operate') || document.querySelector('.waline-header');
    if (!host) return;
    var wrap = document.createElement('div');
    wrap.innerHTML = TOGGLE_HTML;
    var btn = wrap.firstElementChild;
    if (!btn) return;
    btn.addEventListener('click', function(){
      if (window.__walineTheme) window.__walineTheme.toggle();
    });
    host.insertBefore(btn, host.firstChild);
  }

  function run() {
    scheduled = false;
    markNav();
    addThemeToggle();
  }
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(run);
  }

  schedule();
  new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
})();
</script>
${
	showWorker
		? `  <script>
  (function(){
    var ORIGIN = ${JSON.stringify(origin)};
    var ALWAYS = ${JSON.stringify(showAlways)};
    var adminOk = false, verified = false, checking = false;

    function addBadge() {
      if (document.querySelector('.wk-badge')) return;
      var op = document.querySelector('.typecho-head-nav .operate');
      if (!op) return;
      var s = document.createElement('span');
      s.className = 'wk-badge';
      s.textContent = 'Worker v1.1.0';
      op.insertBefore(s, op.firstChild);
    }

    function addMenu() {
      if (document.querySelector('.wk-settings-fab')) return;
      var fab = document.createElement('a');
      fab.href = '/ui/worker-setting';
      fab.className = 'wk-settings-fab';
      fab.title = 'Worker 设置';
      fab.setAttribute('aria-label', 'Worker 设置');
      var icon = document.createElement('span');
      icon.className = 'wk-settings-fab-icon';
      icon.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>';
      fab.appendChild(icon);
      document.body.appendChild(fab);
    }

    function ensureUi() {
      if (!adminOk) return;
      addMenu();
      addBadge();
    }

    function verifyAdmin() {
      if (verified || checking) return;
      var tk = window.TOKEN || localStorage.getItem('TOKEN') || sessionStorage.getItem('TOKEN');
      if (!tk) return;
      checking = true;
      fetch(ORIGIN + '/api/token', {
        headers: { Authorization: 'Bearer ' + tk }
      }).then(function(r){ return r.json(); }).then(function(d){
        checking = false;
        verified = true;
        if (d.errno === 0 && d.data && d.data.type === 'administrator') {
          adminOk = true;
          ensureUi();
        }
      }).catch(function(){ checking = false; verified = true; });
    }

    function tryInject() {
      if (ALWAYS) addBadge();
      ensureUi();
      verifyAdmin();
    }

    new MutationObserver(tryInject).observe(document.body, { childList: true, subtree: true });
    var iv = setInterval(function(){
      tryInject();
      if (verified) clearInterval(iv);
    }, 2000);
    setTimeout(tryInject, 300);
  })();
  </script>`
		: ""
}
<style>
${themeBaseCss}
${adminThemeCss()}
</style>
</body>
</html>`;
}

/** Escape a string for use in HTML text/attribute content. */
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
