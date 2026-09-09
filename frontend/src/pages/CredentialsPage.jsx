import React, { useEffect, useRef, useState } from "react";
import { api } from "../services/api.js";

const emptyForm = {
  name: "",
  grade: "",
  acquiredDate: "",
  expiresAt: "",
  score: "",
  issuer: "",
  memo: ""
};

function CredentialsPage() {
  const [credentials, setCredentials] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);
  const formRef = useRef(null);
  const nameRef = useRef(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setCredentials(await api.getCredentials());
    } catch (err) {
      setError(err.message);
    }
  }

  async function submit(event) {
    event.preventDefault();
    if (saving) return;
    setError("");
    setFeedback("");
    if (!form.name.trim()) return setError("자격증명 또는 시험명을 입력해주세요.");
    setSaving(true);
    try {
      const payload = { ...form, name: form.name.trim() };
      if (editingId) {
        const updated = await api.updateCredential(editingId, payload);
        setCredentials((items) => items.map((item) => item.id === updated.id ? updated : item));
        setFeedback("자격 정보를 수정했습니다.");
      } else {
        const created = await api.createCredential(payload);
        setCredentials((items) => [created, ...items]);
        setFeedback("자격 정보를 추가했습니다.");
      }
      setForm(emptyForm);
      setEditingId("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id) {
    if (saving) return;
    setError(""); setFeedback(""); setSaving(true);
    try {
      await api.deleteCredential(id);
      setCredentials((items) => items.filter((item) => item.id !== id));
      if (editingId === id) { setEditingId(""); setForm(emptyForm); }
      setFeedback("자격 정보를 삭제했습니다.");
    } catch (err) {
      setError(err.message);
    } finally { setSaving(false); }
  }

  function edit(item) {
    setError("");
    setFeedback("");
    setEditingId(item.id);
    setForm({
      name: item.name || "",
      grade: item.grade || "",
      acquiredDate: String(item.acquiredDate || "").slice(0, 10),
      expiresAt: String(item.expiresAt || "").slice(0, 10),
      score: item.score ?? "",
      issuer: item.issuer || "",
      memo: item.memo || ""
    });
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    nameRef.current?.focus({ preventScroll: true });
  }

  return (
    <section>
      <div className="page-title">
        <div>
          <h1>내 자격</h1>
          <p>자격증과 어학점수를 미리 등록해 지원자격과 가점 분석에 사용합니다.</p>
        </div>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      {feedback && <p className="success" role="status">{feedback}</p>}

      <form className="panel" onSubmit={submit} ref={formRef} aria-labelledby="credential-form-title" style={{ scrollMarginTop: 20 }}>
        <h2 id="credential-form-title">{editingId ? "등록된 자격 수정" : "자격 추가"}</h2>
        {editingId && <p className="muted">수정 중: {credentials.find((item) => item.id === editingId)?.name} · 내용을 변경한 뒤 ‘수정 저장’을 눌러주세요.</p>}
        <fieldset disabled={saving} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
        <div className="form-grid">
          <label>자격증명 또는 시험명<input ref={nameRef} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label>
          <label>등급<input value={form.grade} onChange={(event) => setForm({ ...form, grade: event.target.value })} placeholder="1급" /></label>
          <label>취득일<input type="date" value={form.acquiredDate} onChange={(event) => setForm({ ...form, acquiredDate: event.target.value })} /></label>
          <label>만료일<input type="date" value={form.expiresAt} onChange={(event) => setForm({ ...form, expiresAt: event.target.value })} /></label>
          <label>점수<input value={form.score} onChange={(event) => setForm({ ...form, score: event.target.value })} placeholder="870점" /></label>
          <label>발급기관<input value={form.issuer} onChange={(event) => setForm({ ...form, issuer: event.target.value })} /></label>
        </div>
        <label>메모<textarea value={form.memo} onChange={(event) => setForm({ ...form, memo: event.target.value })} /></label>
        <div className="actions">
          <button className="button" type="submit">{saving ? "저장 중..." : editingId ? "수정 저장" : "자격 추가"}</button>
          {editingId && <button className="button secondary" type="button" onClick={() => { setEditingId(""); setForm(emptyForm); setError(""); setFeedback(""); }}>취소</button>}
        </div>
        </fieldset>
      </form>

      {!editingId && <div className="panel">
        <div className="section-header">
          <h2>등록된 자격</h2>
        </div>
        {!credentials.length && <p className="empty">등록된 자격 정보가 없습니다.</p>}
        <div className="credential-list">
          {credentials.map((item) => (
            <article className="credential-card" key={item.id}>
              <div>
                <h3>{item.name}</h3>
                {editingId === item.id && <small className="success">수정 중</small>}
                <p>{[item.grade, item.score, item.issuer].filter(Boolean).join(" · ") || "세부 정보 없음"}</p>
                <small>{item.acquiredDate || "취득일 미입력"} {item.expiresAt ? `~ ${item.expiresAt}` : ""}</small>
              </div>
              <div className="actions">
                <button className="button secondary" type="button" disabled={saving} onClick={() => edit(item)}>수정</button>
                <button className="button danger-button" type="button" disabled={saving} onClick={() => remove(item.id)}>삭제</button>
              </div>
            </article>
          ))}
        </div>
      </div>}
    </section>
  );
}

export default CredentialsPage;
