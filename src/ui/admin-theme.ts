/**
 * @waline/admin visual overrides.
 *
 * The CDN bundle injects its own stylesheet when it boots; this sheet is emitted
 * afterwards in the page body, so rules with equal specificity win by source
 * order. It retunes the bundle to the suenyiyang.com reading theme and reflows
 * the tables, header and login card for small screens.
 */
export function adminThemeCss(): string {
	return `
html,body,body.waline-body{background:var(--wa-bg)}
body.waline-body{
  color:var(--wa-text);
  font-family:var(--wa-font-serif);
  font-size:15px;
  line-height:1.7;
  -webkit-font-smoothing:antialiased;
  -moz-osx-font-smoothing:grayscale;
}
body.waline-body h1,body.waline-body h2,body.waline-body h3,
body.waline-body h4,body.waline-body h5,body.waline-body h6{
  font-family:var(--wa-font-serif);color:var(--wa-text);letter-spacing:.01em;
}
body.waline-body a{color:var(--wa-link)}
body.waline-body ::selection{background:var(--wa-accent-soft-strong)}
body.waline-body *{scrollbar-width:thin;scrollbar-color:var(--wa-rule-strong) transparent}
body.waline-body ::-webkit-scrollbar{width:8px;height:8px}
body.waline-body ::-webkit-scrollbar-thumb{background:var(--wa-rule-strong);border-radius:99px}
body.waline-body ::-webkit-scrollbar-track{background:transparent}

/* ---------- header ---------- */
body.waline-body .typecho-head-nav{
  position:sticky;top:0;z-index:40;
  padding:0 24px;
  background:var(--wa-header-bg);
  -webkit-backdrop-filter:saturate(1.4) blur(14px);
  backdrop-filter:saturate(1.4) blur(14px);
  border-bottom:1px solid var(--wa-rule);
}
body.waline-body .waline-header{
  display:flex;align-items:center;justify-content:space-between;gap:24px;
  max-width:1100px;margin:0 auto;padding:11px 0;
  border:0;border-radius:0;background:transparent;box-shadow:none;
}
body.waline-body .waline-brand-link{gap:10px;color:var(--wa-text);text-decoration:none}
body.waline-body .waline-brand-mark{
  width:34px;height:34px;flex:none;
  background-image:var(--wa-brand-logo);background-position:center;background-size:cover;
  background-repeat:no-repeat;border-radius:50%;filter:none;
  box-shadow:0 0 0 1px var(--wa-rule) inset;
}
body.waline-body .waline-brand-copy strong{
  font-size:1rem;font-weight:700;letter-spacing:.02em;color:var(--wa-text);
}
body.waline-body .waline-brand-copy small{
  font-family:var(--wa-font-mono);font-size:.64rem;letter-spacing:.14em;
  text-transform:uppercase;color:var(--wa-muted);
}
body.waline-body .waline-nav{display:flex;align-items:center;flex:1;justify-content:flex-end}
body.waline-body .waline-nav .root{gap:24px;align-items:center;flex-wrap:nowrap}
body.waline-body .waline-nav .parent{margin:0}
body.waline-body .waline-nav .parent a,
body.waline-body .waline-nav-static span{
  position:relative;display:inline-block;
  padding:8px 0;border:0;border-radius:0;background:transparent;
  color:var(--wa-text-3);font-size:.95rem;font-weight:400;letter-spacing:.01em;
  text-decoration:none;transform:none;overflow:visible;
  transition:color .16s;
}
body.waline-body .waline-nav .parent a:after{
  content:"";position:absolute;left:0;right:0;bottom:2px;height:2px;border-radius:2px;
  background:var(--wa-accent);transform:scaleX(0);transform-origin:left center;
  transition:transform .2s ease;
}
body.waline-body .waline-nav .parent a:hover,
body.waline-body .waline-nav .parent a:focus,
body.waline-body .waline-nav .parent a.active{
  color:var(--wa-text);background:transparent;transform:none;text-decoration:none;
}
body.waline-body .waline-nav .parent a:hover:after,
body.waline-body .waline-nav .parent a:focus:after,
body.waline-body .waline-nav .parent a.active:after{transform:scaleX(1)}

/* The CDN bundle targets #typecho-nav-list (ID specificity), so restate the
   link geometry here instead of fighting it per-property. */
body.waline-body #typecho-nav-list .parent a{
  display:inline-block;float:none;height:auto;line-height:1.5;padding:8px 0;
  color:var(--wa-text-3);background:transparent;font-weight:400;
}
body.waline-body #typecho-nav-list .parent a:hover,
body.waline-body #typecho-nav-list .parent a:focus,
body.waline-body #typecho-nav-list .parent a.active,
body.waline-body #typecho-nav-list .focus .parent a{
  color:var(--wa-text);background:transparent;font-weight:400;
}
body.waline-body #typecho-nav-list .parent a.active{color:var(--wa-text)}

body.waline-body .typecho-head-nav .operate{
  display:flex;align-items:center;justify-content:flex-end;gap:10px;flex:none;
}
body.waline-body .typecho-head-nav .operate .language-select{display:flex;align-items:center}
body.waline-body .typecho-head-nav .operate .language-select select{
  -webkit-appearance:none;appearance:none;
  height:38px;max-width:9.5rem;padding:0 26px 0 12px;
  border:1px solid var(--wa-rule);border-radius:999px;background-color:transparent;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236f6e69' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat:no-repeat;background-position:right 10px center;
  color:var(--wa-text-3);font-size:.82rem;line-height:36px;outline:none;
  text-overflow:ellipsis;
}
html.dark body.waline-body .typecho-head-nav .operate .language-select select{
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239f9d96' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
}
body.waline-body .typecho-head-nav .operate .language-select select:focus{
  border-color:var(--wa-accent);box-shadow:0 0 0 3px var(--wa-accent-soft);
}
body.waline-body .typecho-head-nav .operate .author{
  height:38px;padding:0 12px 0 6px;gap:8px;
  border:1px solid var(--wa-rule);border-radius:999px;background:transparent;
  color:var(--wa-text-3);font-size:.85rem;line-height:36px;text-decoration:none;
  transition:border-color .16s,color .16s,background-color .16s;
}
body.waline-body .typecho-head-nav .operate .author:hover{
  border-color:var(--wa-rule-strong);background:var(--wa-accent-soft);
  color:var(--wa-text);transform:none;box-shadow:none;text-decoration:none;
}
body.waline-body .author-avatar{
  width:26px;height:26px;border-radius:50%;background:var(--wa-paper-soft);
  box-shadow:0 0 0 1px var(--wa-rule) inset;
}
body.waline-body .typecho-head-nav .operate .exit,
body.waline-body .typecho-head-nav .operate button{
  height:38px;margin:0;padding:0 16px;
  border:1px solid var(--wa-rule);border-radius:999px;background:transparent;
  color:var(--wa-text-3);font-size:.85rem;font-weight:400;line-height:36px;
  box-shadow:none;transform:none;
  transition:border-color .16s,color .16s,background-color .16s;
}
body.waline-body .typecho-head-nav .operate .exit:hover,
body.waline-body .typecho-head-nav .operate button:hover{
  border-color:var(--wa-rule-strong);background:var(--wa-accent-soft);
  color:var(--wa-text);box-shadow:none;transform:none;
}
body.waline-body .wk-badge{
  display:inline-block;margin:0 2px 0 0;padding:0 8px;
  background:var(--wa-accent-soft);color:var(--wa-accent-hover);
  font-family:var(--wa-font-mono);font-size:.64rem;font-weight:500;
  letter-spacing:.04em;line-height:20px;border-radius:999px;vertical-align:middle;
  white-space:nowrap;
}
body.waline-body .upgrade-tips{
  max-width:1100px;margin:14px auto 0;padding:9px 13px;
  border:1px solid var(--wa-rule);border-left:2px solid var(--wa-rule-strong);
  border-radius:8px;background:transparent;
  color:var(--wa-muted);font-size:.79rem;line-height:1.6;box-shadow:none;
}
body.waline-body .upgrade-tips a{color:var(--wa-link)}

/* ---------- page shell ---------- */
body.waline-body .main{padding:26px 24px 72px}
body.waline-body .main .body.container{
  max-width:1100px;margin:0 auto;padding:0;
  border:0;border-radius:0;background:transparent;box-shadow:none;
}
body.waline-body .typecho-page-title{margin:0 0 20px}
body.waline-body .typecho-page-title h2{
  margin:0;font-size:1.6rem;font-weight:700;letter-spacing:.015em;color:var(--wa-text);
}
body.waline-body .typecho-page-title:after{
  content:"";display:block;width:28px;height:3px;margin-top:10px;
  border-radius:2px;background:var(--wa-accent);
}
body.waline-body .row{zoom:1}

/* ---------- tabs ---------- */
body.waline-body .typecho-option-tabs{
  display:inline-flex;flex-wrap:wrap;gap:20px;margin:0 0 18px;padding:0;
  border:0;border-radius:0;background:transparent;box-shadow:none;vertical-align:bottom;
}
body.waline-body .typecho-option-tabs li{margin:0}
body.waline-body .typecho-option-tabs li button,
body.waline-body .typecho-option-tabs li a{
  display:inline-flex;align-items:center;min-height:0;padding:6px 0;
  border:0;border-bottom:2px solid transparent;border-radius:0;background:transparent;
  color:var(--wa-text-3);font-family:inherit;font-size:.92rem;font-weight:400;
  line-height:1.5;box-shadow:none;cursor:pointer;
}
body.waline-body .typecho-option-tabs li button:hover,
body.waline-body .typecho-option-tabs li a:hover{color:var(--wa-text);background:transparent;box-shadow:none;text-decoration:none}
body.waline-body .typecho-option-tabs li.current button,
body.waline-body .typecho-option-tabs li.current a{
  color:var(--wa-text);font-weight:700;background:transparent;box-shadow:none;
  border-bottom-color:var(--wa-accent);
}
body.waline-body .balloon,body.waline-body a.balloon-button{
  min-width:20px;height:20px;padding:0 7px;
  display:inline-flex;align-items:center;justify-content:center;
  border-radius:999px;background:var(--wa-accent-soft);color:var(--wa-accent-hover);
  font-family:var(--wa-font-mono);font-size:.72rem;font-weight:500;
}

/* ---------- toolbar ---------- */
body.waline-body .typecho-list-operate{
  margin-bottom:16px;padding:12px 14px;
  border:1px solid var(--wa-rule);border-radius:12px;background:transparent;box-shadow:none;
  color:var(--wa-text);
}
body.waline-body .typecho-list-operate form{gap:12px}
body.waline-body .typecho-list-operate .search{gap:8px}
body.waline-body .typecho-list-operate:has(.typecho-pager){
  margin-top:2px;padding:0;border:0;background:transparent;
}
body.waline-body .typecho-list-operate:has(> form:empty){display:none}
body.waline-body label{color:var(--wa-text-2)}

/* ---------- form controls ---------- */
body.waline-body input[type="text"],
body.waline-body input[type="password"],
body.waline-body input[type="email"],
body.waline-body input[type="url"],
body.waline-body input[type="search"],
body.waline-body input[type="number"],
body.waline-body textarea,
body.waline-body select{
  max-width:100%;
  border:1px solid var(--wa-rule-strong);border-radius:9px;
  background:var(--wa-paper);color:var(--wa-text);
  font-family:inherit;font-size:.92rem;line-height:1.5;box-shadow:none;
}
body.waline-body input[type="text"],
body.waline-body input[type="password"],
body.waline-body input[type="email"],
body.waline-body input[type="url"],
body.waline-body input[type="search"],
body.waline-body input[type="number"],
body.waline-body select{height:40px;padding:0 12px}
body.waline-body textarea{padding:9px 12px;resize:vertical;min-height:90px}
body.waline-body select{
  padding-right:30px;
  -webkit-appearance:none;appearance:none;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236f6e69' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat:no-repeat;background-position:right 11px center;
}
html.dark body.waline-body select{
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239f9d96' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
}
body.waline-body input::placeholder,body.waline-body textarea::placeholder{color:var(--wa-muted);opacity:1}
body.waline-body input[type="text"]:focus,
body.waline-body input[type="password"]:focus,
body.waline-body input[type="email"]:focus,
body.waline-body input[type="url"]:focus,
body.waline-body input[type="search"]:focus,
body.waline-body input[type="number"]:focus,
body.waline-body textarea:focus,
body.waline-body select:focus{
  outline:none;border-color:var(--wa-accent);
  box-shadow:0 0 0 3px var(--wa-accent-soft);
}
body.waline-body input[type="checkbox"],
body.waline-body input[type="radio"]{accent-color:var(--wa-accent)}
body.waline-body input[type="text"].text-l{font-size:1rem}
body.waline-body .typecho-option{margin:0 0 18px}
body.waline-body .typecho-option label.typecho-label{
  display:block;margin-bottom:6px;
  color:var(--wa-text-2);font-size:.82rem;font-weight:700;letter-spacing:.01em;
}
body.waline-body .typecho-option .description{
  margin:6px 0 0;color:var(--wa-muted);font-size:.78rem;line-height:1.6;
}
body.waline-body .typecho-option-submit{margin:22px 0 0}
body.waline-body .typecho-option-submit li{border:0}

/* ---------- buttons ---------- */
body.waline-body .btn{
  display:inline-flex;align-items:center;justify-content:center;gap:6px;
  height:36px;padding:0 16px;
  border:1px solid var(--wa-rule-strong);border-radius:999px;background:transparent;
  color:var(--wa-text-2);font-family:inherit;font-size:.86rem;font-weight:500;
  line-height:1;cursor:pointer;box-shadow:none;
  transition:border-color .16s,color .16s,background-color .16s;
}
body.waline-body .btn:hover{background:var(--wa-accent-soft);border-color:var(--wa-accent);color:var(--wa-accent-hover)}
body.waline-body .btn:active,body.waline-body .btn.active{background:var(--wa-accent-soft-strong)}
body.waline-body .btn:disabled{opacity:.5;background:transparent;color:var(--wa-muted);border-color:var(--wa-rule);cursor:not-allowed}
body.waline-body .btn-xs,body.waline-body .btn-s{height:30px;padding:0 12px;font-size:.8rem}
body.waline-body .btn-l{height:46px;padding:0 22px;font-size:.95rem;font-weight:700}
body.waline-body .primary,
body.waline-body .btn.primary{
  border:1px solid var(--wa-primary);background:var(--wa-primary);color:#fff;
  box-shadow:none;
}
body.waline-body .primary:hover,
body.waline-body .btn.primary:hover{background:var(--wa-primary-hover);border-color:var(--wa-primary-hover);color:#fff}
body.waline-body .primary:active,body.waline-body .primary.active{background:var(--wa-primary-hover);border-color:var(--wa-primary-hover)}
body.waline-body .primary:disabled{background:var(--wa-primary);border-color:var(--wa-primary);color:#fff;opacity:.45}
body.waline-body .btn-warn{border-color:#af30295c;color:var(--wa-danger);background:transparent}
body.waline-body .btn-warn:hover{background:var(--wa-danger-soft);border-color:var(--wa-danger);color:var(--wa-danger)}
body.waline-body .btn-link{height:auto;padding:0;border:0;background:none;color:var(--wa-link)}
body.waline-body .btn-group{display:inline-flex}

/* ---------- dropdowns ---------- */
body.waline-body .dropdown-menu{
  min-width:180px;padding:6px;margin-top:6px;
  border:1px solid var(--wa-rule);border-radius:10px;background:var(--wa-paper-raised);
  box-shadow:0 10px 30px rgba(16,15,15,.10);
}
html.dark body.waline-body .dropdown-menu{box-shadow:0 10px 30px rgba(0,0,0,.45)}
body.waline-body .dropdown-menu button,
body.waline-body .dropdown-menu a{
  display:block;width:100%;padding:8px 10px;
  border:0;border-radius:7px;background:transparent;color:var(--wa-text-2);
  font-family:inherit;font-size:.86rem;text-align:left;cursor:pointer;
}
body.waline-body .dropdown-menu button:hover,
body.waline-body .dropdown-menu a:hover{background:var(--wa-accent-soft);color:var(--wa-accent-hover);text-decoration:none}

/* ---------- tables ---------- */
body.waline-body .typecho-table-wrap{
  padding:0;overflow:hidden;
  border:1px solid var(--wa-rule);border-radius:12px;
  background:transparent;box-shadow:none;
}
body.waline-body .typecho-list-table{
  width:100%;border-collapse:collapse;table-layout:fixed;
}
body.waline-body .typecho-list-table th{
  padding:11px 16px;border:0;border-bottom:1px solid var(--wa-rule);
  background:var(--wa-paper-soft);color:var(--wa-muted);
  font-family:var(--wa-font-mono);font-size:.68rem;font-weight:500;
  letter-spacing:.09em;text-transform:uppercase;text-align:left;vertical-align:middle;
}
body.waline-body .typecho-list-table td{
  padding:16px;border:0;border-top:1px solid var(--wa-rule);
  color:var(--wa-text-2);font-size:.9rem;vertical-align:top;
  overflow-wrap:anywhere;word-break:normal;
}
body.waline-body .typecho-list-table tbody tr:first-child td{border-top:0}
body.waline-body .typecho-list-table tbody tr:hover td{background:var(--wa-paper-soft)}
body.waline-body .typecho-list-table tbody tr.checked td{background:var(--wa-accent-soft)}
body.waline-body .typecho-list-table .status{color:var(--wa-muted)}
body.waline-body .typecho-list-table-title{color:var(--wa-muted);font-size:.85rem}
body.waline-body .typecho-list-table tr td .hidden-by-mouse,
body.waline-body .typecho-list-table tr .hidden-by-mouse{opacity:1}

/* comment rows */
body.waline-body .comment-avatar img,
body.waline-body .user-avatar img,
body.waline-body .avatar{
  width:40px;height:40px;border:0;border-radius:50%;
  box-shadow:0 0 0 1px var(--wa-rule) inset;
}
body.waline-body .comment-head{font-size:.85rem;line-height:1.75}
body.waline-body .comment-author a,
body.waline-body .comment-head a{color:var(--wa-text);text-decoration:none}
body.waline-body .comment-author a:hover,
body.waline-body .comment-head a:hover{color:var(--wa-link);text-decoration:underline;text-underline-offset:.2em}
body.waline-body .comment-meta span,body.waline-body .comment-date{
  color:var(--wa-muted);font-family:var(--wa-font-mono);font-size:.72rem;
  letter-spacing:0;line-height:1.7;
}
body.waline-body .comment-meta span a{color:var(--wa-muted)}
body.waline-body .comment-date{margin-bottom:8px}
body.waline-body .comment-date a{color:var(--wa-link)}
body.waline-body .comment-body{font-size:.9rem}
body.waline-body .comment-content{line-height:1.8;color:var(--wa-text-2)}
body.waline-body .comment-content p{margin:.2em 0}
body.waline-body .comment-content code{background:var(--wa-code-bg);border-radius:4px;padding:.1em .35em;font-family:var(--wa-font-mono);font-size:.85em}
body.waline-body .comment-reply-content{
  margin:10px 0;padding:2px 14px;
  border:0;border-left:2px solid var(--wa-rule-strong);border-radius:0;
  background:var(--wa-paper-soft);color:var(--wa-text-3);
}
body.waline-body .comment-reply-content:after{display:none}
body.waline-body .comment-action{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
body.waline-body .comment-action button,
body.waline-body .comment-action span{
  display:inline-flex;align-items:center;justify-content:center;
  min-height:0;height:30px;margin:0;padding:0 12px;
  border:1px solid var(--wa-rule);border-radius:999px;background:transparent;
  color:var(--wa-text-3);font-family:inherit;font-size:.78rem;font-weight:500;
  line-height:1;box-shadow:none;
  transition:border-color .16s,color .16s,background-color .16s;
}
body.waline-body .comment-action button:hover{
  border-color:var(--wa-accent);background:var(--wa-accent-soft);
  color:var(--wa-accent-hover);transform:none;box-shadow:none;
}
body.waline-body .comment-action span.weak{
  border-color:transparent;background:var(--wa-accent-soft);color:var(--wa-accent-hover);
}
body.waline-body button.operate-delete,body.waline-body button.operate-button-delete{color:var(--wa-danger);border-color:#af302947}
body.waline-body button.operate-delete:hover,body.waline-body button.operate-button-delete:hover{
  color:var(--wa-danger);background:var(--wa-danger-soft);border-color:var(--wa-danger);
}
body.waline-body .warning{color:var(--wa-danger)}
/* Migration page uses inline 80px/30px buttons — bring them back to scale. */
body.waline-body .typecho-page-main .col-tb-6 .btn{
  height:52px !important;padding:0 26px !important;font-size:1rem !important;
}
body.waline-body .typecho-page-main .col-tb-6 .btn-group{display:inline-flex;align-items:center;gap:6px}
body.waline-body .typecho-page-main .col-tb-6 .btn-group .btn{padding:0 14px !important}
body.waline-body .btn.error{
  border-color:#af302952;background:transparent;color:var(--wa-danger);
}
body.waline-body .btn.error:hover{background:var(--wa-danger-soft);border-color:var(--wa-danger);color:var(--wa-danger)}


/* ---------- profile ---------- */
body.waline-body .col-tb-3{
  padding:28px 20px;text-align:center;
  border:1px solid var(--wa-rule);border-radius:14px;background:var(--wa-paper-soft);
  box-shadow:none;
}
body.waline-body .col-tb-3 > p:first-child,
body.waline-body .col-tb-3 > h2,
body.waline-body .col-tb-3 > p + p{color:var(--wa-text)}
body.waline-body .col-tb-3 > h2{margin:12px 0 2px;font-size:1.15rem;font-weight:700}
body.waline-body .col-tb-3 > p + p{
  color:var(--wa-muted);font-family:var(--wa-font-mono);font-size:.76rem;
  overflow-wrap:anywhere;
}
body.waline-body .profile-avatar{
  width:84px;height:84px;border:0;border-radius:50%;
  box-shadow:0 0 0 1px var(--wa-rule) inset;
}
body.waline-body .profile-avatar-btn{padding:0;border:0;border-radius:50%;background:none;cursor:pointer}
body.waline-body .typecho-content-panel{
  padding:0;border:0;border-radius:0;background:transparent;box-shadow:none;
}
body.waline-body .typecho-content-panel section{
  padding:0;border:0;border-radius:0;background:transparent;box-shadow:none;
}
body.waline-body .typecho-content-panel section ~ section{
  margin-top:28px;padding-top:28px;border-top:1px solid var(--wa-rule);
}
body.waline-body .typecho-content-panel br{display:none}
body.waline-body .typecho-content-panel h3,
body.waline-body .col-tb-3 h2{color:var(--wa-text);font-size:1.08rem;font-weight:700}
body.waline-body .typecho-content-panel h3{margin:0 0 16px}
body.waline-body .typecho-content-panel section > div > p{
  color:var(--wa-text-3);font-size:.88rem;line-height:1.8;
}
body.waline-body .account-list{display:flex;flex-wrap:wrap;gap:10px}
body.waline-body .account-item{margin:0}
body.waline-body .account-item > a{
  width:44px;height:44px;display:inline-flex;align-items:center;justify-content:center;
  border:1px solid var(--wa-rule);border-radius:12px;background:var(--wa-paper);
  box-shadow:none;opacity:.55;transition:opacity .16s,border-color .16s,transform .16s;
}
body.waline-body .account-item > a:hover{opacity:1;border-color:var(--wa-rule-strong);transform:none}
body.waline-body .account-item.bind > a{opacity:1}
body.waline-body .account-item svg,
body.waline-body .social-accounts svg{filter:grayscale(1);transition:filter .16s}
body.waline-body .account-item:hover svg,
body.waline-body .social-accounts a:hover svg{filter:none}
body.waline-body .social-icon{width:26px;height:26px}
body.waline-body .user-page-account-item .social-icon{width:15px;height:15px}

/* ---------- misc ---------- */
body.waline-body .typecho-pager{display:flex;flex-wrap:wrap;justify-content:flex-end;align-items:center;gap:6px;margin:18px 0 0 auto}
body.waline-body .typecho-pager li{min-width:36px;height:36px;margin:0;display:flex;align-items:center;justify-content:center}
body.waline-body .typecho-pager li span,
body.waline-body .typecho-pager button{
  min-width:36px;height:36px;padding:0 10px;
  display:inline-flex;align-items:center;justify-content:center;
  border:1px solid var(--wa-rule);border-radius:999px;background:transparent;
  color:var(--wa-text-2);font-family:var(--wa-font-mono);font-size:.8rem;
  font-weight:500;line-height:1;cursor:pointer;box-shadow:none;
}
body.waline-body .typecho-pager li span{color:var(--wa-muted);border-color:transparent}
body.waline-body .typecho-pager button:hover{border-color:var(--wa-accent);background:var(--wa-accent-soft);color:var(--wa-accent-hover);transform:none;box-shadow:none}
body.waline-body .typecho-pager li.current button{
  border-color:transparent;background:var(--wa-accent-soft);color:var(--wa-accent-hover);box-shadow:none;
}
body.waline-body .message{border-radius:9px;font-size:.85rem;line-height:1.65}
body.waline-body .error{color:var(--wa-danger);background:var(--wa-danger-soft)}
body.waline-body .success{color:var(--wa-success);background:var(--wa-paper-soft)}
body.waline-body .message.popup.notice{
  position:relative;left:auto;transform:none;
  width:min(720px,100%);margin:14px 0 0;padding:0;
}
body.waline-body .message.popup.notice ul{
  margin:0;padding:11px 14px;
  border:1px solid var(--wa-rule);border-left:3px solid var(--wa-accent);
  border-radius:10px;background:var(--wa-paper-soft);box-shadow:none;
  color:var(--wa-text-2);font-size:.84rem;
}
body.waline-body .message.popup.notice ul li{margin:0}

/* ---------- login / register / forgot ---------- */
body.waline-body .typecho-login-wrap{
  display:flex;align-items:center;justify-content:center;
  min-height:calc(100vh - 62px);height:auto;
  padding:clamp(24px,6vw,56px) 20px 64px;
}
body.waline-body .typecho-login{
  width:min(430px,100%);padding:30px 26px 24px;
  border:1px solid var(--wa-rule);border-radius:14px;
  background:var(--wa-paper-raised);box-shadow:none;
}
body.waline-body .typecho-login:before{
  content:"";display:block;width:26px;height:3px;margin:0 auto 22px;
  border-radius:2px;background:var(--wa-accent);
}
body.waline-body .typecho-login form p{margin:0 0 14px}
body.waline-body .typecho-login .text-l{height:46px;font-size:.95rem}
body.waline-body .typecho-login .submit{margin-top:18px}
body.waline-body .typecho-login .primary{height:46px;font-size:.95rem;font-weight:700}
body.waline-body .typecho-login label{color:var(--wa-text-3);font-size:.82rem}
body.waline-body .typecho-login .forgot-password a{color:var(--wa-link);font-size:.82rem}
body.waline-body .typecho-login .forgot-password a:hover{text-decoration:underline;text-underline-offset:.2em}
body.waline-body .typecho-login input[type="checkbox"]{margin-right:5px;vertical-align:-1px}
body.waline-body .social-accounts{
  display:flex;flex-wrap:wrap;justify-content:center;gap:10px;margin-top:22px;padding-top:20px;
  border-top:1px solid var(--wa-rule);
}
body.waline-body .social-accounts a{
  width:44px;height:44px;margin:0;
  display:inline-flex;align-items:center;justify-content:center;
  border:1px solid var(--wa-rule);border-radius:12px;background:var(--wa-paper);
  opacity:.6;transition:opacity .16s,border-color .16s;
}
body.waline-body .social-accounts a:hover{opacity:1;border-color:var(--wa-rule-strong);transform:none}
body.waline-body .social-accounts .social-icon{width:26px;height:26px}
body.waline-body .more-link{
  margin-top:20px;padding-top:16px;border-top:1px solid var(--wa-rule);
  color:var(--wa-muted);font-size:.8rem;text-align:center;
}
body.waline-body .more-link a{color:var(--wa-link)}

/* ---------- settings FAB ---------- */
body.waline-body .wk-settings-fab{
  position:fixed;right:22px;bottom:22px;z-index:9999;
  width:44px;height:44px;border-radius:50%;
  display:flex;align-items:center;justify-content:center;
  border:1px solid var(--wa-rule);background:var(--wa-paper);
  box-shadow:0 6px 18px rgba(16,15,15,.12);
  transition:transform .16s,border-color .16s,box-shadow .16s;
}
html.dark body.waline-body .wk-settings-fab{box-shadow:0 6px 18px rgba(0,0,0,.5)}
body.waline-body .wk-settings-fab .wk-settings-fab-icon{display:flex;color:var(--wa-text-3)}
body.waline-body .wk-settings-fab .wk-settings-fab-icon svg{width:20px;height:20px}
body.waline-body .wk-settings-fab:hover .wk-settings-fab-icon{color:var(--wa-accent)}
body.waline-body .wk-settings-fab:hover{transform:translateY(-2px);border-color:var(--wa-accent)}

/* ---------- responsive ---------- */
@media (max-width:960px){
  body.waline-body .typecho-head-nav{padding:0 16px}
  body.waline-body .main{padding:20px 16px 64px}
  body.waline-body .typecho-page-title h2{font-size:1.4rem}
  body.waline-body .typecho-list-operate{padding:12px}
  body.waline-body .typecho-list-operate form{flex-direction:column;align-items:stretch;gap:10px}
  body.waline-body .typecho-list-operate .operate{
    flex-direction:row;flex-wrap:wrap;align-items:center;justify-content:flex-start;
    gap:10px;width:100%;
  }
  body.waline-body .typecho-list-operate .search{
    display:flex;flex-direction:row;align-items:center;gap:8px;width:100%;
  }
  body.waline-body .typecho-list-operate .search input{flex:1 1 auto;min-width:0;width:auto}
  body.waline-body .typecho-list-operate .search .btn{flex:0 0 auto;width:auto;padding:0 16px}

}
/* Header switches to two rows before the nav can collide with the controls. */
@media (max-width:860px){
  body.waline-body .typecho-head-nav{padding:8px 16px 0}
  body.waline-body .waline-header{
    display:grid;
    grid-template-columns:minmax(0,1fr) 34px 34px auto;
    grid-template-areas:
      "brand theme author exit"
      "nav nav nav lang";
    align-items:center;column-gap:8px;row-gap:0;
    padding:0;max-width:none;
  }
  body.waline-body .waline-brand{grid-area:brand;min-width:0;overflow:hidden}
  body.waline-body .waline-brand-link{display:flex;max-width:100%;min-width:0;gap:8px}
  body.waline-body .waline-brand-mark{width:30px;height:30px}
  body.waline-body .waline-brand-copy{flex:1 1 auto;min-width:0;overflow:hidden}
  body.waline-body .waline-brand-copy strong{
    display:block;max-width:100%;overflow:hidden;text-overflow:ellipsis;
    white-space:nowrap;font-size:.92rem;
  }
  body.waline-body .waline-nav{grid-area:nav;min-width:0;width:100%}
  body.waline-body .waline-nav .root{
    gap:20px;overflow-x:auto;overflow-y:hidden;flex-wrap:nowrap;
    scrollbar-width:none;-webkit-overflow-scrolling:touch;
    padding:0;margin:0;justify-content:flex-start;
  }
  body.waline-body .waline-nav .root::-webkit-scrollbar{display:none}
  body.waline-body #typecho-nav-list .parent a{padding:9px 0;font-size:.9rem;white-space:nowrap}
  body.waline-body .typecho-head-nav .operate{display:contents}
  body.waline-body .typecho-head-nav .operate .author{
    grid-area:author;height:34px;width:34px;padding:0;justify-content:center;border:0;
  }
  body.waline-body .author-avatar{width:30px;height:30px}
  body.waline-body .author-name{display:none}
  body.waline-body .typecho-head-nav .wk-theme-toggle{grid-area:theme;width:34px;height:34px}
  body.waline-body .typecho-head-nav .operate .exit,
  body.waline-body .typecho-head-nav .operate button:not(.wk-theme-toggle){
    grid-area:exit;justify-self:end;height:34px;padding:0 12px;
    font-size:.78rem;line-height:32px;white-space:nowrap;
  }
  body.waline-body .typecho-head-nav .operate .language-select{
    grid-area:lang;justify-self:end;width:96px;min-width:0;
    padding:0;box-sizing:border-box;
  }
  body.waline-body .typecho-head-nav .operate .language-select select{
    width:100%;max-width:100%;height:30px;padding:0 22px 0 9px;
    font-size:.75rem;line-height:28px;background-position:right 7px center;
  }
  body.waline-body .wk-badge{display:none}
  body.waline-body .upgrade-tips{margin-top:10px;font-size:.78rem}

  /* Login has no nav, so keep brand + controls on a single row. */
  body.waline-body:has(.typecho-login) .waline-header{
    display:flex;flex-wrap:nowrap;justify-content:space-between;gap:12px;
  }
  body.waline-body:has(.typecho-login) .waline-brand{flex:1 1 auto;min-width:0;overflow:hidden}
  body.waline-body:has(.typecho-login) .typecho-head-nav .operate{
    display:flex;flex-wrap:nowrap;justify-content:flex-end;gap:8px;
    width:auto;flex:0 0 auto;
  }
  body.waline-body:has(.typecho-login) .typecho-head-nav .operate .language-select{
    grid-area:auto;justify-self:auto;width:112px;padding:0;box-sizing:border-box;
  }
  body.waline-body:has(.typecho-login) .typecho-head-nav .operate .language-select select{height:34px}
  body.waline-body:has(.typecho-login) .typecho-head-nav .wk-theme-toggle{grid-area:auto}
  /* comment table becomes a stack of cards */
  body.waline-body .typecho-table-wrap{overflow:visible;border:0;border-radius:0;background:transparent}
  body.waline-body .typecho-list-table,
  body.waline-body .typecho-list-table tbody,
  body.waline-body .typecho-list-table tr{display:block;width:100%}
  body.waline-body .typecho-list-table colgroup,
  body.waline-body .typecho-list-table thead{display:none}
  body.waline-body .typecho-list-table td{display:block;border:0;padding:0;background:transparent}
  body.waline-body .typecho-list-table tbody tr:hover td{background:transparent}
  body.waline-body .typecho-list-table tr:has(.comment-body){
    display:grid;
    grid-template-columns:24px 40px minmax(0,1fr);
    grid-template-areas:
      "check avatar head"
      "body body body";
    column-gap:12px;row-gap:8px;
    padding:16px 2px;border-top:1px solid var(--wa-rule);
  }
  body.waline-body .typecho-list-table tr:has(.comment-body):last-child{border-bottom:1px solid var(--wa-rule)}
  body.waline-body .typecho-list-table tr:has(.comment-body) > td:nth-child(1){grid-area:check;align-self:start;padding-top:2px}
  body.waline-body .typecho-list-table tr:has(.comment-body) > td:nth-child(2){grid-area:avatar;align-self:start}
  body.waline-body .typecho-list-table tr:has(.comment-body) > .comment-head{grid-area:head;align-self:start}
  body.waline-body .typecho-list-table tr:has(.comment-body) > .comment-body{grid-area:body;padding-top:2px}
  body.waline-body .comment-head{font-size:.82rem;line-height:1.65}
  body.waline-body .comment-meta br{display:none}
  body.waline-body .comment-meta br:first-of-type{display:block}
  body.waline-body .comment-meta span{display:inline-block;margin-right:8px}
  body.waline-body .comment-meta span + span:before{content:"·";margin-right:8px;color:var(--wa-rule-strong)}
  body.waline-body .comment-content{font-size:.92rem;line-height:1.8}
  body.waline-body .comment-action{gap:6px;margin-top:10px}
  body.waline-body .comment-action button,
  body.waline-body .comment-action span{height:32px;padding:0 12px;font-size:.78rem}

  /* user table: card layout with labelled values */
  body.waline-body .typecho-table-wrap:has(.user-avatar){
    overflow:visible;border:0;border-radius:0;background:transparent;
  }
  body.waline-body .typecho-list-table:has(.user-avatar),
  body.waline-body .typecho-list-table:has(.user-avatar) tbody,
  body.waline-body .typecho-list-table:has(.user-avatar) tr{display:block;width:100%}
  body.waline-body .typecho-list-table:has(.user-avatar) colgroup,
  body.waline-body .typecho-list-table:has(.user-avatar) thead{display:none}
  body.waline-body .typecho-list-table:has(.user-avatar) td{
    display:block;border:0;padding:0;background:transparent;
  }
  body.waline-body .typecho-list-table:has(.user-avatar) tbody tr:hover td{background:transparent}
  body.waline-body .typecho-list-table tr:has(.user-avatar){
    display:grid;
    grid-template-columns:40px minmax(0,1fr);
    grid-template-areas:
      "avatar nick"
      "email email"
      "role role"
      "label label"
      "action action";
    column-gap:12px;row-gap:8px;
    padding:16px 2px;border-top:1px solid var(--wa-rule);
  }
  body.waline-body .typecho-list-table tr:has(.user-avatar):last-child{border-bottom:1px solid var(--wa-rule)}
  body.waline-body .typecho-list-table tr:has(.user-avatar) > td:nth-child(1){grid-area:avatar;align-self:center}
  body.waline-body .typecho-list-table tr:has(.user-avatar) > td:nth-child(2){grid-area:nick;align-self:center;font-size:1rem}
  body.waline-body .typecho-list-table tr:has(.user-avatar) > td:nth-child(3){grid-area:email;font-size:.82rem;line-height:1.7}
  body.waline-body .typecho-list-table tr:has(.user-avatar) > td:nth-child(4){
    grid-area:role;justify-self:start;padding:1px 10px;border-radius:999px;
    background:var(--wa-accent-soft);color:var(--wa-accent-hover);font-size:.76rem;
  }
  body.waline-body .typecho-list-table tr:has(.user-avatar) > td:nth-child(5){
    grid-area:label;justify-self:start;color:var(--wa-text-3);font-size:.8rem;
  }
  body.waline-body .typecho-list-table tr:has(.user-avatar) > td:nth-child(6){grid-area:action}
  body.waline-body .typecho-list-table tr:has(.user-avatar) > td:empty{display:none}
  body.waline-body .typecho-list-table tr:has(.user-avatar) .comment-action{margin-top:2px}

}
@media (max-width:720px){
  body.waline-body .main{padding:18px 16px 88px}
  body.waline-body .typecho-list > .clear-fix:not(.typecho-list-operate){
    display:flex;flex-wrap:nowrap;align-items:center;justify-content:space-between;
    gap:12px;overflow-x:auto;scrollbar-width:none;
  }
  body.waline-body .typecho-list > .clear-fix:not(.typecho-list-operate)::-webkit-scrollbar{display:none}
  body.waline-body .typecho-option-tabs{margin:0;gap:14px;flex:none;flex-wrap:nowrap}
  body.waline-body .typecho-option-tabs li button,
  body.waline-body .typecho-option-tabs li a{font-size:.82rem;padding:8px 0;white-space:nowrap}
  body.waline-body .typecho-option-tabs.right{order:2;float:none;margin-left:auto}

  body.waline-body .col-mb-12{margin-bottom:20px}
  body.waline-body .col-mb-12:last-child{margin-bottom:0}
  body.waline-body .col-tb-3{padding:24px 18px}
  body.waline-body .typecho-content-panel section ~ section{margin-top:24px;padding-top:24px}

  body.waline-body .typecho-login-wrap{min-height:calc(100vh - 104px);padding:24px 16px 72px}
  body.waline-body .typecho-login{padding:26px 20px 20px;border-radius:14px}
  body.waline-body .social-accounts{gap:8px;margin-top:20px;padding-top:18px}
  body.waline-body .social-accounts a{width:42px;height:42px}
  body.waline-body .wk-settings-fab{right:16px;bottom:16px;width:42px;height:42px}
  body.waline-body .wk-settings-fab-icon svg{width:19px;height:19px}
}
@media (max-width:420px){
  body.waline-body .waline-brand-copy strong{font-size:.86rem}
  body.waline-body .waline-nav .root{gap:14px}
  body.waline-body #typecho-nav-list .parent a{font-size:.84rem}
  body.waline-body .typecho-list-operate .search .btn{padding:0 12px}
  body.waline-body .comment-action button,
  body.waline-body .comment-action span{height:30px;padding:0 10px;font-size:.74rem}
}
@media (hover:none){
  body.waline-body .typecho-list-table tr td .hidden-by-mouse,
body.waline-body .typecho-list-table tr .hidden-by-mouse{opacity:1}
  body.waline-body .comment-action{opacity:1}
}
`;
}
