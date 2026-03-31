import type { Env } from '../env.js';
import { getSetting } from '../router/settings.js';

/**
 * Waline frontend UI page HTML
 * Faithfully reproduces the original Waline server root page behavior
 * with configurable @waline/client version from settings
 */
export async function getWalinePage(env: Env, requestUrl: string): Promise<string> {
  const clientVersion = await getSetting(env.DB, 'waline_client_version').catch(() => null) || 'v3';
  const url = new URL(requestUrl);
  const serverURL = `${url.protocol}//${url.host}${url.pathname.replace(/\/+$/, '')}`;

  const turnstileKey = env.TURNSTILE_KEY || '';
  const recaptchaKey = env.RECAPTCHA_V3_KEY || '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Waline Example</title>
</head>
<body>
  <div id="waline" style="max-width: 800px;margin: 0 auto;"></div>
  <link href='//unpkg.com/@waline/client@${escapeHtml(clientVersion)}/dist/waline.css' rel='stylesheet' />
  <script type="module">
    import { init } from 'https://unpkg.com/@waline/client@${escapeHtml(clientVersion)}/dist/waline.js';

    console.log(
      '%c @waline-on-Worker/server %c v0.1.0 ',
      'color: white; background: #0078E7; padding:5px 0;',
      'padding:4px;border:1px solid #0078E7;'
    );
    const params = new URLSearchParams(location.search.slice(1));
    const waline = init({
      el: '#waline',
      path: params.get('path') || '/',
      lang: params.get('lng') || undefined,
      serverURL: '${serverURL}',
      ${recaptchaKey ? `recaptchaV3Key: '${escapeHtml(recaptchaKey)}',` : ''}
      ${turnstileKey ? `turnstileKey: '${escapeHtml(turnstileKey)}',` : ''}
    });
  </script>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
