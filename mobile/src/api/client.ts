import * as SecureStore from 'expo-secure-store';
export type ApiMode = 'standard' | 'business-pro';
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
export const MODE: ApiMode = process.env.EXPO_PUBLIC_MODE === 'business-pro' ? 'business-pro' : 'standard';
const SESSION_KEY = 'bloeme_mobile_session';
let csrf: string | null = null;
async function token() { return SecureStore.getItemAsync(SESSION_KEY); }
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (MODE === 'standard') throw new Error('Business PRO API mode is not configured');
  const session = await token();
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(init.headers as Record<string, string> || {}) };
  if (session) headers.Authorization = `Bearer ${session}`;
  if (csrf) headers['X-CSRF-Token'] = csrf;
  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  const text = await res.text(); let body: any = {};
  try { body = text ? JSON.parse(text) : {}; } catch { /* response is not JSON */ }
  if (!res.ok) throw new Error(body?.error?.message || body?.detail || `Request failed (${res.status})`);
  return body as T;
}
export async function site() { return api<any>('/site'); }
export async function products(params = '') { return api<any[]>(`/products${params}`); }
export async function collections() { return api<any[]>('/collections'); }
export async function quote(body: any) { return api<any>('/quote', { method: 'POST', body: JSON.stringify(body) }); }
export async function checkout(body: any, idempotencyKey: string) { return api<any>('/customers/checkout', { method: 'POST', headers: { 'Idempotency-Key': idempotencyKey }, body: JSON.stringify(body) }); }
export async function register(payload: any) { const r = await api<any>('/customers/register', { method: 'POST', headers: { 'X-Client-Platform': 'mobile' }, body: JSON.stringify(payload) }); await SecureStore.setItemAsync(SESSION_KEY, r.token); return r; }
export async function login(email: string, password: string) { const r = await api<any>('/auth/login', { method: 'POST', headers: { 'X-Client-Platform': 'mobile' }, body: JSON.stringify({ email, password }) }); if (r.session_token) { await SecureStore.setItemAsync(SESSION_KEY, r.session_token); csrf = r.csrf_token; } return r; }
export async function recover(email: string) { return api<any>('/customers/recovery', { method: 'POST', body: JSON.stringify({ email }) }); }
export async function me() { return api<any>('/customers/me'); }
export async function orders() { return api<any[]>('/customers/orders'); }
export async function logout() { await api('/customers/logout', { method: 'POST' }); await SecureStore.deleteItemAsync(SESSION_KEY); csrf = null; }
