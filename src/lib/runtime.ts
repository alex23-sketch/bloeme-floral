export type RuntimeMode = 'standard' | 'business-pro';
export const runtimeMode: RuntimeMode = (import.meta.env.VITE_APP_MODE === 'business-pro' ? 'business-pro' : 'standard');
const configuredApiUrl = String(import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1').replace(/\/$/, '');
// Avoid localhost IPv4/IPv6 split-brain in local browsers; same-origin host is
// used for loopback URLs while production keeps the explicitly configured host.
let localPort = ':8000';
try { const configured = new URL(configuredApiUrl); localPort = configured.port ? `:${configured.port}` : localPort; } catch { /* keep default */ }
export const apiBaseUrl = typeof window !== 'undefined' && /^(https?:\/\/)(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?/.test(configuredApiUrl)
  ? `${window.location.protocol}//localhost${localPort}/api/v1`
  : configuredApiUrl;
export const isBusinessPro = runtimeMode === 'business-pro';
