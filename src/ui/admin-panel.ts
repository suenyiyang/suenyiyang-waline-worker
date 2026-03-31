/**
 * Admin Panel SPA - served as inline HTML from Worker
 * Features: Comment management (full-field edit), User management,
 *           Settings (LLM review, Waline version), OAuth social login
 */
export function getAdminPage(): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Waline Management System</title>
<style>
${CSS}
</style>
</head>
<body>
<div id="app"></div>
<script>
${JS}
</script>
</body>
</html>`;
}

// ── CSS ──────────────────────────────────────────────
const CSS = `
:root {
  --bg: #f6f8fa; --bg-card: #fff; --border: #d0d7de; --text: #24292f;
  --text-muted: #656d76; --primary: #0969da; --primary-hover: #0550ae;
  --success: #1a7f37; --success-bg: #dafbe1; --warning: #9a6700; --warning-bg: #fff8c5;
  --danger: #cf222e; --danger-bg: #ffebe9; --info: #0550ae; --info-bg: #ddf4ff;
  --radius: 6px; --shadow: 0 1px 3px rgba(0,0,0,.12), 0 1px 2px rgba(0,0,0,.06);
}
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; }
a { color: var(--primary); text-decoration: none; }
a:hover { text-decoration: underline; }

/* Layout */
.header { background: #24292f; color: #fff; padding: 12px 0; position: sticky; top: 0; z-index: 100; }
.header-inner { max-width: 1200px; margin: 0 auto; padding: 0 16px; display: flex; align-items: center; justify-content: space-between; }
.header h1 { font-size: 18px; font-weight: 600; }
.header h1 a { color: #fff; }
.header-right { display: flex; align-items: center; gap: 16px; font-size: 14px; color: #ccc; }
.header-right a { color: #ccc; }
.header-right a:hover { color: #fff; }
.container { max-width: 1200px; margin: 0 auto; padding: 16px; }

/* Nav tabs */
.nav { display: flex; gap: 0; border-bottom: 1px solid var(--border); margin-bottom: 16px; background: var(--bg-card); border-radius: var(--radius) var(--radius) 0 0; overflow: hidden; }
.nav-item { padding: 12px 24px; cursor: pointer; font-size: 14px; font-weight: 500; color: var(--text-muted); border-bottom: 2px solid transparent; transition: all .15s; user-select: none; }
.nav-item:hover { color: var(--text); background: #f3f4f6; }
.nav-item.active { color: var(--primary); border-bottom-color: var(--primary); }

/* Card */
.card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); box-shadow: var(--shadow); margin-bottom: 16px; }
.card-header { padding: 12px 16px; border-bottom: 1px solid var(--border); font-weight: 600; font-size: 14px; display: flex; align-items: center; justify-content: space-between; }
.card-body { padding: 16px; }

/* Buttons */
.btn { display: inline-flex; align-items: center; gap: 4px; padding: 5px 12px; font-size: 12px; font-weight: 500; border: 1px solid var(--border); border-radius: var(--radius); cursor: pointer; background: var(--bg-card); color: var(--text); transition: all .15s; white-space: nowrap; }
.btn:hover { background: #f3f4f6; }
.btn-primary { background: var(--primary); color: #fff; border-color: var(--primary); }
.btn-primary:hover { background: var(--primary-hover); }
.btn-success { background: var(--success); color: #fff; border-color: var(--success); }
.btn-danger { background: var(--danger); color: #fff; border-color: var(--danger); }
.btn-warning { background: var(--warning); color: #fff; border-color: var(--warning); }
.btn-sm { padding: 3px 8px; font-size: 11px; }
.btn-group { display: flex; gap: 4px; flex-wrap: wrap; }

/* Forms */
.form-group { margin-bottom: 16px; }
.form-label { display: block; font-size: 13px; font-weight: 500; margin-bottom: 4px; color: var(--text); }
.form-hint { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
input[type="text"], input[type="email"], input[type="password"], input[type="url"], input[type="number"], select, textarea {
  width: 100%; padding: 6px 10px; font-size: 14px; border: 1px solid var(--border); border-radius: var(--radius);
  background: var(--bg-card); color: var(--text); outline: none; transition: border .15s;
}
input:focus, select:focus, textarea:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(9,105,218,.15); }
textarea { resize: vertical; min-height: 80px; font-family: inherit; }

/* Toggle */
.toggle { position: relative; display: inline-block; width: 40px; height: 22px; }
.toggle input { opacity: 0; width: 0; height: 0; }
.toggle-slider { position: absolute; cursor: pointer; inset: 0; background: #ccc; border-radius: 22px; transition: .2s; }
.toggle-slider:before { content:""; position: absolute; height: 16px; width: 16px; left: 3px; bottom: 3px; background: #fff; border-radius: 50%; transition: .2s; }
.toggle input:checked + .toggle-slider { background: var(--primary); }
.toggle input:checked + .toggle-slider:before { transform: translateX(18px); }

/* Table */
.table-wrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; font-size: 13px; }
th { text-align: left; padding: 8px 12px; border-bottom: 2px solid var(--border); font-weight: 600; color: var(--text-muted); font-size: 12px; text-transform: uppercase; white-space: nowrap; }
td { padding: 10px 12px; border-bottom: 1px solid var(--border); vertical-align: top; }
tr:hover { background: #f6f8fa; }

/* Status badges */
.badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 500; }
.badge-approved { background: var(--success-bg); color: var(--success); }
.badge-waiting { background: var(--warning-bg); color: var(--warning); }
.badge-spam { background: var(--danger-bg); color: var(--danger); }

/* Filter bar */
.filter-bar { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; align-items: center; }
.filter-bar select, .filter-bar input[type="text"] { width: auto; min-width: 150px; }

/* Pagination */
.pagination { display: flex; justify-content: center; gap: 8px; margin-top: 16px; }
.page-btn { padding: 6px 12px; border: 1px solid var(--border); border-radius: var(--radius); cursor: pointer; background: var(--bg-card); font-size: 13px; }
.page-btn:hover { background: #f3f4f6; }
.page-btn.active { background: var(--primary); color: #fff; border-color: var(--primary); }
.page-btn:disabled { opacity: .4; cursor: default; }

/* Login page - Typecho style (exact match of original Waline) */
.typecho-login-wrap { display: table; margin: 0 auto; height: 100%; }
.typecho-login { display: table-cell; padding: 30px 0 100px; text-align: center; vertical-align: middle; }
.typecho-login h1 { margin: 0 0 1em; }
.typecho-login form p { margin: 0.5em 0; }
.typecho-login .submit { margin-top: 1em; }
.typecho-login .more-link { margin-top: 2em; color: #ccc; }
.typecho-login .more-link a { margin: 0 3px; color: #467b96; text-decoration: none; }
.typecho-login .more-link a:hover { color: #499bc3; text-decoration: underline; }
.typecho-login input[type='text'], .typecho-login input[type='password'], .typecho-login input[type='email'] {
  background: #fff; border: 1px solid #d9d9d6; padding: 7px; border-radius: 2px; box-sizing: border-box;
}
.typecho-login .text-l { padding: 10px; font-size: 1.14286em; }
.typecho-login .w-100 { width: 100%; }
.typecho-login .btn { border: none; background-color: #e9e9e6; cursor: pointer; border-radius: 2px; display: inline-block; padding: 0 12px; height: 32px; color: #666; vertical-align: middle; }
.typecho-login .btn-l { height: 40px; font-size: 1.14286em; font-weight: bold; }
.typecho-login .primary { background-color: #467b96; color: #fff; border: none; }
.typecho-login .primary:hover { background-color: #3c6a81; }
.typecho-login .primary:disabled { background-color: #508cab; cursor: default; }
.typecho-login a { color: #467b96; text-decoration: none; }
.typecho-login a:hover { color: #499bc3; text-decoration: underline; }
.typecho-login .forgot-password { float: right; }
.typecho-login .checkbox { margin-right: 3px; }
.sr-only { border: 0; height: 1px; margin: -1px; overflow: hidden; padding: 0; position: absolute; width: 1px; }
.social-accounts { margin-top: 1.5em; }
.social-accounts a { display: inline-block; }
.social-accounts a svg { width: 36px; height: 36px; }
.social-accounts a + a { margin-left: 8px; }
.message.popup.notice { background: #fff6bf; color: #8a6d3b; padding: 8px 10px; border-radius: 2px; }
.message.popup.notice ul { list-style: none; margin: 0; padding: 0; }

/* Comment preview */
.comment-content { max-width: 400px; max-height: 60px; overflow: hidden; line-height: 1.5; word-break: break-all; }
.comment-meta { font-size: 11px; color: var(--text-muted); margin-top: 4px; }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); z-index: 200; display: flex; align-items: center; justify-content: center; }
.modal { background: var(--bg-card); border-radius: var(--radius); box-shadow: 0 8px 30px rgba(0,0,0,.2); max-width: 600px; width: 90%; max-height: 85vh; overflow-y: auto; }
.modal-header { padding: 16px; border-bottom: 1px solid var(--border); font-weight: 600; display: flex; justify-content: space-between; align-items: center; }
.modal-body { padding: 16px; }
.modal-footer { padding: 12px 16px; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 8px; }
.modal-close { background: none; border: none; font-size: 18px; cursor: pointer; color: var(--text-muted); }
.edit-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.edit-row .form-group { margin-bottom: 12px; }

/* Toast */
.toast { position: fixed; top: 16px; right: 16px; padding: 10px 16px; border-radius: var(--radius); font-size: 13px; z-index: 300; animation: slideIn .3s; }
.toast-success { background: var(--success-bg); color: var(--success); border: 1px solid var(--success); }
.toast-error { background: var(--danger-bg); color: var(--danger); border: 1px solid var(--danger); }
@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

/* Responsive */
@media (max-width: 768px) {
  .nav-item { padding: 10px 14px; font-size: 13px; }
  .filter-bar { flex-direction: column; }
  .filter-bar select, .filter-bar input[type="text"] { width: 100%; }
  .comment-content { max-width: 200px; }
  .edit-row { grid-template-columns: 1fr; }
}
`;

// ── JavaScript ───────────────────────────────────────
const JS = `
'use strict';
const API = location.protocol + '//' + location.host;
let token = localStorage.getItem('waline_admin_token');
let currentUser = null;
let currentTab = 'comments';

// Social login SVG icons (exact Waline originals)
const socialSVGs = {
  oidc: '<svg width="48" height="48" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path d="M24,0C10.75,0,0,10.75,0,24s10.75,24,24,24,24-10.75,24-24S37.25,0,24,0ZM30.05,24.76l2.87-1.74c-1.21-.76-2.64-1.28-4.23-1.66-.3-.09-.6-.16-.91-.22v14.96l-4.53,2.27v-2.95s0,0,0,0v2.95s0,0,0,0h0s0,0,0,0c-8.69-.76-14.36-4.99-14.36-10.13s5.52-9.14,12.85-10.05c0,0,.62-.08,1.51-.14v-6.13l4.53-2.27v8.47c.56.07.91.14.91.14,2.87.45,5.44,1.36,7.48,2.64l2.19-1.44.76,6.8-9.07-1.51Z" fill="#ff9626" /><path d="M21.73,21.2c-4.76.91-8.24,3.7-8.24,7.03,0,3.55,3.78,6.35,9.75,7.18v-14.44c-.92.1-1.51.23-1.51.23Z" fill="#ff9626"/></svg>',
  qq: '<svg width="48" height="48" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M512 1024C794.77 1024 1024 794.77 1024 512C1024 229.23 794.77 0 512 0C229.23 0 0 229.23 0 512C0 794.77 229.23 1024 512 1024ZM718.383 488.193C734.622 528.473 746.254 557.323 756.601 590.562C783.163 676.031 774.57 711.422 767.929 712.281C753.867 714 713.163 647.906 713.163 647.906C713.163 686.109 693.476 736.031 650.82 772.125C671.367 778.453 717.773 795.562 706.757 814.156C697.851 829.234 553.476 823.766 511.835 819.078C470.195 823.766 325.82 829.234 316.913 814.156C305.898 795.484 352.226 778.453 372.851 772.125C330.195 736.109 310.507 686.188 310.507 647.906C310.507 647.906 269.804 714 255.742 712.281C249.179 711.5 240.585 676.109 267.148 590.562C277.556 556.997 289.209 528.143 305.627 487.496C308.926 479.326 312.419 470.679 316.132 461.422C312.382 318.688 371.367 199 511.835 199C650.742 199 711.054 316.344 707.617 461.422C711.425 470.936 715.003 479.812 718.383 488.193Z" fill="#259BE0"/></svg>',
  weibo: '<svg height="48" width="48" viewBox="0 0 24 24"><circle cx="12" cy="12" fill="#D34237" r="12"/><path d="M19.3945,9.4904c0.0639,0.8284,-0.0762,1.821,-0.6232,1.8696c-0.8928,0.0798,-0.4271,-0.9037,-0.4154,-1.4957c0.0327,-1.7159,-1.4321,-2.9081,-2.8669,-2.9081c-0.4065,0,-1.3506,0.2755,-1.2052,-0.5817c0.0654,-0.378,0.3856,-0.3727,0.7062,-0.4154C17.4031,5.6373,19.225,7.2973,19.3945,9.4904L19.3945,9.4904zM15.4475,11.4848c1.0374,0.5676,2.2838,0.8502,2.0771,2.5346c-0.0495,0.4036,-0.2938,0.9429,-0.5399,1.2873c-1.7536,2.4548,-7.0427,3.4866,-10.3456,1.6208c-1.1077,-0.6261,-2.254,-1.5417,-2.0771,-3.3659c0.1522,-1.5699,1.2078,-2.786,2.2437,-3.8219c0.9882,-0.9888,2.0303,-1.7624,3.4483,-2.1189c1.5384,-0.3868,1.9932,0.8958,1.5787,2.1604c0.8911,-0.0598,2.7795,-1.0545,3.6147,-0.083C15.8155,10.1263,15.6745,10.8929,15.4475,11.4848L15.4475,11.4848zM14.3256,15.4731c0.3324,-0.3768,0.6665,-0.9511,0.6644,-1.62c-0.0044,-2.0648,-2.6055,-2.8275,-4.6529,-2.6591c-1.1198,0.0918,-1.8731,0.3282,-2.6591,0.7895c-0.6414,0.3765,-1.3921,0.9891,-1.5787,1.9108c-0.4201,2.0727,1.8343,3.0468,3.4898,3.1575C11.502,17.1805,13.4166,16.5052,14.3256,15.4731zM17.3583,9.4904c0.0871,0.6326,-0.0939,1.1807,-0.4569,1.2049c-0.6052,0.0403,-0.3789,-0.4145,-0.4157,-0.9555c-0.023,-0.3332,-0.2991,-0.718,-0.5402,-0.831c-0.4728,-0.2214,-1.2049,0.1613,-1.2049,-0.4984c0,-0.4898,0.4248,-0.4389,0.665,-0.4572C16.4578,7.8731,17.2356,8.5982,17.3583,9.4904zM12.4976,13.6453c0.8852,2.6753,-3.7268,3.9193,-4.5702,1.6202c-0.5643,-1.5375,0.7907,-2.7604,2.2019,-2.9081C11.3342,12.2311,12.2323,12.8455,12.4976,13.6453zM10.3786,14.1024c0.1878,0.325,0.6197,0.0916,0.5817,-0.166C10.915,13.6382,10.3748,13.6824,10.3786,14.1024zM9.6306,15.5152c0.7754,-0.1846,0.8796,-1.645,-0.2908,-1.3712C8.3566,14.3736,8.5467,15.7727,9.6306,15.5152z" fill="#FFFFFF"/></svg>',
  github: '<svg width="48" height="48" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M512 0C229.12 0 0 229.12 0 512c0 226.56 146.56 417.92 350.08 485.76 25.6 4.48 35.2-10.88 35.2-24.32 0-12.16-.64-52.48-.64-95.36-128.64 23.68-161.92-31.36-172.16-60.16-5.76-14.72-30.72-60.16-52.48-72.32-17.92-9.6-43.52-33.28-.64-33.92 40.32-.64 69.12 37.12 78.72 52.48 46.08 77.44 119.68 55.68 149.12 42.24 4.48-33.28 17.92-55.68 32.64-68.48-113.92-12.8-232.96-56.96-232.96-252.8 0-55.68 19.84-101.76 52.48-137.6-5.12-12.8-23.04-65.28 5.12-135.68 0 0 42.88-13.44 140.8 52.48 40.96-11.52 84.48-17.28 128-17.28 43.52 0 87.04 5.76 128 17.28 97.92-66.56 140.8-52.48 140.8-52.48 28.16 70.4 10.24 122.88 5.12 135.68 32.64 35.84 52.48 81.28 52.48 137.6 0 196.48-119.68 240-233.6 252.8 18.56 16 34.56 46.72 34.56 94.72 0 68.48-.64 123.52-.64 140.8 0 13.44 9.6 29.44 35.2 24.32C877.44 929.92 1024 737.92 1024 512 1024 229.12 794.88 0 512 0z" fill="#1B1F23"/></svg>',
  twitter: '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="126.444 2.281 589 589"><circle cx="420.944" cy="296.781" r="294.5" fill="#2daae1"/><path d="M609.773 179.634c-13.891 6.164-28.811 10.331-44.498 12.204 16.01-9.587 28.275-24.779 34.066-42.86a154.78 154.78 0 0 1-49.209 18.801c-14.125-15.056-34.267-24.456-56.551-24.456-42.773 0-77.462 34.675-77.462 77.473 0 6.064.683 11.98 1.996 17.66-64.389-3.236-121.474-34.079-159.684-80.945-6.672 11.446-10.491 24.754-10.491 38.953 0 26.875 13.679 50.587 34.464 64.477a77.122 77.122 0 0 1-35.097-9.686v.979c0 37.54 26.701 68.842 62.145 75.961-6.511 1.784-13.344 2.716-20.413 2.716-4.998 0-9.847-.473-14.584-1.364 9.859 30.769 38.471 53.166 72.363 53.799-26.515 20.785-59.925 33.175-96.212 33.175-6.25 0-12.427-.373-18.491-1.104 34.291 21.988 75.006 34.824 118.759 34.824 142.496 0 220.428-118.052 220.428-220.428 0-3.361-.074-6.697-.236-10.021a157.855 157.855 0 0 0 38.707-40.158z" fill="#f6f6f3"/></svg>',
  facebook: '<svg width="48" height="48" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M32 16C32 7.16344 24.8366 0 16 0C7.16344 0 0 7.16344 0 16C0 23.9861 5.85096 30.6053 13.5 31.8056V20.625H9.43751V16H13.5V12.475C13.5 8.465 15.8887 6.25001 19.5434 6.25001C21.294 6.25001 23.125 6.5625 23.125 6.5625V10.5H21.1074C19.1198 10.5 18.5 11.7334 18.5 12.9987V16H22.9375L22.2281 20.625H18.5V31.8056C26.149 30.6053 32 23.9861 32 16" fill="#1877F2"/></svg>',
  google: '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path></svg>',
};

// ── API helpers ─────────────
async function api(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(API + '/api' + path, { ...opts, headers });
  const data = await res.json();
  if (data.errno && data.errno !== 0) throw new Error(data.errmsg || 'Request failed');
  return data;
}

function toast(msg, type = 'success') {
  const el = document.createElement('div');
  el.className = 'toast toast-' + type;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

function esc(s) {
  if (!s) return '';
  const d = document.createElement('div');
  d.textContent = String(s);
  return d.innerHTML;
}

function timeFmt(ts) {
  if (!ts) return '';
  const d = new Date(typeof ts === 'number' ? ts : ts);
  return d.toLocaleDateString('zh-CN') + ' ' + d.toLocaleTimeString('zh-CN', {hour:'2-digit',minute:'2-digit'});
}

// ── Handle OAuth callback token in URL ──
function checkOAuthCallback() {
  const params = new URLSearchParams(location.search);
  const tokenData = params.get('token');
  if (tokenData) {
    try {
      const data = JSON.parse(tokenData);
      if (data.token) {
        token = data.token;
        currentUser = data;
        localStorage.setItem('waline_admin_token', token);
        // Clean URL
        history.replaceState(null, '', location.pathname);
        return true;
      }
    } catch {}
  }
  const error = params.get('error');
  if (error) {
    setTimeout(() => toast('OAuth 登录失败: ' + error, 'error'), 100);
    history.replaceState(null, '', location.pathname);
  }
  return false;
}

// ── i18n ─────────────────────
const LANGUAGES = {
  'zh-CN': { label: '中文简体', data: {
    'email': '邮箱', 'password': '密码', 'login': '登录', 'logout': '登出',
    'remember me': '下次自动登录', 'forgot password': '忘记密码', 'back to home': '返回首页',
    'register': '用户注册', 'register.login': '用户登录', 'nickname': '昵称', 'website': '个人网站',
    'password again': '再次输入密码', '2fa code': '两步验证码',
    'please input email': '请输入邮箱', 'please input password': '请输入密码',
    'email or password error': '账号密码错误', 'nickname illegal': '请输入正确的昵称',
    "passwords don't match": '两次密码不一致', 'get new password': '获取新密码',
    'forgot password desc': '请输入您的邮箱地址. 系统将发送一封邮件到您的邮箱, 届时您可以通过邮件中的链接创建新密码.',
    'register success': '注册成功！请登录', 'find password success': '密码重置邮件已发送，请查看邮箱！',
    'find password error': '重置密码失败，请稍后重试',
  }},
  'zh-TW': { label: '中文繁體', data: { 'email': '郵箱', 'password': '密碼', 'login': '登錄', 'remember me': '下次自動登錄', 'forgot password': '忘記密碼', 'back to home': '返回首頁', 'register': '使用者註冊', 'register.login': '使用者登錄', 'nickname': '暱稱', 'website': '個人網站', 'password again': '再次輸入密碼', 'get new password': '取得新密碼', 'forgot password desc': '請輸入您的郵箱地址。', 'register success': '註冊成功！請登錄' } },
  'en-US': { label: 'English', data: { 'email': 'Email', 'password': 'Password', 'login': 'Login', 'remember me': 'Remember me', 'forgot password': 'Forgot password', 'back to home': 'Back to home', 'register': 'Register', 'register.login': 'Login', 'nickname': 'Nickname', 'website': 'Website', 'password again': 'Password again', '2fa code': '2FA Code', 'get new password': 'Get new password', 'forgot password desc': 'Enter your email address to receive a password reset link.', 'register success': 'Register success! Please login' } },
  'de': { label: 'Deutsch', data: { 'email': 'E-Mail', 'password': 'Passwort', 'login': 'Anmelden', 'remember me': 'Angemeldet bleiben', 'forgot password': 'Passwort vergessen', 'back to home': 'Zurück', 'register': 'Registrieren', 'register.login': 'Anmelden', 'get new password': 'Neues Passwort' } },
  'es-MX': { label: 'Español (México)', data: { 'email': 'Correo', 'password': 'Contraseña', 'login': 'Iniciar sesión', 'remember me': 'Recuérdame', 'forgot password': 'Olvidé mi contraseña', 'back to home': 'Volver', 'register': 'Registrarse', 'register.login': 'Iniciar sesión', 'get new password': 'Nueva contraseña' } },
  'fr': { label: 'Français', data: { 'email': 'E-mail', 'password': 'Mot de passe', 'login': 'Connexion', 'remember me': 'Se souvenir', 'forgot password': 'Mot de passe oublié', 'back to home': 'Retour', 'register': "S'inscrire", 'register.login': 'Connexion', 'get new password': 'Nouveau mot de passe' } },
  'it': { label: 'Italiano', data: { 'email': 'Email', 'password': 'Password', 'login': 'Accedi', 'remember me': 'Ricordami', 'forgot password': 'Password dimenticata', 'back to home': 'Torna', 'register': 'Registrati', 'register.login': 'Accedi', 'get new password': 'Nuova password' } },
  'jp': { label: '日本語', data: { 'email': 'メール', 'password': 'パスワード', 'login': 'ログイン', 'remember me': '次回自動ログイン', 'forgot password': 'パスワードを忘れた', 'back to home': 'ホームに戻る', 'register': '新規登録', 'register.login': 'ログイン', 'get new password': '新しいパスワード' } },
  'ko-KR': { label: '한국어', data: { 'email': '이메일', 'password': '비밀번호', 'login': '로그인', 'remember me': '자동 로그인', 'forgot password': '비밀번호 찾기', 'back to home': '홈으로', 'register': '회원가입', 'register.login': '로그인', 'get new password': '새 비밀번호' } },
  'pt-BR': { label: 'Português (Brasil)', data: { 'email': 'Email', 'password': 'Senha', 'login': 'Entrar', 'remember me': 'Lembrar-me', 'forgot password': 'Esqueceu a senha', 'back to home': 'Voltar', 'register': 'Registrar', 'register.login': 'Entrar', 'get new password': 'Nova senha' } },
  'ru': { label: 'Русский', data: { 'email': 'Email', 'password': 'Пароль', 'login': 'Войти', 'remember me': 'Запомнить', 'forgot password': 'Забыли пароль', 'back to home': 'На главную', 'register': 'Регистрация', 'register.login': 'Войти', 'get new password': 'Новый пароль' } },
  'vi': { label: 'Tiếng Việt', data: { 'email': 'Email', 'password': 'Mật khẩu', 'login': 'Đăng nhập', 'remember me': 'Ghi nhớ', 'forgot password': 'Quên mật khẩu', 'back to home': 'Về trang chủ', 'register': 'Đăng ký', 'register.login': 'Đăng nhập', 'get new password': 'Mật khẩu mới' } },
};
let currentLang = 'zh-CN';
function t(key) {
  const lang = LANGUAGES[currentLang];
  return (lang && lang.data && lang.data[key]) || (LANGUAGES['zh-CN'].data[key]) || key;
}
function detectLanguage() {
  const stored = localStorage.getItem('waline_admin_lang');
  if (stored && LANGUAGES[stored]) { currentLang = stored; return; }
  const nav = navigator.language || 'zh-CN';
  for (const k of Object.keys(LANGUAGES)) {
    if (nav === k || nav.startsWith(k.split('-')[0])) { currentLang = k; return; }
  }
}
detectLanguage();

function renderHeaderNav() {
  const langOptions = Object.entries(LANGUAGES).map(([k, v]) =>
    '<option value="' + k + '"' + (k === currentLang ? ' selected' : '') + '>' + v.label + '</option>'
  ).join('');
  return '<div class="typecho-head-nav clear-fix" role="navigation"><div class="operate"><div class="language-select"><select id="lang-select" style="width:120px">' + langOptions + '</select></div></div></div>';
}

// ── Render engine ───────────
function render() {
  const app = document.getElementById('app');
  const path = location.pathname.replace(/\\/+$/, '') || '/ui';

  if (!token) {
    document.documentElement.style.height = '100%';
    document.body.style.cssText = "font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background: #f6f6f3; color: #444; font-size: 87.5%; line-height: 1.5; height: 100%;";

    if (path === '/ui/register') {
      app.innerHTML = renderRegister(); bindRegister(); bindLangSelect();
    } else if (path === '/ui/forgot') {
      app.innerHTML = renderForgot(); bindForgot(); bindLangSelect();
    } else {
      app.innerHTML = renderLogin(); bindLogin(); bindLangSelect();
    }
    return;
  }
  document.documentElement.style.height = '';
  document.body.style.cssText = '';
  app.innerHTML = renderShell();
  bindNav();
  loadTab(currentTab);
}

function renderLogin() {
  const socials = ['oidc', 'qq', 'weibo', 'github', 'twitter', 'facebook'];
  const socialLinks = socials.map(s =>
    '<a href="' + API + '/api/oauth?type=' + s + '&redirect=' + encodeURIComponent('/ui/profile') + '">' + (socialSVGs[s] || '') + '</a>'
  ).join('');

  return \`
  \${renderHeaderNav()}
  <div class="message popup notice" id="error-msg" style="position:fixed;top:0;left:0;width:100%;z-index:10;text-align:center;display:none">
    <ul><li id="error-text"></li></ul>
  </div>
  <div class="typecho-login-wrap">
    <div class="typecho-login">
      <form method="post" name="login" role="form" id="login-form">
        <p>
          <label for="email" class="sr-only">\${t('email')}</label>
          <input type="text" id="email" name="email" placeholder="\${t('email')}" class="text-l w-100" />
        </p>
        <p>
          <label for="password" class="sr-only">\${t('password')}</label>
          <input type="password" id="password" name="password" class="text-l w-100" placeholder="\${t('password')}" />
        </p>
        <p id="2fa-group" style="display:none">
          <label for="code" class="sr-only">\${t('2fa code')}</label>
          <input type="text" id="code" name="code" class="text-l w-100" placeholder="\${t('2fa code')}" />
        </p>
        <p class="captcha-container"></p>
        <p class="submit">
          <button type="submit" class="btn btn-l w-100 primary" id="login-btn">\${t('login')}</button>
        </p>
        <p style="display:flex;justify-content:space-between">
          <label for="remember">
            <input type="checkbox" name="remember" class="checkbox" id="remember" /> \${t('remember me')}
          </label>
          <span class="right forgot-password">
            <a href="/ui/forgot">\${t('forgot password')}</a>
          </span>
        </p>
      </form>
      <div class="social-accounts">
        \${socialLinks}
      </div>
      <p class="more-link">
        <a href="/ui">\${t('back to home')}</a> &bull;
        <a href="/ui/register">\${t('register')}</a>
      </p>
    </div>
  </div>\`;
}

function renderShell() {
  return \`
  <div class="header"><div class="header-inner">
    <h1><a href="/">Waline Management System</a></h1>
    <div class="header-right">
      <span>\${esc(currentUser?.display_name || currentUser?.email || '')}</span>
      <a href="/" target="_blank">前端</a>
      <a href="#" id="logout-btn">退出</a>
    </div>
  </div></div>
  <div class="container">
    <div class="nav">
      <div class="nav-item active" data-tab="comments">评论管理</div>
      <div class="nav-item" data-tab="users">用户管理</div>
      <div class="nav-item" data-tab="settings">系统设置</div>
    </div>
    <div id="tab-content"></div>
  </div>\`;
}

// ── Login ────────────────────
function bindLogin() {
  const form = document.getElementById('login-form');

  form.onsubmit = async (e) => {
    e.preventDefault();
    const email = form.email.value.trim();
    const pwd = form.password.value;
    if (!email || !pwd) { showLoginError(t('please input email')); return; }

    const body = { email, password: pwd };
    const codeField = form.code;
    if (codeField && document.getElementById('2fa-group').style.display !== 'none') {
      body.code = codeField.value.trim();
    }

    const btn = document.getElementById('login-btn');
    try {
      btn.disabled = true;
      btn.textContent = '...';
      const res = await api('/token', { method: 'POST', body: JSON.stringify(body) });

      if (res.errno === 1 && res.data && res.data['2fa']) {
        document.getElementById('2fa-group').style.display = '';
        document.getElementById('code').focus();
        showLoginError(t('2fa code'));
        return;
      }

      token = res.data.token;
      currentUser = res.data;

      const remember = document.getElementById('remember').checked;
      if (remember) {
        localStorage.setItem('waline_admin_token', token);
      } else {
        sessionStorage.setItem('waline_admin_token', token);
      }

      const isAdmin = res.data.type === 'administrator';
      const defaultRedirect = isAdmin ? '/ui' : '/ui/profile';
      const query = new URLSearchParams(location.search);
      const redirect = isAdmin && query.get('redirect') ? query.get('redirect') : defaultRedirect;
      history.replaceState(null, '', redirect);
      render();
    } catch (e) {
      if (e.message && e.message.includes('2FA')) {
        document.getElementById('2fa-group').style.display = '';
        document.getElementById('code').focus();
      }
      showLoginError(e.message || t('email or password error'));
    } finally {
      btn.disabled = false;
      btn.textContent = t('login');
    }
  };
}

function bindLangSelect() {
  const sel = document.getElementById('lang-select');
  if (sel) {
    sel.onchange = () => {
      currentLang = sel.value;
      localStorage.setItem('waline_admin_lang', currentLang);
      render();
    };
  }
}

function showLoginError(msg) {
  const el = document.getElementById('error-msg');
  const text = document.getElementById('error-text');
  if (el && text) {
    text.textContent = msg;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 3000);
  }
}

// ── Register page ────────────
function renderRegister() {
  return \`
  \${renderHeaderNav()}
  <div class="message popup notice" id="error-msg" style="position:fixed;top:0;left:0;width:100%;z-index:10;text-align:center;display:none">
    <ul><li id="error-text"></li></ul>
  </div>
  <div class="typecho-login-wrap">
    <div class="typecho-login">
      <form method="post" name="login" role="form" id="register-form">
        <p>
          <label for="nick" class="sr-only">\${t('nickname')}</label>
          <input type="text" id="nick" name="nick" placeholder="\${t('nickname')}" class="text-l w-100" />
        </p>
        <p>
          <label for="email" class="sr-only">\${t('email')}</label>
          <input type="text" id="email" name="email" placeholder="\${t('email')}" class="text-l w-100" />
        </p>
        <p>
          <label for="link" class="sr-only">\${t('website')}</label>
          <input type="text" id="link" name="link" placeholder="\${t('website')}" class="text-l w-100" />
        </p>
        <p>
          <label for="password" class="sr-only">\${t('password')}</label>
          <input type="password" id="password" name="password" class="text-l w-100" placeholder="\${t('password')}" />
        </p>
        <p>
          <label for="password-again" class="sr-only">\${t('password again')}</label>
          <input type="password" id="password-again" name="password-again" class="text-l w-100" placeholder="\${t('password again')}" />
        </p>
        <p class="captcha-container"></p>
        <p class="submit">
          <button type="submit" class="btn btn-l w-100 primary" id="register-btn">\${t('register')}</button>
        </p>
      </form>
      <p class="more-link">
        <a href="/ui">\${t('back to home')}</a> &bull;
        <a href="/ui/login">\${t('register.login')}</a>
      </p>
    </div>
  </div>\`;
}

function bindRegister() {
  const form = document.getElementById('register-form');
  form.onsubmit = async (e) => {
    e.preventDefault();
    const nick = form.nick.value.trim();
    const email = form.email.value.trim();
    const link = form.link.value.trim();
    const password = form.password.value;
    const passwordAgain = form['password-again'].value;

    if (!nick || nick.length < 2) { showLoginError(t('nickname illegal')); return; }
    if (!email) { showLoginError(t('please input email')); return; }
    if (!password || !passwordAgain || password !== passwordAgain) { showLoginError(t("passwords don't match")); return; }

    const btn = document.getElementById('register-btn');
    try {
      btn.disabled = true;
      await api('/user', { method: 'POST', body: JSON.stringify({ display_name: nick, email, password, url: link }) });
      showLoginError(t('register success'));
      setTimeout(() => { history.pushState(null, '', '/ui/login'); render(); }, 1500);
    } catch (err) {
      showLoginError(err.message);
    } finally {
      btn.disabled = false;
    }
  };
}

// ── Forgot password page ─────
function renderForgot() {
  return \`
  \${renderHeaderNav()}
  <div class="message popup notice" id="error-msg" style="position:fixed;top:0;left:0;width:100%;z-index:10;text-align:center;display:none">
    <ul><li id="error-text"></li></ul>
  </div>
  <div class="typecho-login-wrap">
    <div class="typecho-login">
      <form method="post" name="login" role="form" id="forgot-form">
        <ul class="typecho-option">
          <li>
            <label for="email" class="sr-only">\${t('email')}</label>
            <input type="text" id="email" name="email" placeholder="\${t('email')}" class="text-l w-100" />
            <p class="description" style="text-align:left">\${t('forgot password desc')}</p>
          </li>
        </ul>
        <p class="submit">
          <button type="submit" class="btn btn-l w-100 primary" id="forgot-btn">\${t('get new password')}</button>
        </p>
      </form>
      <p class="more-link">
        <a href="/ui">\${t('back to home')}</a> &bull;
        <a href="/ui/login">\${t('register.login')}</a>
      </p>
    </div>
  </div>\`;
}

function bindForgot() {
  const form = document.getElementById('forgot-form');
  form.onsubmit = async (e) => {
    e.preventDefault();
    const email = form.email.value.trim();
    if (!email) { showLoginError(t('please input email')); return; }
    const btn = document.getElementById('forgot-btn');
    try {
      btn.disabled = true;
      await api('/user/password', { method: 'PUT', body: JSON.stringify({ email }) });
      showLoginError(t('find password success'));
      setTimeout(() => { history.pushState(null, '', '/ui/login'); render(); }, 2000);
    } catch {
      showLoginError(t('find password error'));
    } finally {
      btn.disabled = false;
    }
  };
}

// ── Nav ──────────────────────
function bindNav() {
  document.querySelectorAll('.nav-item').forEach(el => {
    el.onclick = () => {
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      el.classList.add('active');
      currentTab = el.dataset.tab;
      loadTab(currentTab);
    };
  });
  document.getElementById('logout-btn').onclick = (e) => {
    e.preventDefault();
    token = null; currentUser = null;
    localStorage.removeItem('waline_admin_token');
    sessionStorage.removeItem('waline_admin_token');
    render();
  };
}

// ── Tab routing ──────────────
function loadTab(tab) {
  const ct = document.getElementById('tab-content');
  if (tab === 'comments') loadComments(ct);
  else if (tab === 'users') loadUsers(ct);
  else if (tab === 'settings') loadSettings(ct);
}

// ══════════════════════════════
// ── COMMENTS TAB ─────────────
// ══════════════════════════════
let cmtPage = 1, cmtStatus = '', cmtKeyword = '';
async function loadComments(ct) {
  ct.innerHTML = '<p>加载中...</p>';
  try {
    const q = new URLSearchParams({ type:'list', page:cmtPage, pageSize:20 });
    if (cmtStatus) q.set('status', cmtStatus);
    if (cmtKeyword) q.set('keyword', cmtKeyword);
    const res = await api('/comment?' + q.toString());
    const d = res.data;
    ct.innerHTML = renderCommentTab(d);
    bindCommentActions(ct);
  } catch(e) {
    if (e.message === 'Unauthorized') { token = null; localStorage.removeItem('waline_admin_token'); render(); return; }
    ct.innerHTML = '<p>加载失败: ' + esc(e.message) + '</p>';
  }
}

function renderCommentTab(d) {
  const rows = (d.data || []).map(c => \`
    <tr data-id="\${c.objectId}" data-comment='\${esc(JSON.stringify(c))}'>
      <td>\${c.objectId}</td>
      <td>
        <div class="comment-content">\${esc(c.orig || c.comment)}</div>
        <div class="comment-meta">\${esc(c.nick)} · \${esc(c.url || '')}</div>
      </td>
      <td>\${esc(c.nick)}<br><span style="font-size:11px;color:var(--text-muted)">\${esc(c.mail || '')}</span></td>
      <td><span class="badge badge-\${c.status}">\${statusLabel(c.status)}</span></td>
      <td>\${c.sticky ? '📌' : ''}</td>
      <td style="font-size:12px">\${timeFmt(c.insertedAt)}</td>
      <td>
        <div class="btn-group">
          \${c.status !== 'approved' ? '<button class="btn btn-sm btn-success" data-action="approve">通过</button>' : ''}
          \${c.status !== 'waiting' ? '<button class="btn btn-sm" data-action="waiting">待审</button>' : ''}
          \${c.status !== 'spam' ? '<button class="btn btn-sm btn-warning" data-action="spam">垃圾</button>' : ''}
          <button class="btn btn-sm" data-action="sticky">\${c.sticky ? '取消置顶' : '置顶'}</button>
          <button class="btn btn-sm" data-action="edit">编辑</button>
          <button class="btn btn-sm btn-danger" data-action="delete">删除</button>
        </div>
      </td>
    </tr>\`).join('');

  return \`
  <div class="filter-bar">
    <select id="cmt-status"><option value="">全部状态</option><option value="approved" \${cmtStatus==='approved'?'selected':''}>已通过</option><option value="waiting" \${cmtStatus==='waiting'?'selected':''}>待审核</option><option value="spam" \${cmtStatus==='spam'?'selected':''}>垃圾</option></select>
    <input type="text" id="cmt-keyword" placeholder="搜索关键词..." value="\${esc(cmtKeyword)}" />
    <button class="btn btn-primary" id="cmt-search">搜索</button>
  </div>
  <div class="card"><div class="table-wrap"><table>
    <thead><tr><th>ID</th><th>内容</th><th>作者</th><th>状态</th><th>置顶</th><th>时间</th><th>操作</th></tr></thead>
    <tbody>\${rows || '<tr><td colspan="7" style="text-align:center;padding:20px">暂无数据</td></tr>'}</tbody>
  </table></div></div>
  \${renderPagination(d.page || cmtPage, d.totalPages || 1, 'cmt')}\`;
}

function statusLabel(s) {
  if (s === 'approved') return '已通过';
  if (s === 'waiting') return '待审核';
  if (s === 'spam') return '垃圾';
  return s;
}

function bindCommentActions(ct) {
  ct.querySelector('#cmt-search').onclick = () => {
    cmtStatus = ct.querySelector('#cmt-status').value;
    cmtKeyword = ct.querySelector('#cmt-keyword').value.trim();
    cmtPage = 1;
    loadComments(ct);
  };
  ct.querySelector('#cmt-keyword')?.addEventListener('keydown', e => { if (e.key === 'Enter') ct.querySelector('#cmt-search').click(); });

  ct.querySelectorAll('[data-action]').forEach(btn => {
    btn.onclick = async () => {
      const tr = btn.closest('tr');
      const id = tr.dataset.id;
      const action = btn.dataset.action;
      try {
        if (action === 'approve') { await api('/comment/' + id, { method: 'PUT', body: JSON.stringify({status:'approved'}) }); toast('已通过'); }
        else if (action === 'waiting') { await api('/comment/' + id, { method: 'PUT', body: JSON.stringify({status:'waiting'}) }); toast('已设为待审'); }
        else if (action === 'spam') { await api('/comment/' + id, { method: 'PUT', body: JSON.stringify({status:'spam'}) }); toast('已标记垃圾'); }
        else if (action === 'sticky') {
          const isSticky = btn.textContent.includes('取消');
          await api('/comment/' + id, { method: 'PUT', body: JSON.stringify({sticky: !isSticky}) });
          toast(isSticky ? '已取消置顶' : '已置顶');
        }
        else if (action === 'delete') {
          if (!confirm('确定删除此评论？子评论也将被删除。')) return;
          await api('/comment/' + id, { method: 'DELETE' });
          toast('已删除');
        }
        else if (action === 'edit') {
          const commentData = JSON.parse(tr.dataset.comment || '{}');
          showEditModal(id, commentData);
          return;
        }
        loadComments(ct);
      } catch (e) { toast(e.message, 'error'); }
    };
  });

  bindPagination(ct, 'cmt', (p) => { cmtPage = p; loadComments(ct); });
}

// ── Full-field edit comment modal ───────
async function showEditModal(id, commentData) {
  const c = commentData || {};

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = \`
    <div class="modal">
      <div class="modal-header"><span>编辑评论 #\${id}</span><button class="modal-close">&times;</button></div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">评论内容 (Markdown)</label>
          <textarea id="edit-content" rows="6">\${esc(c.orig || '')}</textarea>
        </div>
        <div class="edit-row">
          <div class="form-group">
            <label class="form-label">昵称</label>
            <input type="text" id="edit-nick" value="\${esc(c.nick || '')}" />
          </div>
          <div class="form-group">
            <label class="form-label">邮箱</label>
            <input type="text" id="edit-mail" value="\${esc(c.mail || '')}" />
          </div>
        </div>
        <div class="edit-row">
          <div class="form-group">
            <label class="form-label">链接</label>
            <input type="text" id="edit-link" value="\${esc(c.link || '')}" />
          </div>
          <div class="form-group">
            <label class="form-label">页面 URL</label>
            <input type="text" id="edit-url" value="\${esc(c.url || '')}" />
          </div>
        </div>
        <div class="edit-row">
          <div class="form-group">
            <label class="form-label">状态</label>
            <select id="edit-status">
              <option value="approved" \${c.status==='approved'?'selected':''}>已通过</option>
              <option value="waiting" \${c.status==='waiting'?'selected':''}>待审核</option>
              <option value="spam" \${c.status==='spam'?'selected':''}>垃圾</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">置顶</label>
            <select id="edit-sticky">
              <option value="0" \${!c.sticky?'selected':''}>否</option>
              <option value="1" \${c.sticky?'selected':''}>是</option>
            </select>
          </div>
        </div>
        <div class="edit-row">
          <div class="form-group">
            <label class="form-label">User-Agent</label>
            <input type="text" id="edit-ua" value="\${esc(c.ua || '')}" />
          </div>
          <div class="form-group">
            <label class="form-label">IP</label>
            <input type="text" id="edit-ip" value="\${esc(c.ip || '')}" />
          </div>
        </div>
        <div class="edit-row">
          <div class="form-group">
            <label class="form-label">点赞数</label>
            <input type="number" id="edit-like" value="\${c.like || 0}" min="0" />
          </div>
          <div class="form-group">
            <label class="form-label">用户 ID</label>
            <input type="number" id="edit-user-id" value="\${c.user_id || ''}" />
          </div>
        </div>
        <div class="edit-row">
          <div class="form-group">
            <label class="form-label">父评论 ID (pid)</label>
            <input type="number" id="edit-pid" value="\${c.pid || ''}" />
          </div>
          <div class="form-group">
            <label class="form-label">根评论 ID (rid)</label>
            <input type="number" id="edit-rid" value="\${c.rid || ''}" />
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn" id="edit-cancel">取消</button>
        <button class="btn btn-primary" id="edit-save">保存</button>
      </div>
    </div>\`;
  document.body.appendChild(overlay);

  overlay.querySelector('.modal-close').onclick = () => overlay.remove();
  overlay.querySelector('#edit-cancel').onclick = () => overlay.remove();
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

  overlay.querySelector('#edit-save').onclick = async () => {
    const body = {};
    const content = document.getElementById('edit-content').value;
    const nick = document.getElementById('edit-nick').value;
    const mail = document.getElementById('edit-mail').value;
    const link = document.getElementById('edit-link').value;
    const url = document.getElementById('edit-url').value;
    const status = document.getElementById('edit-status').value;
    const sticky = document.getElementById('edit-sticky').value === '1';
    const ua = document.getElementById('edit-ua').value;
    const ip = document.getElementById('edit-ip').value;
    const like = parseInt(document.getElementById('edit-like').value) || 0;
    const userId = document.getElementById('edit-user-id').value;
    const pid = document.getElementById('edit-pid').value;
    const rid = document.getElementById('edit-rid').value;

    if (content !== (c.orig || '')) body.comment = content;
    if (nick !== (c.nick || '')) body.nick = nick;
    if (mail !== (c.mail || '')) body.mail = mail;
    if (link !== (c.link || '')) body.link = link;
    if (url !== (c.url || '')) body.url = url;
    if (status !== c.status) body.status = status;
    if (sticky !== c.sticky) body.sticky = sticky;
    if (ua !== (c.ua || '')) body.ua = ua;
    if (ip !== (c.ip || '')) body.ip = ip;
    if (like !== (c.like || 0)) body['like'] = like;
    if (userId !== String(c.user_id || '')) body.user_id = userId ? parseInt(userId) : null;
    if (pid !== String(c.pid || '')) body.pid = pid ? parseInt(pid) : null;
    if (rid !== String(c.rid || '')) body.rid = rid ? parseInt(rid) : null;

    if (Object.keys(body).length === 0) { toast('没有修改', 'error'); overlay.remove(); return; }

    try {
      await api('/comment/' + id, { method: 'PUT', body: JSON.stringify(body) });
      toast('已保存');
      overlay.remove();
      loadComments(document.getElementById('tab-content'));
    } catch (e) { toast(e.message, 'error'); }
  };
}

// ══════════════════════════════
// ── USERS TAB ────────────────
// ══════════════════════════════
let userPage = 1;
async function loadUsers(ct) {
  ct.innerHTML = '<p>加载中...</p>';
  try {
    const res = await api('/user?page=' + userPage + '&pageSize=20');
    const d = res.data;
    ct.innerHTML = renderUserTab(d);
    bindUserActions(ct);
  } catch(e) {
    ct.innerHTML = '<p>加载失败: ' + esc(e.message) + '</p>';
  }
}

function renderUserTab(d) {
  const rows = (d.data || []).map(u => \`
    <tr data-id="\${u.objectId}">
      <td>\${u.objectId}</td>
      <td><img src="\${esc(u.avatar)}" style="width:24px;height:24px;border-radius:50%;vertical-align:middle" /> \${esc(u.display_name)}</td>
      <td>\${esc(u.email)}</td>
      <td><span class="badge badge-\${u.type === 'administrator' ? 'approved' : u.type === 'banned' ? 'spam' : 'waiting'}">\${typeLabel(u.type)}</span></td>
      <td>\${esc(u.label || '')}</td>
      <td>
        <div class="btn-group">
          <button class="btn btn-sm" data-action="role">切换角色</button>
          <button class="btn btn-sm btn-danger" data-action="delete">删除</button>
        </div>
      </td>
    </tr>\`).join('');

  return \`
  <div class="card"><div class="table-wrap"><table>
    <thead><tr><th>ID</th><th>用户名</th><th>邮箱</th><th>角色</th><th>标签</th><th>操作</th></tr></thead>
    <tbody>\${rows || '<tr><td colspan="6" style="text-align:center;padding:20px">暂无用户</td></tr>'}</tbody>
  </table></div></div>
  \${renderPagination(d.page || userPage, d.totalPages || 1, 'user')}\`;
}

function typeLabel(t) {
  if (t === 'administrator') return '管理员';
  if (t === 'guest') return '访客';
  if (t === 'banned') return '已封禁';
  return t;
}

function bindUserActions(ct) {
  ct.querySelectorAll('[data-action]').forEach(btn => {
    btn.onclick = async () => {
      const tr = btn.closest('tr');
      const id = tr.dataset.id;
      const action = btn.dataset.action;
      try {
        if (action === 'role') {
          const badge = tr.querySelector('.badge');
          const currentType = badge.textContent.trim();
          const newType = currentType === '管理员' ? 'guest' : 'administrator';
          if (newType === 'guest' && !confirm('确定将此用户降级为访客？')) return;
          await api('/user/' + id, { method: 'PUT', body: JSON.stringify({ type: newType }) });
          toast('角色已更新');
        } else if (action === 'delete') {
          if (!confirm('确定删除此用户？')) return;
          await api('/user/' + id, { method: 'DELETE' });
          toast('已删除');
        }
        loadUsers(ct);
      } catch (e) { toast(e.message, 'error'); }
    };
  });
  bindPagination(ct, 'user', (p) => { userPage = p; loadUsers(ct); });
}

// ══════════════════════════════
// ── SETTINGS TAB ─────────────
// ══════════════════════════════
async function loadSettings(ct) {
  ct.innerHTML = '<p>加载中...</p>';
  try {
    const res = await api('/settings');
    const s = res.data || {};
    ct.innerHTML = renderSettingsTab(s);
    bindSettingsActions(ct, s);
  } catch(e) {
    ct.innerHTML = '<p>加载失败: ' + esc(e.message) + '</p>';
  }
}

function renderSettingsTab(s) {
  return \`
  <div class="card">
    <div class="card-header">Waline 前端设置</div>
    <div class="card-body">
      <div class="form-group">
        <label class="form-label">@waline/client CDN 版本</label>
        <input type="text" id="set-version" value="\${esc(s.waline_client_version || 'v3')}" />
        <div class="form-hint">用于根页面加载的 @waline/client 版本号，例如 v3、3.13.0</div>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="card-header">
      <span>LLM 智能审查</span>
      <label class="toggle"><input type="checkbox" id="set-llm-enabled" \${s.llm_enabled === '1' ? 'checked' : ''} /><span class="toggle-slider"></span></label>
    </div>
    <div class="card-body" id="llm-settings">
      <div class="form-group">
        <label class="form-label">API 端点</label>
        <input type="url" id="set-llm-endpoint" value="\${esc(s.llm_endpoint || '')}" placeholder="https://api.openai.com/v1/chat/completions" />
        <div class="form-hint">OpenAI 兼容的 Chat Completions API 端点</div>
      </div>
      <div class="form-group">
        <label class="form-label">API Key</label>
        <input type="password" id="set-llm-key" value="\${esc(s.llm_api_key || '')}" placeholder="sk-..." />
      </div>
      <div class="form-group">
        <label class="form-label">模型</label>
        <input type="text" id="set-llm-model" value="\${esc(s.llm_model || 'gpt-4o-mini')}" placeholder="gpt-4o-mini" />
      </div>
      <div class="form-group">
        <label class="form-label">系统提示词</label>
        <textarea id="set-llm-prompt" rows="6">\${esc(s.llm_prompt || defaultPrompt())}</textarea>
        <div class="form-hint">用于审查评论的系统提示词。模型应返回单个词: approved 或 spam</div>
      </div>
    </div>
  </div>

  <div style="margin-top:16px">
    <button class="btn btn-primary" id="save-settings" style="padding:8px 24px">保存设置</button>
    <button class="btn" id="test-llm" style="padding:8px 24px;margin-left:8px">测试 LLM 连接</button>
  </div>\`;
}

function defaultPrompt() {
  return 'You are a review bot. Your task is to review the comments according to following rules: 1. Any contact information should not be included, including qq number, email, phone number, etc. 2. Any content with advertising or sensitive information should not be included. 3. Any other content that is not suitable for public display should not be included. 4. Output should be a single word(approved/spam).';
}

function bindSettingsActions(ct, currentSettings) {
  ct.querySelector('#save-settings').onclick = async () => {
    const settings = {
      waline_client_version: ct.querySelector('#set-version').value.trim() || 'v3',
      llm_enabled: ct.querySelector('#set-llm-enabled').checked ? '1' : '0',
      llm_endpoint: ct.querySelector('#set-llm-endpoint').value.trim(),
      llm_api_key: ct.querySelector('#set-llm-key').value.trim(),
      llm_model: ct.querySelector('#set-llm-model').value.trim(),
      llm_prompt: ct.querySelector('#set-llm-prompt').value.trim(),
    };
    try {
      await api('/settings', { method: 'PUT', body: JSON.stringify(settings) });
      toast('设置已保存');
    } catch (e) { toast(e.message, 'error'); }
  };

  ct.querySelector('#test-llm').onclick = async () => {
    const endpoint = ct.querySelector('#set-llm-endpoint').value.trim();
    const key = ct.querySelector('#set-llm-key').value.trim();
    const model = ct.querySelector('#set-llm-model').value.trim();
    if (!endpoint || !key) { toast('请先填写 API 端点和 Key', 'error'); return; }
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
        body: JSON.stringify({
          model: model || 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Hello, respond with just "OK"' }],
          max_tokens: 10
        })
      });
      if (res.ok) { toast('LLM 连接成功！'); }
      else { const d = await res.json().catch(() => null); toast('连接失败: ' + (d?.error?.message || res.status), 'error'); }
    } catch (e) { toast('连接失败: ' + e.message, 'error'); }
  };
}

// ── Pagination helper ────────
function renderPagination(page, total, prefix) {
  if (total <= 1) return '';
  let html = '<div class="pagination">';
  html += '<button class="page-btn" data-page="' + (page-1) + '" ' + (page<=1?'disabled':'') + '>&laquo;</button>';
  const start = Math.max(1, page - 2), end = Math.min(total, page + 2);
  if (start > 1) html += '<button class="page-btn" data-page="1">1</button>';
  if (start > 2) html += '<span style="padding:6px">...</span>';
  for (let i = start; i <= end; i++) {
    html += '<button class="page-btn' + (i===page?' active':'') + '" data-page="' + i + '">' + i + '</button>';
  }
  if (end < total-1) html += '<span style="padding:6px">...</span>';
  if (end < total) html += '<button class="page-btn" data-page="' + total + '">' + total + '</button>';
  html += '<button class="page-btn" data-page="' + (page+1) + '" ' + (page>=total?'disabled':'') + '>&raquo;</button>';
  html += '</div>';
  return html;
}

function bindPagination(ct, prefix, cb) {
  ct.querySelectorAll('.pagination .page-btn').forEach(btn => {
    btn.onclick = () => {
      const p = parseInt(btn.dataset.page);
      if (!isNaN(p) && !btn.disabled) cb(p);
    };
  });
}

// ── Init ─────────────────────
window.addEventListener('popstate', () => render());

// SPA navigation for internal /ui links
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href]');
  if (!a) return;
  const href = a.getAttribute('href');
  if (href && href.startsWith('/ui') && !a.target) {
    e.preventDefault();
    history.pushState(null, '', href);
    render();
  }
});

(async function() {
  // Check for OAuth callback token in URL
  checkOAuthCallback();

  // Try token from storage
  if (!token) token = sessionStorage.getItem('waline_admin_token');
  if (token) {
    try {
      const res = await api('/token');
      currentUser = res.data;
      // Non-admin users on admin pages get redirected to profile
      if (res.data.type !== 'administrator' && !location.pathname.startsWith('/ui/profile')) {
        history.replaceState(null, '', '/ui/profile');
      }
    } catch { token = null; localStorage.removeItem('waline_admin_token'); sessionStorage.removeItem('waline_admin_token'); }
  }
  render();
})();
`;
