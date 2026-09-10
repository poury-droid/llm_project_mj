import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { api } from "../services/api.js";
import StudyScheduleSettings, { defaultScheduleOptions } from "../components/StudyScheduleSettings.jsx";
import StudyTaskForm from "../components/StudyTaskForm.jsx";
import "../styles/studyDetail.css";
import "../styles/studyDetailActions.css";
import "../styles/studyTaskEdit.css";
import "../styles/studyTaskMenu.css";

const emptyTask = (date) => ({ date, subject: "", materialName: "", method: "개념", rangeLabel: "", hours: 1 });
function formatStudyHours(hours) {
  const value = Number(hours);
  if (!Number.isFinite(value)) return hours;
  return value.toFixed(1);
}

function getProgress(plan) {
  const tasks = (plan?.days || []).flatMap((day) => day.blocks || []);
  const bySubject = {};
  for (const task of tasks) {
    const subject = task.subject || "기타";
    bySubject[subject] ||= { total: 0, done: 0 };
    bySubject[subject].total++;
    if (task.completed) bySubject[subject].done++;
  }
  for (const value of Object.values(bySubject)) value.percent = Math.round(value.done / value.total * 100);
  const done = tasks.filter((task) => task.completed).length;
  return { total: tasks.length, done, percent: tasks.length ? Math.round(done / tasks.length * 100) : 0, bySubject };
}

export default function StudyPlanDetail() {
  const { id } = useParams();
  const location = useLocation();
  const applicationMode = location.pathname.startsWith("/applications/");
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [editor, setEditor] = useState(null);
  const [taskForm, setTaskForm] = useState(emptyTask(""));
  const [taskMenuId, setTaskMenuId] = useState("");
  const [scheduleOptions, setScheduleOptions] = useState(defaultScheduleOptions);
  const [studyHours, setStudyHours] = useState({ weekdayHours: 2, weekendHours: 4 });

  useEffect(() => {
    let active = true;
    setPlan(null); setError(""); setEditor(null);
    const request = applicationMode ? api.getStudyPlan(id) : api.getStudyPlanById(id);
    request.then((saved) => {
      if (!active) return;
      if (!saved) throw new Error("공부계획을 찾을 수 없습니다.");
      setPlan(saved); setScheduleOptions({ ...defaultScheduleOptions, ...saved.scheduleOptions });
      setStudyHours({ weekdayHours: saved.weekdayHours, weekendHours: saved.weekendHours });
    }).catch((e) => active && setError(e.message));
    return () => { active = false; };
  }, [applicationMode, id]);

  const progress = useMemo(() => getProgress(plan), [plan]);
  const dates = (plan?.days || []).map((day) => day.date);
  async function saveDays(days, success) {
    setBusy(true); setError(""); setMessage("");
    try {
      const saved = await api.updateStudyPlanById(plan.id, { days });
      setPlan((previous) => ({ ...previous, ...saved }));
      setMessage(success); setEditor(null); setTaskMenuId("");
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  function startEdit(task, date) {
    setTaskForm({ date, subject: task.subject || "", materialName: task.materialName || "", method: task.method || "개념", rangeLabel: task.rangeLabel || "", hours: task.hours || 1 });
    setEditor({ id: task.id, date }); setTaskMenuId("");
  }
  function startAdd(date) { setTaskForm(emptyTask(date)); setEditor({ id: null, date }); }
  async function saveTask(event) {
    event.preventDefault();
    if (!taskForm.subject.trim()) return setError("과목을 입력해주세요.");
    const hours = Number(taskForm.hours);
    if (!Number.isFinite(hours) || hours <= 0 || hours > 24) return setError("공부시간은 0보다 크고 24 이하로 입력해주세요.");
    const target = plan.days.find((day) => day.date === taskForm.date);
    if (!target) return setError("계획에 포함된 날짜를 선택해주세요.");
    if (target.excluded && !window.confirm("공부 제외 날짜입니다. 이 날짜에 공부 항목을 넣을까요?")) return;
    const original = plan.days.flatMap((day) => day.blocks || []).find((task) => task.id === editor.id);
    const block = { ...original, id: original?.id || crypto.randomUUID(), subjectId: original?.subjectId || "",
      subject: taskForm.subject.trim(), materialName: taskForm.materialName.trim(), method: taskForm.method.trim(),
      rangeLabel: taskForm.rangeLabel.trim(), hours, completed: original?.completed || false, generatedReview: false, userEdited: true };
    if (original && original.rangeLabel !== block.rangeLabel) { block.startRange = ""; block.endRange = ""; }
    const days = plan.days.map((day) => {
      const blocks = (day.blocks || []).filter((task) => task.id !== editor.id);
      if (day.date === taskForm.date) blocks.push(block);
      return { ...day, excluded: day.date === taskForm.date ? false : day.excluded, blocks };
    });
    await saveDays(days, original ? "공부 항목과 날짜를 저장했습니다." : "공부 항목을 추가했습니다.");
  }
  async function toggleTask(task) {
    const days = plan.days.map((day) => ({ ...day, blocks: (day.blocks || []).map((block) => block.id === task.id ? { ...block, completed: !block.completed } : block) }));
    await saveDays(days, "완료 상태를 저장했습니다.");
  }
  async function deleteTask(task) {
    if (!window.confirm("이 공부 항목을 삭제할까요?")) return;
    await saveDays(plan.days.map((day) => ({ ...day, blocks: (day.blocks || []).filter((block) => block.id !== task.id) })), "공부 항목을 삭제했습니다.");
  }
  async function regenerate() {
    if (!window.confirm("완료한 항목은 그대로 두고 미완료 항목의 날짜를 다시 배정할까요?")) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const saved = await api.rebalanceStudyPlan(plan.id, { scheduleOptions, ...studyHours });
      setPlan((previous) => ({ ...previous, ...saved })); setEditor(null);
      setMessage("완료한 항목을 유지하고 남은 계획을 다시 배정했습니다.");
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }

  if (!plan) return <section className="detail-loading">{error ? <p className="error">{error}</p> : <p>공부계획을 불러오는 중입니다...</p>}</section>;
  return <section className="study-detail">
    <div className="page-title detail-heading"><div><p className="eyebrow">{plan.type === "personalExam" ? "개인 시험" : "채용 필기시험"}</p><h1>{plan.examName || "공부계획"}</h1><p>{plan.company || ""} {plan.position || ""} · 시험일 {String(plan.examDate || "").slice(0, 10)}</p></div><Link className="button secondary" to="/study-plans">목록으로</Link></div>
    {error && <p className="error" role="alert">{error}</p>}{message && <p className="success" role="status">{message}</p>}
    <div className="detail-summary"><div className="detail-progress"><span>전체 진행률</span><strong>{progress.percent}%</strong><small>{progress.done} / {progress.total} 완료</small><div className="progress-track"><i style={{ width: progress.percent + "%" }} /></div></div><div className="subject-progress-detail"><span className="summary-label">과목별 진행률</span>{Object.entries(progress.bySubject).map(([subject, value]) => <div key={subject}><span>{subject}</span><b>{value.percent}%</b><div className="progress-track"><i style={{ width: value.percent + "%" }} /></div></div>)}</div></div>
    <details><summary>배정 방식 바꾸기 · 매일 공부 / 복습·오답</summary><div className="form-grid">{[["weekdayHours", "평일 공부시간"], ["weekendHours", "주말 공부시간"]].map(([key, label]) => <label key={key}>{label}<input type="number" min="0" max="24" step="1" disabled={busy} value={studyHours[key]} onChange={(e) => setStudyHours({ ...studyHours, [key]: Number(e.target.value) })} />시간</label>)}</div><StudyScheduleSettings value={scheduleOptions} onChange={setScheduleOptions} disabled={busy} /><p className="muted">완료한 항목과 직접 추가한 미완료 항목을 유지합니다. 미완료 항목을 옮기고 남는 시간에 복습·오답을 배정해요.</p><div className="schedule-settings-actions"><button className="button" type="button" disabled={busy || Boolean(editor)} onClick={regenerate}>설정 적용하고 남은 계획 다시 짜기</button></div></details>
    <div className="detail-toolbar"><div><h2>날짜별 공부계획</h2><p className="muted">항목을 추가하거나 ⋯ → 수정·날짜 이동에서 나에게 맞게 바꿔보세요.</p></div></div>
    <div className="detail-days">{plan.days.map((day) => <article className={"detail-day " + (day.excluded ? "excluded" : "")} key={day.date}>
      <header><strong>{day.date}</strong><span>{day.excluded ? "공부 제외" : (day.blocks || []).length + "개 항목"}</span></header>
      {(day.blocks || []).map((task) => <div className={"detail-task " + (task.completed ? "completed" : "")} key={task.id}>
        <input type="checkbox" aria-label={task.subject + " " + task.method + " 완료"} checked={Boolean(task.completed)} disabled={busy || Boolean(editor)} onChange={() => toggleTask(task)} />
        <span className="task-main"><strong>{task.subject || "기타"}</strong><span>{task.materialName || "자료 미입력"}</span><small>{task.method || "공부"} · {task.rangeLabel || "전체 범위"}</small></span>
        <b>{formatStudyHours(task.hours || 0)}시간</b>
        <div className="task-more-menu"><button className="icon-button task-edit-button" type="button" aria-label="항목 옵션" disabled={busy || Boolean(editor)} onClick={() => setTaskMenuId(taskMenuId === task.id ? "" : task.id)}>⋯</button>{taskMenuId === task.id && <div className="task-more-panel"><button type="button" onClick={() => startEdit(task, day.date)}>수정·날짜 이동</button><button className="danger-text" type="button" onClick={() => deleteTask(task)}>삭제</button></div>}</div>
      </div>)}
      {!(day.blocks || []).length && <p className="muted">{day.excluded ? "공부하지 않는 날짜입니다." : "배정된 공부가 없습니다. 원하는 공부를 추가해보세요."}</p>}
      {editor?.date === day.date ? <StudyTaskForm value={taskForm} onChange={setTaskForm} onSubmit={saveTask} onCancel={() => setEditor(null)} dates={dates} busy={busy} /> : <button className="button secondary schedule-day-actions" type="button" disabled={busy || Boolean(editor)} onClick={() => startAdd(day.date)}>+ 공부 항목 추가</button>}
    </article>)}</div>
  </section>;
}
