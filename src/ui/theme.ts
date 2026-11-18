/**
 * Shared visual theme for the admin surfaces (/ui and /ui/worker-setting).
 *
 * The palette and typography mirror the blog at suenyiyang.com:
 * Flexoki "paper" colours, a WenKai / Kai serif stack, hairline rules and
 * a single blue accent. Keeping the tokens in one place means both admin
 * pages stay in sync and a future blog redesign only needs one edit here.
 */

export const THEME_FONT_SERIF =
	'"LXGW WenKai","Kaiti SC","STKaiti","KaiTi","Noto Serif CJK SC","Source Han Serif SC",serif';

export const THEME_FONT_MONO =
	'"IBM Plex Mono",ui-monospace,SFMono-Regular,Menlo,Consolas,monospace';

/** Only trust a well-formed http(s) origin, so it is safe inside url()/href. */
export function normalizeSiteUrl(value: string | undefined): string {
	if (!value) return "";
	try {
		const parsed = new URL(value);
		return parsed.protocol === "https:" || parsed.protocol === "http:"
			? parsed.origin
			: "";
	} catch {
		return "";
	}
}

/**
 * Webfont used by the blog. Loaded from jsDelivr with a system-font fallback
 * so the admin still renders (just with a native Kai font) if the CDN is
 * unreachable. The subset CSS only downloads the glyph ranges actually used.
 */
export const themeFontLinks = `<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/lxgw-wenkai-webfont@1.7.0/lxgwwenkai-regular.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/lxgw-wenkai-webfont@1.7.0/lxgwwenkai-bold.css">`;

/**
 * Must run in <head> before the page paints: resolves light/dark from the
 * (admin-origin) localStorage override or the OS preference and exposes
 * window.__walineTheme for the header toggle.
 */
export const themeBootstrapScript = `<script>
(function () {
  var KEY = 'waline-color-scheme';
  var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  function stored() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function resolve() {
    var pref = stored();
    if (pref === 'light' || pref === 'dark') return pref;
    return mq && mq.matches ? 'dark' : 'light';
  }
  function apply(mode) {
    var dark = mode === 'dark';
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', dark ? '#100F0F' : '#FFFCF0');
  }
  window.__walineTheme = {
    get: resolve,
    set: function (mode) {
      try {
        if (mode === 'auto') localStorage.removeItem(KEY);
        else localStorage.setItem(KEY, mode);
      } catch (e) {}
      apply(resolve());
    },
    toggle: function () { this.set(resolve() === 'dark' ? 'light' : 'dark'); }
  };
  apply(resolve());
  if (mq) {
    var onChange = function () { if (!stored()) apply(resolve()); };
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else if (mq.addListener) mq.addListener(onChange);
  }
  window.addEventListener('storage', function (e) {
    if (!e.key || e.key === KEY) apply(resolve());
  });
})();
</script>`;

export const themeToggleButton = `<button type="button" class="wk-theme-toggle" aria-label="Toggle dark mode" title="Toggle dark mode">
  <svg class="wk-theme-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.4 5.4l1.6 1.6M17 17l1.6 1.6M18.6 5.4 17 7M7 17l-1.6 1.6"/></svg>
  <svg class="wk-theme-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.5 14.4A8.6 8.6 0 1 1 9.6 3.5a6.9 6.9 0 0 0 10.9 10.9Z"/></svg>
</button>`;

/** Flexoki-derived tokens shared by every admin surface. */
export const themeBaseCss = `
:root{
  --wa-font-serif:${THEME_FONT_SERIF};
  --wa-font-mono:${THEME_FONT_MONO};
  --wa-paper:#fffcf0;
  --wa-paper-soft:#f2f0e5;
  --wa-paper-raised:#fffdf7;
  --wa-bg:#fffcf0;
  --wa-text:#100f0f;
  --wa-text-2:#343331;
  --wa-text-3:#575653;
  --wa-muted:#6f6e69;
  --wa-rule:#e6e4d9;
  --wa-rule-strong:#d5d2c4;
  --wa-accent:#027aff;
  --wa-accent-hover:#0064d6;
  --wa-link:#0266d6;
  --wa-primary:#027aff;
  --wa-primary-hover:#0064d6;
  --wa-accent-soft:#027aff14;
  --wa-accent-soft-strong:#027aff24;
  --wa-danger:#af3029;
  --wa-danger-soft:#af302912;
  --wa-success:#66800b;
  --wa-warm:#f2f0e5;
  --wa-code-bg:#f2f0e5;
  --wa-header-bg:rgba(255,252,240,.88);
  --wa-overlay:rgba(255,252,240,.9);
  --wa-shadow-soft:none;
  --wa-shadow:none;
  --wa-radius-xl:14px;
  --wa-radius-lg:12px;
  --wa-radius-md:10px;
  --wa-radius-sm:8px;
  --wa-brand-logo:url('https://waline.js.org/logo.png');
}
html.dark{
  --wa-paper:#100f0f;
  --wa-paper-soft:#1c1b1a;
  --wa-paper-raised:#191817;
  --wa-bg:#100f0f;
  --wa-text:#e6e4d9;
  --wa-text-2:#cecdc3;
  --wa-text-3:#9f9d96;
  --wa-muted:#878580;
  --wa-rule:#343331;
  --wa-rule-strong:#474644;
  --wa-accent:#3b93ff;
  --wa-accent-hover:#62aaff;
  --wa-link:#7bb8ff;
  --wa-primary:#1e6fd0;
  --wa-primary-hover:#2f86e6;
  --wa-accent-soft:#027aff1f;
  --wa-accent-soft-strong:#027aff33;
  --wa-danger:#d14d41;
  --wa-danger-soft:#d14d4114;
  --wa-success:#879a39;
  --wa-warm:#1c1b1a;
  --wa-code-bg:#1c1b1a;
  --wa-header-bg:rgba(16,15,15,.86);
  --wa-overlay:rgba(16,15,15,.92);
}
html{-webkit-text-size-adjust:100%}
body,button,input,select,textarea{font-family:var(--wa-font-serif)}
::selection{background:var(--wa-accent-soft-strong)}
:focus-visible{outline:2px solid var(--wa-accent);outline-offset:2px}
.wk-theme-toggle{
  display:inline-flex;align-items:center;justify-content:center;flex:none;
  width:38px;height:38px;padding:0;border:1px solid var(--wa-rule);border-radius:999px;
  background:transparent;color:var(--wa-text-3);cursor:pointer;
  transition:color .18s,border-color .18s,background-color .18s;
}
.wk-theme-toggle:hover{color:var(--wa-text);border-color:var(--wa-rule-strong);background:var(--wa-accent-soft)}
.wk-theme-toggle svg{width:17px;height:17px}
.wk-theme-toggle .wk-theme-moon{display:none}
html.dark .wk-theme-toggle .wk-theme-sun{display:none}
html.dark .wk-theme-toggle .wk-theme-moon{display:block}
`;
