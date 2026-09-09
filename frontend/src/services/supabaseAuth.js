function getApiBaseUrl() {
  if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL;
  const host = window.location.hostname;
  const protocol = window.location.protocol;
  return `${protocol}//${host}:4000/api`;
}

const API_BASE_URL = getApiBaseUrl();
const ACCESS_TOKEN_KEY = "nextstep_supabase_access_token";

function getStoredAccessToken() {
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

function saveAccessToken(token) {
  if (token) window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

function clearAccessToken() {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
}

function consumeOAuthCallback() {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const accessToken = hash.get("access_token");
  if (!accessToken) return;
  saveAccessToken(accessToken);
  window.history.replaceState({}, document.title, `${window.location.pathname}${window.location.search}`);
}

async function request(path, options = {}) {
  const accessToken = getStoredAccessToken();
  const response = await fetch(`${API_BASE_URL}/auth${path}`, {
    credentials: "include",
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message || "인증 요청에 실패했습니다.");
  return data;
}

export async function signUp(email, password) {
  const data = await request("/register", { method: "POST", body: JSON.stringify({ email, password }) });
  return { user: data.user, session: true };
}

export async function signIn(email, password, remember = true) {
  return request("/login", { method: "POST", body: JSON.stringify({ email, password, remember }) });
}

export async function getCurrentUser() {
  consumeOAuthCallback();
  const data = await request("/me");
  return data.user;
}

export async function signOut() {
  try {
    await request("/logout", { method: "POST" });
  } finally {
    clearAccessToken();
  }
}

export function signInWithGoogle() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) throw new Error("Supabase 환경변수가 설정되지 않았습니다.");
  const redirectTo = `${window.location.origin}/auth/callback`;
  const authorizeUrl = new URL(`${supabaseUrl}/auth/v1/authorize`);
  authorizeUrl.searchParams.set("provider", "google");
  authorizeUrl.searchParams.set("redirect_to", redirectTo);
  authorizeUrl.searchParams.set("apikey", anonKey);
  window.location.assign(authorizeUrl.toString());
}

export function getAccessToken() {
  return getStoredAccessToken();
}
