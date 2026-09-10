import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function LoginPage() {
  const navigate = useNavigate();
  const { user, loading, signIn, signUp, resetPassword, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ email: "", password: "", confirmPassword: "", remember: true });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const title = useMemo(() => {
    if (mode === "signup") return "계정 만들기";
    if (mode === "reset") return "비밀번호 재설정";
    return "로그인";
  }, [mode]);

  useEffect(() => {
    if (!loading && user) navigate("/", { replace: true });
  }, [loading, navigate, user]);

  function updateField(event) {
    const { name, type, checked, value } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  function changeMode(nextMode) {
    setMode(nextMode);
    setError("");
    setForm((current) => ({ ...current, password: "", confirmPassword: "" }));
  }

  async function handleGoogleSignIn() {
    setError("");
    setMessage("");
    try {
      await signInWithGoogle();
    } catch (loginError) {
      setError(loginError.message || "Google 로그인을 시작하지 못했습니다. 다시 시도해 주세요.");
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!form.email.trim()) return setError("이메일을 입력해 주세요.");
    if (!form.password) return setError("비밀번호를 입력해 주세요.");
    if ((mode === "signup" || mode === "reset") && form.password.length < 8) {
      return setError("비밀번호는 8자 이상이어야 합니다.");
    }
    if ((mode === "signup" || mode === "reset") && form.password !== form.confirmPassword) {
      return setError("비밀번호가 일치하지 않습니다.");
    }

    setSubmitting(true);
    try {
      if (mode === "signup") {
        await signUp({ email: form.email, password: form.password });
        navigate("/", { replace: true });
        return;
      }
      if (mode === "reset") {
        await resetPassword({ email: form.email, password: form.password });
        changeMode("login");
        setMessage("비밀번호를 변경했습니다. 새 비밀번호로 로그인해 주세요.");
        return;
      }
      await signIn({ email: form.email, password: form.password, remember: form.remember });
      navigate("/", { replace: true });
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-hero" aria-labelledby="login-title">
        <Link className="login-brand" to="/" aria-label="NextStep 홈으로 이동">
          <span className="brand-mark">NS</span>
          <span>NextStep</span>
        </Link>
        <div className="login-copy">
          <p>취업 일정 비서</p>
          <h1 id="login-title">오늘의 지원 일정을 바로 찾아가기</h1>
        </div>
        <dl className="login-stats">
          <div><dt>지원 공고</dt><dd>채용공고 관리</dd></div>
          <div><dt>D-Day</dt><dd>자동 정리</dd></div>
          <div><dt>체크리스트</dt><dd>단계별 추적</dd></div>
        </dl>
        {mode === "login" && (
          <>
            <div className="login-divider"><span>또는</span></div>
            <button className="button google-button full" onClick={handleGoogleSignIn} type="button">
              Google로 로그인
            </button>
          </>
        )}
      </section>
      <section className="login-panel" aria-label={title}>
        <div>
          <p className="eyebrow">Account</p>
          <h2>{title}</h2>
          <p className="muted">지원 현황과 취업 일정을 한 곳에서 관리하세요.</p>
        </div>
        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            이메일
            <input autoComplete="email" inputMode="email" name="email" onChange={updateField} placeholder="name@example.com" type="email" value={form.email} />
          </label>
          <label>
            비밀번호
            <input autoComplete={mode === "login" ? "current-password" : "new-password"} name="password" onChange={updateField} placeholder="8자 이상 입력" type="password" value={form.password} />
          </label>
          {(mode === "signup" || mode === "reset") && (
            <label>
              비밀번호 확인
              <input autoComplete="new-password" name="confirmPassword" onChange={updateField} placeholder="비밀번호를 다시 입력" type="password" value={form.confirmPassword} />
            </label>
          )}
          {mode === "login" && (
            <div className="login-options">
              <label className="check-label">
                <input checked={form.remember} name="remember" onChange={updateField} type="checkbox" />
                로그인 유지
              </label>
              <button className="text-link login-mode-button" onClick={() => changeMode("signup")} type="button">계정 만들기</button>
            </div>
          )}
          {message && <p className="success">{message}</p>}
          {error && <p className="error">{error}</p>}
          <button className="button full" disabled={submitting} type="submit">
            {submitting ? "처리 중..." : mode === "signup" ? "계정 만들고 시작하기" : mode === "reset" ? "비밀번호 변경" : "로그인"}
          </button>
        </form>
        {mode === "login" && <button className="text-link login-mode-button" onClick={() => changeMode("reset")} type="button">비밀번호를 잊으셨나요?</button>}
        {mode !== "login" && <button className="text-link login-mode-button" onClick={() => changeMode("login")} type="button">로그인으로 돌아가기</button>}
      </section>
    </main>
  );
}

export default LoginPage;
