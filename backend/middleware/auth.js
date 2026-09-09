// HttpOnly 세션 쿠키를 읽어 인증된 사용자 정보를 req.user에 주입합니다.
import { findSession } from "../services/authService.js";

async function getSupabaseUser(token) {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) return null;
  const response = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: process.env.SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` }
  });
  if (!response.ok) return null;
  return response.json();
}

export function readSessionToken(req) {
  const cookies = req.headers.cookie?.split(";").map((part) => part.trim()) || [];
  const sessionCookie = cookies.find((cookie) => cookie.startsWith("nextstep_session="));
  return sessionCookie ? decodeURIComponent(sessionCookie.slice("nextstep_session=".length)) : null;
}

export async function requireAuth(req, res, next) {
  try {
    const authorization = req.headers.authorization || "";
    const bearerToken = authorization.startsWith("Bearer ") ? authorization.slice(7) : null;
    if (bearerToken) {
      const user = await getSupabaseUser(bearerToken);
      if (!user) return res.status(401).json({ message: "로그인이 필요합니다." });
      req.user = { id: user.id, email: user.email };
      return next();
    }
    const token = readSessionToken(req);
    const user = token ? await findSession(token) : null;
    if (!user) return res.status(401).json({ message: "로그인이 필요합니다." });
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}
