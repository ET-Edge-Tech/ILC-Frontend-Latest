import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// The website's own security rules (Content Security Policy). Only in the production build: the dev server needs
// looser rules for instant reload. It allows scripts from this site only, the API, the file store, Google Fonts and
// the two video players; everything else (other sites' scripts, plugins, forms posting elsewhere) is blocked.
// The web server sends the same rules as headers, plus the ones a page cannot set itself (deploy/nginx.conf).
export function contentSecurityPolicy(apiUrl) {
  let api = '';
  let ws = '';
  try {
    const u = new URL(apiUrl);
    api = u.origin;
    ws = `${u.protocol === 'https:' ? 'wss:' : 'ws:'}//${u.host}`;
  } catch {
    /* no API address: same site only */
  }
  return [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "media-src 'self' blob: https:",
    `connect-src 'self' ${api} ${ws} https://*.amazonaws.com`.replace(/\s+/g, ' ').trim(),
    "worker-src 'self' blob:",
    'frame-src https://www.youtube-nocookie.com https://player.vimeo.com',
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    // On the live site (https) any plain-http address is upgraded; a local test build on http keeps working.
    ...(api.startsWith('https:') ? ['upgrade-insecure-requests'] : []),
  ].join('; ');
}

const cspPlugin = (apiUrl) => ({
  name: 'ilc-csp',
  apply: 'build',
  transformIndexHtml(html) {
    const tag = `<meta http-equiv="Content-Security-Policy" content="${contentSecurityPolicy(apiUrl)}" />\n    <meta name="referrer" content="strict-origin-when-cross-origin" />`;
    return html.replace('<meta charset="UTF-8" />', `<meta charset="UTF-8" />\n    ${tag}`);
  },
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  return {
    plugins: [react(), tailwindcss(), cspPlugin(env.VITE_API_URL)],
    server: { port: 5180, strictPort: true },
    build: { sourcemap: false }, // the original source code is not published with the live site
  };
});
