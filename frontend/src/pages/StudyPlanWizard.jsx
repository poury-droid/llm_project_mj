import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../services/api.js";

import StudyScheduleSettings, { defaultScheduleOptions } from "../components/StudyScheduleSettings.jsx";

const METHODS = ["개념", "문제풀이", "기출", "모의고사", "복습", "오답정리", "기타"];
const UNITS = ["페이지", "회차", "문제", "강의", "단원", "직접 입력"];
const makeItem = () => ({ id: crypto.randomUUID(), subject: "", method: "개념", material: "", unit: "페이지", customUnit: "", total: "", done: "0" });

export default function StudyPlanWizard({ applicationMode = false }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [apps, setApps] = useState([]);
  const [exam, setExam] = useState({ type: applicationMode ? "application" : "personalExam", name: "", date: "" });
  const [items, setItems] = useState([makeItem()]);
  const [settings, setSettings] = useState({ weekday: 2, weekend: 4, excluded: [], date: "" });
  const [scheduleOptions, setScheduleOptions] = useState(defaultScheduleOptions);
  const [error, setError] = useState("");

  useEffect(() => {
    if (applicationMode && id) api.getApplication(id).then((app) => setExam({ type: "application", name: `${app.company} 필기시험`, date: app.writtenTestDate?.slice(0, 10) || "" })).catch((e) => setError(e.message));
    if (!applicationMode) api.getApplications().then((data) => setApps(data || [])).catch((e) => setError(e.message));
  }, [applicationMode, id]);

  const updateItem = (index, key, value) => setItems((list) => list.map((item, i) => i === index ? { ...item, [key]: value } : item));
  const chooseApplication = (app) => { setExam({ type: "application", applicationId: app.id, name: `${app.company} 필기시험`, date: app.writtenTestDate?.slice(0, 10) || "" }); setStep(2); };
  const addDate = () => { if (settings.date && !settings.excluded.includes(settings.date)) setSettings({ ...settings, excluded: [...settings.excluded, settings.date], date: "" }); };
  const validation = () => {
    if (!exam.name || !exam.date) return "시험명과 시험일을 입력해주세요.";
    if (!items.some((item) => item.subject.trim() && item.material.trim() && Number(item.total) > Number(item.done || 0))) return "공부할 항목을 1개 이상 추가해주세요.";
    return "";
  };
  async function create(event) {
    event.preventDefault(); const message = validation(); if (message) return setError(message); setError("");
    const payload = { scheduleOptions, type: exam.type, examName: exam.name, examDate: exam.date, weekdayHours: Number(settings.weekday), weekendHours: Number(settings.weekend), availableDays: [0, 1, 2, 3, 4, 5, 6], excludedDates: settings.excluded, phaseMode: "auto", subjects: items.filter((item) => item.subject.trim() && item.material.trim()).map((item) => ({ id: item.id, name: item.subject.trim(), importance: 3, methods: [item.method], materials: [{ id: `${item.id}-material`, name: item.material.trim(), type: item.method, unit: item.unit === "직접 입력" ? item.customUnit.trim() : item.unit, totalAmount: item.total, currentAmount: item.done }] })) };
    try { const plan = applicationMode ? await api.createStudyPlan(id, payload) : await api.createPersonalStudyPlan(payload); navigate(applicationMode ? `/applications/${id}/study-plan` : `/study-plans/${plan.id}`, { replace: true }); } catch (e) { setError(e.message); }
  }
  return <section>
    <div className="page-title"><div><h1>공부계획 만들기</h1><p>{exam.name || "시험을 선택하고 공부할 것을 등록해보세요."}</p></div><Link className="button secondary" to="/study-plans">플래너 목록</Link></div>
    {error && <p className="error">{error}</p>}
    <form className="panel study-wizard" onSubmit={create}>
      <div className="wizard-steps">{["시험 선택", "공부할 것 등록", "공부 가능시간", "계획 생성"].map((label, index) => <button type="button" key={label} className={step === index + 1 ? "active" : ""} onClick={() => index + 1 < step && setStep(index + 1)}><b>{index + 1}</b>{label}</button>)}</div>
      {step === 1 && <div className="wizard-section"><h2>어떤 시험을 준비하나요?</h2><div className="choice-grid"><button type="button" className={exam.type === "application" ? "choice active" : "choice"} onClick={() => setExam({ ...exam, type: "application" })}>채용 필기시험</button><button type="button" className={exam.type === "personalExam" ? "choice active" : "choice"} onClick={() => setExam({ ...exam, type: "personalExam" })}>개인 시험</button></div>{exam.type === "application" ? <><div className="exam-cards">{apps.map((app) => <button type="button" className={exam.applicationId === app.id ? "exam-card active" : "exam-card"} key={app.id} onClick={() => chooseApplication(app)}><strong>{app.company}</strong><span>{app.position}</span><small>필기시험 {app.writtenTestDate?.slice(0, 10) || "시험일 미등록"}</small><b>선택</b></button>)}{!apps.length && <p className="empty">등록된 지원 공고가 없습니다.</p>}</div>{exam.applicationId && <label>시험일<input required type="date" value={exam.date} onChange={(e) => setExam({ ...exam, date: e.target.value })} /></label>}</> : <div className="form-grid"><label>시험명<input required value={exam.name} onChange={(e) => setExam({ ...exam, name: e.target.value })} placeholder="예: TOEIC" /></label><label>시험일<input required type="date" value={exam.date} onChange={(e) => setExam({ ...exam, date: e.target.value })} /></label></div>}<button type="button" className="button" disabled={!exam.name || !exam.date} onClick={() => setStep(2)}>다음 단계</button></div>}
      {step === 2 && <div className="wizard-section"><h2>공부할 것을 등록해주세요</h2><p className="muted">과목, 방식, 자료, 남은 분량을 하나의 항목으로 입력합니다.</p>{items.map((item, index) => <div className="study-item-card" key={item.id}><div className="study-item-row"><input value={item.subject} onChange={(e) => updateItem(index, "subject", e.target.value)} placeholder="과목 예: 경제학" /><select value={item.method} onChange={(e) => updateItem(index, "method", e.target.value)}>{METHODS.map((value) => <option key={value}>{value}</option>)}</select><input value={item.material} onChange={(e) => updateItem(index, "material", e.target.value)} placeholder="자료명 예: 기출문제집" /><select value={item.unit} onChange={(e) => updateItem(index, "unit", e.target.value)}>{UNITS.map((value) => <option key={value}>{value}</option>)}</select>{item.unit === "직접 입력" && <input value={item.customUnit} onChange={(e) => updateItem(index, "customUnit", e.target.value)} placeholder="단위 입력" />}<input type="number" min="1" value={item.total} onChange={(e) => updateItem(index, "total", e.target.value)} placeholder="전체 분량" /><input type="number" min="0" value={item.done} onChange={(e) => updateItem(index, "done", e.target.value)} placeholder="완료 분량" /><button type="button" className="icon-button" onClick={() => setItems(items.length === 1 ? [makeItem()] : items.filter((_, i) => i !== index))}>삭제</button></div><div className="study-item-summary"><strong>{item.subject || "과목"}</strong><span>{item.material || "자료명"}</span><span>{item.method}</span><span>{item.done > 0 ? `${Number(item.done) + 1}~${item.total}` : `총 ${item.total || 0}`}{item.unit === "직접 입력" ? item.customUnit : item.unit}</span></div></div>)}<button type="button" className="button secondary" onClick={() => setItems([...items, makeItem()])}>+ 공부할 것 추가</button><div className="wizard-actions"><button type="button" className="button secondary" onClick={() => setStep(1)}>이전</button><button type="button" className="button" onClick={() => setStep(3)}>다음 단계</button></div></div>}
      {step === 3 && <div className="wizard-section"><h2>공부 가능시간을 입력해주세요</h2><div className="form-grid"><label>평일 공부 가능시간<input type="number" min="0" max="24" step="1" value={settings.weekday} onChange={(e) => setSettings({ ...settings, weekday: e.target.value })} />시간</label><label>주말 공부 가능시간<input type="number" min="0" max="24" step="1" value={settings.weekend} onChange={(e) => setSettings({ ...settings, weekend: e.target.value })} />시간</label></div><h3>공부하지 못하는 날짜</h3><div className="inline-form compact-form"><input type="date" value={settings.date} onChange={(e) => setSettings({ ...settings, date: e.target.value })} /><button type="button" className="button secondary" onClick={addDate}>날짜 추가</button></div><div className="tags">{settings.excluded.map((date) => <span key={date}>{date}<button type="button" onClick={() => setSettings({ ...settings, excluded: settings.excluded.filter((value) => value !== date) })}>×</button></span>)}</div><StudyScheduleSettings value={scheduleOptions} onChange={setScheduleOptions} /><div className="wizard-actions"><button type="button" className="button secondary" onClick={() => setStep(2)}>이전</button><button className="button" type="submit">공부계획 만들기</button></div></div>}
    </form>
  </section>;
}
