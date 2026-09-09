import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { api } from "../services/api.js";
import "../styles/studyDetail.css";
import "../styles/studyDetailActions.css";
import "../styles/studyTaskEdit.css";
import "../styles/studyTaskMenu.css";
import "../styles/studyEmptyDay.css";

function getProgress(plan) {
  const tasks = (plan?.days || []).flatMap((day) => day.blocks || []);
  const bySubject = {};
  tasks.forEach((task) => {
    const subject = task.subject || "기타";
    bySubject[subject] ||= { total: 0, done: 0 };
    bySubject[subject].total += 1;
    if (task.completed) bySubject[subject].done += 1;
  });
  Object.values(bySubject).forEach((value) => { value.percent = value.total ? Math.round(value.done / value.total * 100) : 0; });
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
  const [savingId, setSavingId] = useState("");
  const [editingTaskId, setEditingTaskId] = useState("");
  const [taskForm, setTaskForm] = useState({ subject: "", materialName: "", method: "", rangeLabel: "", hours: 1 });
  const [taskMenuId, setTaskMenuId] = useState("");
  const [addingDate, setAddingDate] = useState("");
  const [newTask, setNewTask] = useState({ subject: "", materialName: "", method: "개념", rangeLabel: "", hours: 1 });

  useEffect(() => {
    const request = applicationMode ? api.getStudyPlan(id) : api.getStudyPlanById(id);
    request.then(setPlan).catch((e) => setError(e.message));
  }, [applicationMode, id]);

  const progress = useMemo(() => getProgress(plan), [plan]);
  async function toggleTask(task) {
    setSavingId(task.id); setError("");
    try {
      try {
        setPlan(await api.updateStudyTask(task.id, { completed: !task.completed }));
      } catch (taskError) {
        const days = plan.days.map((day) => ({ ...day, blocks: (day.blocks || []).map((block) => block.id === task.id ? { ...block, completed: !block.completed } : block) }));
        const saved = applicationMode ? await api.updateStudyPlan(id, { ...plan, days }) : await api.updateStudyPlanById(plan.id, { ...plan, days });
        setPlan(saved);
      }
      setMessage("완료 상태를 저장했습니다.");
    } catch (e) { setError(e.message); } finally { setSavingId(""); }
  }

  function startTaskEdit(task) {
    setEditingTaskId(task.id);
    setTaskForm({ subject: task.subject || "", materialName: task.materialName || "", method: task.method || "", rangeLabel: task.rangeLabel || "", hours: task.hours || 1 });
  }

  async function saveTaskEdit(event, task) {
    event.preventDefault(); setSavingId(task.id); setError("");
    try {
      try {
        setPlan(await api.updateStudyTask(task.id, { ...taskForm, hours: Number(taskForm.hours) || 1 }));
      } catch (taskError) {
        const days = plan.days.map((day) => ({ ...day, blocks: (day.blocks || []).map((block) => block.id === task.id ? { ...block, ...taskForm, hours: Number(taskForm.hours) || 1 } : block) }));
        const saved = applicationMode ? await api.updateStudyPlan(id, { ...plan, days }) : await api.updateStudyPlanById(plan.id, { ...plan, days });
        setPlan(saved);
      }
      setEditingTaskId(""); setMessage("공부 항목을 수정했습니다.");
    } catch (e) { setError(e.message); } finally { setSavingId(""); }
  }

  async function deleteTask(task) {
    if (!window.confirm("이 날짜의 공부 항목을 삭제할까요?")) return;
    setError("");
    try {
      try {
        setPlan(await api.deleteStudyTask(task.id));
      } catch (taskError) {
        const days = plan.days.map((day) => ({ ...day, blocks: (day.blocks || []).filter((block) => block.id !== task.id) }));
        const saved = applicationMode ? await api.updateStudyPlan(id, { ...plan, days }) : await api.updateStudyPlanById(plan.id, { ...plan, days });
        setPlan(saved);
      }
      setTaskMenuId(""); setMessage("공부 항목을 삭제했습니다.");
    } catch (e) { setError(e.message); }
  }

  async function addTask(event, date) {
    event.preventDefault(); setError("");
    if (!newTask.subject.trim()) return setError("과목을 입력해주세요.");
    const block = { id: crypto.randomUUID(), subjectId: "", ...newTask, subject: newTask.subject.trim(), materialName: newTask.materialName.trim(), hours: Number(newTask.hours) || 1, completed: false };
    const days = plan.days.map((day) => day.date === date ? { ...day, blocks: [...(day.blocks || []), block] } : day);
    try {
      const saved = applicationMode ? await api.updateStudyPlan(id, { ...plan, days }) : await api.updateStudyPlanById(plan.id, { ...plan, days });
      setPlan(saved); setAddingDate(""); setNewTask({ subject: "", materialName: "", method: "개념", rangeLabel: "", hours: 1 }); setMessage("공부 항목을 추가했습니다.");
    } catch (e) { setError(e.message); }
  }
  async function regenerate() {
    setError(""); setMessage("");
    try { const saved = await api.rebalanceStudyPlan(plan.id || id); setPlan(saved); setMessage("완료한 계획은 유지하고 남은 계획을 다시 배분했습니다."); } catch (e) { setError(e.message); }
  }

  if (!plan) return <section className="detail-loading">{error ? <p className="error">{error}</p> : <p>공부계획을 불러오는 중입니다...</p>}</section>;
  return <section className="study-detail">
    <div className="page-title detail-heading"><div><p className="eyebrow">{plan.type === "personalExam" ? "개인 시험" : "채용 필기시험"}</p><h1>{plan.examName || "공부계획"}</h1><p>{plan.company || ""}{plan.position ? ` · ${plan.position}` : ""} · 시험일 {String(plan.examDate || "").slice(0, 10)}</p></div><div className="detail-heading-actions"><Link className="button secondary" to="/study-plans">목록으로</Link></div></div>
    {error && <p className="error">{error}</p>}{message && <p className="success">{message}</p>}
    <div className="detail-summary"><div className="detail-progress"><span>전체 진행률</span><strong>{progress.percent}%</strong><small>{progress.done} / {progress.total} 완료</small><div className="progress-track"><i style={{ width: `${progress.percent}%` }} /></div></div><div className="subject-progress-detail"><span className="summary-label">과목별 진행률</span>{Object.entries(progress.bySubject).map(([subject, value]) => <div key={subject}><span>{subject}</span><b>{value.percent}%</b><div className="progress-track"><i style={{ width: `${value.percent}%` }} /></div></div>)}</div></div>
    <div className="detail-toolbar"><div><h2>날짜별 공부계획</h2><p className="muted">완료한 항목은 자동으로 저장되고 진행률에 반영됩니다.</p></div><button className="button secondary" type="button" onClick={regenerate}>남은 계획 다시 짜기</button></div>
    <div className="detail-days">{(plan.days || []).map((day) => <article className={`detail-day ${day.excluded ? "excluded" : ""}`} key={day.date}><header><strong>{day.date}</strong>{day.excluded ? <span>공부 제외</span> : <span>{day.blocks.length}개 항목</span>}</header>{day.excluded ? <p className="muted">공부하지 않는 날짜입니다.</p> : day.blocks.length ? day.blocks.map((task) => editingTaskId === task.id ? <form className="task-edit-form" key={task.id} onSubmit={(event) => saveTaskEdit(event, task)}><input value={taskForm.subject} onChange={(e) => setTaskForm({ ...taskForm, subject: e.target.value })} placeholder="과목" /><input value={taskForm.materialName} onChange={(e) => setTaskForm({ ...taskForm, materialName: e.target.value })} placeholder="자료명" /><input value={taskForm.method} onChange={(e) => setTaskForm({ ...taskForm, method: e.target.value })} placeholder="공부 방식" /><input value={taskForm.rangeLabel} onChange={(e) => setTaskForm({ ...taskForm, rangeLabel: e.target.value })} placeholder="공부 범위" /><input type="number" min="0" value={taskForm.hours} onChange={(e) => setTaskForm({ ...taskForm, hours: e.target.value })} /><button className="button" disabled={savingId === task.id} type="submit">저장</button><button className="button secondary" type="button" onClick={() => setEditingTaskId("")}>취소</button></form> : <div className={`detail-task ${task.completed ? "completed" : ""}`} key={task.id}><input type="checkbox" checked={Boolean(task.completed)} disabled={savingId === task.id} onChange={() => toggleTask(task)} /><span className="task-main"><strong>{task.subject || "기타"}</strong><span>{task.materialName || "자료 미입력"}</span><small>{task.method || "공부"} · {task.rangeLabel || "전체 범위"}</small></span><b>{task.hours || 1}시간</b><div className="task-more-menu"><button className="icon-button task-edit-button" type="button" title="항목 옵션" aria-label="항목 옵션" onClick={() => setTaskMenuId(taskMenuId === task.id ? "" : task.id)}>⋯</button>{taskMenuId === task.id && <div className="task-more-panel"><button type="button" onClick={() => { startTaskEdit(task); setTaskMenuId(""); }}>수정</button><button className="danger-text" type="button" onClick={() => deleteTask(task)}>삭제</button></div>}</div></div>) : <p className="muted">배정된 공부가 없습니다.</p>}</article>)}</div>
  </section>;
}
