import React, { useEffect, useState } from "react";
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
    setError("");
    setFeedback("");
    try {
      if (editingId) {
        await api.updateCredential(editingId, form);
        setFeedback("자격 정보를 수정했습니다.");
      } else {
        await api.createCredential(form);
        setFeedback("자격 정보를 추가했습니다.");
      }
      setForm(emptyForm);
      setEditingId("");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(id) {
    await api.deleteCredential(id);
    await load();
  }

  function edit(item) {
    setEditingId(item.id);
    setForm({
      name: item.name || "",
      grade: item.grade || "",
      acquiredDate: item.acquiredDate || "",
      expiresAt: item.expiresAt || "",
      score: item.score || "",
      issuer: item.issuer || "",
      memo: item.memo || ""
    });
  }

  return (
    <section>
      <div className="page-title">
        <div>
          <h1>내 자격</h1>
          <p>자격증과 어학점수를 미리 등록해 지원자격과 가점 분석에 사용합니다.</p>
        </div>
      </div>
      {error && <p className="error">{error}</p>}
      {feedback && <p className="success">{feedback}</p>}

      <form className="panel" onSubmit={submit}>
        <div className="form-grid">
          <label>자격증명 또는 시험명<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label>
          <label>등급<input value={form.grade} onChange={(event) => setForm({ ...form, grade: event.target.value })} placeholder="1급" /></label>
          <label>취득일<input type="date" value={form.acquiredDate} onChange={(event) => setForm({ ...form, acquiredDate: event.target.value })} /></label>
          <label>만료일<input type="date" value={form.expiresAt} onChange={(event) => setForm({ ...form, expiresAt: event.target.value })} /></label>
          <label>점수<input value={form.score} onChange={(event) => setForm({ ...form, score: event.target.value })} placeholder="870점" /></label>
          <label>발급기관<input value={form.issuer} onChange={(event) => setForm({ ...form, issuer: event.target.value })} /></label>
        </div>
        <label>메모<textarea value={form.memo} onChange={(event) => setForm({ ...form, memo: event.target.value })} /></label>
        <div className="actions">
          <button className="button" type="submit">{editingId ? "수정 저장" : "자격 추가"}</button>
          {editingId && <button className="button secondary" type="button" onClick={() => { setEditingId(""); setForm(emptyForm); }}>취소</button>}
        </div>
      </form>

      <div className="panel">
        <div className="section-header">
          <h2>등록된 자격</h2>
        </div>
        {!credentials.length && <p className="empty">등록된 자격 정보가 없습니다.</p>}
        <div className="credential-list">
          {credentials.map((item) => (
            <article className="credential-card" key={item.id}>
              <div>
                <h3>{item.name}</h3>
                <p>{[item.grade, item.score, item.issuer].filter(Boolean).join(" · ") || "세부 정보 없음"}</p>
                <small>{item.acquiredDate || "취득일 미입력"} {item.expiresAt ? `~ ${item.expiresAt}` : ""}</small>
              </div>
              <div className="actions">
                <button className="button secondary" type="button" onClick={() => edit(item)}>수정</button>
                <button className="button danger-button" type="button" onClick={() => remove(item.id)}>삭제</button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default CredentialsPage;
