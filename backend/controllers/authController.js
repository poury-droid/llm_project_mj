// 회원가입, 로그인, 현재 사용자 조회, 로그아웃의 HTTP 요청과 응답을 담당합니다.
import * as authService from "../services/authService.js";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function setSessionCookie(res, token, maxAgeSeconds) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader("Set-Cookie", `nextstep_session=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure}`);
}

function clearSessionCookie(res) {
  res.setHeader("Set-Cookie", "nextstep_session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0");
}

export async function register(req, res) {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  if (!emailPattern.test(email)) return res.status(400).json({ message: "올바른 이메일을 입력해 주세요." });
  if (password.length < 8) return res.status(400).json({ message: "비밀번호는 8자 이상이어야 합니다." });
  if (await authService.findUserByEmail(email)) return res.status(409).json({ message: "이미 등록된 이메일입니다." });

  const user = await authService.createUser(email, await authService.hashPassword(password));
  const session = await authService.createSession(user.id, true);
  setSessionCookie(res, session.token, session.maxAgeSeconds);
  res.status(201).json({ user: { id: user.id, email: user.email } });
}

export async function login(req, res) {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const user = await authService.findUserByEmail(email);
  if (!user || !(await authService.verifyPassword(password, user.password_hash))) {
    return res.status(401).json({ message: "이메일 또는 비밀번호가 올바르지 않습니다." });
  }
  const session = await authService.createSession(user.id, Boolean(req.body.remember));
  setSessionCookie(res, session.token, session.maxAgeSeconds);
  res.json({ user: { id: user.id, email: user.email } });
}

export async function resetPassword(req, res) {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  if (!emailPattern.test(email)) return res.status(400).json({ message: "올바른 이메일을 입력해 주세요." });
  if (password.length < 8) return res.status(400).json({ message: "비밀번호는 8자 이상이어야 합니다." });

  const user = await authService.findUserByEmail(email);
  if (!user) return res.status(404).json({ message: "등록된 이메일을 찾을 수 없습니다." });

  await authService.updatePassword(user.id, await authService.hashPassword(password));
  res.json({ ok: true });
}

export function me(req, res) {
  res.json({ user: { id: req.user.id, email: req.user.email } });
}

export async function logout(req, res) {
  const token = req.sessionToken;
  if (token) await authService.deleteSession(token);
  clearSessionCookie(res);
  res.status(204).send();
}
