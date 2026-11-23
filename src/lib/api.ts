import { apiBaseUrl, isBusinessPro } from './runtime';
let csrfToken: string | null = null;
export class ApiError extends Error { constructor(public status:number, message:string, public details?:unknown){super(message)} }
export async function apiFetch<T>(path:string, init:RequestInit={}) : Promise<T> {
  if(!isBusinessPro) throw new ApiError(0,'Business PRO mode is not enabled');
  const headers:Record<string,string>={'Content-Type':'application/json',...(init.headers as Record<string,string>||{})};
  if(csrfToken) headers['X-CSRF-Token']=csrfToken;
  const res=await fetch(`${apiBaseUrl}${path}`,{...init,headers,credentials:'include'});
  const text=await res.text(); let body:unknown={}; try{body=text?JSON.parse(text):{}}catch{/* ignore parse */}
  if(!res.ok){const b=body as {error?:{message?:string};detail?:string};throw new ApiError(res.status,b.error?.message||b.detail||`Request failed (${res.status})`,body)}
  return body as T;
}
export type AuthResult={setup_required?:boolean;authenticated?:boolean;user?:Record<string,unknown>;csrf_token?:string};
export async function authStatus(){return apiFetch<AuthResult>('/auth/status')}
export async function login(email:string,password:string){const result=await apiFetch<AuthResult>('/auth/login',{method:'POST',body:JSON.stringify({email,password})});csrfToken=(result as {csrf_token:string}).csrf_token;return result}
export async function setupOwner(payload:Record<string,unknown>){const result=await apiFetch<AuthResult>('/auth/setup',{method:'POST',body:JSON.stringify(payload)});csrfToken=(result as {csrf_token:string}).csrf_token;return result}
export async function logout(){const result=await apiFetch<unknown>('/auth/logout',{method:'POST'});csrfToken=null;return result}
export async function getSite(){return apiFetch<unknown>('/site')}
export type AdminRecord=Record<string,unknown>; export async function getAdmin(path:string){return apiFetch<AdminRecord|AdminRecord[]>(`/admin${path}`)}
export async function mutateAdmin(path:string,method:'POST'|'PATCH'|'DELETE',body?:unknown){return apiFetch<unknown>(`/admin${path}`,{method,body:body===undefined?undefined:JSON.stringify(body)})}
