import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { api } from "../services/api.js";

const weekDays = [
  { value: 1, label: "월" },
  { value: 2, label: "화" },
  { value: 3, label: "수" },
  { value: 4, label: "목" },
  { value: 5, label: "금" },
  { value: 6, label: "토" },
  { value: 0, label: "일" }
];

const studyMethods = ["개념 학습", "문제풀이", "기출문제", "오답정리", "모의고사", "암기", "복습"];
const materialTypes = ["기본서", "개념서", "문제집", "기출문제집", "모의고사", "오답노트", "인터넷 강의", "PDF 자료", "기타"];

function createId() {
  return globalThis.crypto?.randomUUID?.() || `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeMaterial(material) {
  return {
    ...material,
    id: material?.id || createId(),
    name: material?.name || ""
  };
}

function normalizeSubject(subject) {
  const value = typeof subject === "string" ? { name: subject } : (subject || {});
  return {
    ...value,
    id: value.id || createId(),
    name: value.name || "",
    importance: Number(value.importance) || 3,
    methods: Array.isArray(value.methods) ? value.methods : [],
    materials: Array.isArray(value.materials) ? value.materials.map(normalizeMaterial) : []
  };
}

function normalizePlan(plan) {
  if (!plan) return plan;
  return {
    ...plan,
    subjects: Array.isArray(plan.subjects) ? plan.subjects.map(normalizeSubject) : [],
    days: Array.isArray(plan.days)
      ? plan.days.map((day) => ({ ...day, blocks: Array.isArray(day.blocks) ? day.blocks : [] }))
      : []
  };
}

function emptySubject(name = "") {
  return {
    id: createId(),
    name,
    importance: 3,
    methods: ["개념 학습", "문제풀이", "복습"],
    materials: []
  };
}

function emptyMaterial() {
  return {
    id: createId(),
    name: "",
    type: "기본서",
    unit: "페이지",
    totalAmount: "",
    currentAmount: "",
    targetDate: ""
  };
}

function StudyPlanPage() {
  const { id } = useParams();
  const location = useLocation();
  const isApplicationPlan = location.pathname.startsWith("/applications/");
  const [application, setApplication] = useState(null);
  const [plan, setPlan] = useState(null);
  const [form, setForm] = useState({
    type: isApplicationPlan ? "application" : "personalExam",
    examName: "",
    examDate: "",
    target: "",
    currentLevel: "",
    weekdayHours: 2,
    weekendHours: 4,
    availableDays: [1, 2, 3, 4, 5, 6],
    excludedDates: [],
    excludeDate: "",
    phaseMode: "auto",
    manualPhases: [],
    subjects: [emptySubject("NCS"), emptySubject("경제학")]
  });
  const [newSubject, setNewSubject] = useState("");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, [id]);

  async function load() {
    setError("");
    try {
      if (isApplicationPlan) {
        const app = await api.getApplication(id);
        const saved = normalizePlan(app.studyPlan);
        const subjects = saved?.subjects?.length
          ? saved.subjects
          : (app.subjects?.length ? app.subjects.map((name) => emptySubject(name)) : [emptySubject("NCS")]);
        setApplication(app);
        setPlan(saved);
        setForm((prev) => ({
          ...prev,
          type: "application",
          examName: saved?.examName || `${app.company} 필기시험`,
          examDate: saved?.examDate || app.writtenTestDate?.slice(0, 10) || "",
          target: saved?.target || "",
          currentLevel: saved?.currentLevel || "",
          weekdayHours: saved?.weekdayHours || prev.weekdayHours,
          weekendHours: saved?.weekendHours || prev.weekendHours,
          availableDays: saved?.availableDays || prev.availableDays,
          excludedDates: saved?.excludedDates || [],
          phaseMode: saved?.phaseMode || "auto",
          manualPhases: saved?.manualPhases || [],
          subjects
        }));
      } else if (id) {
        const saved = normalizePlan(await api.getStudyPlanById(id));
        setApplication(null);
        setPlan(saved);
        setForm((prev) => ({
          ...prev,
          type: "personalExam",
          examName: saved.examName || "",
          examDate: saved.examDate || "",
          target: saved.target || "",
          currentLevel: saved.currentLevel || "",
          weekdayHours: saved.weekdayHours || prev.weekdayHours,
          weekendHours: saved.weekendHours || prev.weekendHours,
          availableDays: saved.availableDays || prev.availableDays,
          excludedDates: saved.excludedDates || [],
          phaseMode: saved.phaseMode || "auto",
          manualPhases: saved.manualPhases || [],
          subjects: saved.subjects?.length ? saved.subjects : prev.subjects
        }));
      }
    } catch (err) {
      setError(err.message);
    }
  }

  const progress = useMemo(() => calculateProgress(plan), [plan]);

  async function createPlan(event) {
    event.preventDefault();
    setFeedback("");
    setError("");
    try {
      const payload = {
        ...form,
        subjects: form.subjects.filter((subject) => subject.name.trim())
      };
      const saved = isApplicationPlan ? await api.createStudyPlan(id, payload) : await api.createPersonalStudyPlan(payload);
      setPlan(saved);
      setFeedback("공부계획을 생성했습니다.");
    } catch (err) {
      setError(err.message);
    }
  }

  async function savePlan(nextPlan, message = "공부계획을 저장했습니다.") {
    const saved = isApplicationPlan
      ? await api.updateStudyPlan(id, nextPlan)
      : await api.updateStudyPlanById(nextPlan.id, nextPlan);
    setPlan(saved);
    setFeedback(message);
  }

  function patchSubject(subjectId, updates) {
    setForm((prev) => ({
      ...prev,
      subjects: prev.subjects.map((subject) => subject.id === subjectId ? { ...subject, ...updates } : subject)
    }));
  }

  function patchMaterial(subjectId, materialId, updates) {
    setForm((prev) => ({
      ...prev,
      subjects: prev.subjects.map((subject) => subject.id === subjectId
        ? { ...subject, materials: subject.materials.map((material) => material.id === materialId ? { ...material, ...updates } : material) }
        : subject)
    }));
  }

  function toggleSubjectMethod(subject, method) {
    const methods = subject.methods.includes(method)
      ? subject.methods.filter((item) => item !== method)
      : [...subject.methods, method];
    patchSubject(subject.id, { methods });
  }

  function addSubject() {
    if (!newSubject.trim()) return;
    setForm((prev) => ({ ...prev, subjects: [...prev.subjects, emptySubject(newSubject.trim())] }));
    setNewSubject("");
  }

  function addExcludedDate() {
    if (!form.excludeDate || form.excludedDates.includes(form.excludeDate)) return;
    setForm((prev) => ({ ...prev, excludedDates: [...prev.excludedDates, prev.excludeDate], excludeDate: "" }));
  }

  async function toggleBlock(dayDate, blockId) {
    const nextPlan = {
      ...plan,
      days: plan.days.map((day) => day.date === dayDate
        ? { ...day, blocks: day.blocks.map((block) => block.id === blockId ? { ...block, completed: !block.completed } : block) }
        : day)
    };
    await savePlan(nextPlan, "완료 상태를 저장했습니다.");
  }

  async function patchBlock(dayDate, blockId, updates) {
    const nextPlan = {
      ...plan,
      days: plan.days.map((day) => day.date === dayDate
        ? { ...day, blocks: day.blocks.map((block) => block.id === blockId ? { ...block, ...updates } : block) }
        : day)
    };
    await savePlan(nextPlan);
  }

  async function removeBlock(dayDate, blockId) {
    const nextPlan = {
      ...plan,
      days: plan.days.map((day) => day.date === dayDate
        ? { ...day, blocks: day.blocks.filter((block) => block.id !== blockId) }
        : day)
    };
    await savePlan(nextPlan, "공부 항목을 삭제했습니다.");
  }

  async function addBlock(dayDate) {
    const subject = plan.subjects?.[0];
    const block = {
      id: createId(),
      subjectId: subject?.id || "",
      subject: subject?.name || "",
      materialName: subject?.materials?.[0]?.name || "",
      method: subject?.methods?.[0] || "복습",
      rangeLabel: "",
      hours: 1,
      completed: false
    };
    const nextPlan = {
      ...plan,
      days: plan.days.map((day) => day.date === dayDate ? { ...day, blocks: [...day.blocks, block] } : day)
    };
    await savePlan(nextPlan, "공부 항목을 추가했습니다.");
  }

  async function rebalance() {
    if (!plan) return;
    const saved = await api.rebalanceStudyPlan(plan.id || id);
    setPlan(saved);
    setFeedback("미완료 공부를 완료된 항목 이후 일정에 다시 배분했습니다.");
  }

  return (
    <section>
      <div className="page-title">
        <div>
          <h1>{isApplicationPlan ? "필기시험 공부계획" : "개인 시험 공부계획"}</h1>
          <p>{application ? `${application.company} · ${application.position}` : "지원 공고와 관계없는 시험도 관리할 수 있습니다."}</p>
        </div>
        <Link className="button secondary" to="/study-plans">플래너 목록</Link>
      </div>
      {error && <p className="error">{error}</p>}
      {feedback && <p className="success">{feedback}</p>}

      <form className="panel" onSubmit={createPlan}>
        <div className="form-grid">
          <label>시험명<input value={form.examName} onChange={(event) => setForm({ ...form, examName: event.target.value })} required /></label>
          <label>시험일<input type="date" value={form.examDate} onChange={(event) => setForm({ ...form, examDate: event.target.value })} required /></label>
          <label>목표점수 또는 합격기준<input value={form.target} onChange={(event) => setForm({ ...form, target: event.target.value })} /></label>
          <label>현재 수준<input value={form.currentLevel} onChange={(event) => setForm({ ...form, currentLevel: event.target.value })} /></label>
          <label>평일 공부 가능시간<input type="number" min="0" value={form.weekdayHours} onChange={(event) => setForm({ ...form, weekdayHours: event.target.value })} /></label>
          <label>주말 공부 가능시간<input type="number" min="0" value={form.weekendHours} onChange={(event) => setForm({ ...form, weekendHours: event.target.value })} /></label>
        </div>

        <h3>공부 가능한 요일</h3>
        <div className="weekday-selector">
          {weekDays.map((day) => (
            <label className="check-label" key={day.value}>
              <input
                type="checkbox"
                checked={form.availableDays.includes(day.value)}
                onChange={() => setForm((prev) => ({
                  ...prev,
                  availableDays: prev.availableDays.includes(day.value)
                    ? prev.availableDays.filter((value) => value !== day.value)
                    : [...prev.availableDays, day.value]
                }))}
              />
              {day.label}
            </label>
          ))}
        </div>

        <h3>공부 불가능 날짜</h3>
        <div className="inline-form compact-form">
          <input type="date" value={form.excludeDate} onChange={(event) => setForm({ ...form, excludeDate: event.target.value })} />
          <button className="button secondary" type="button" onClick={addExcludedDate}>추가</button>
        </div>
        <div className="tags">
          {form.excludedDates.map((date) => (
            <span key={date}>{date}<button type="button" onClick={() => setForm({ ...form, excludedDates: form.excludedDates.filter((item) => item !== date) })}>x</button></span>
          ))}
        </div>

        <div className="section-header compact">
          <h3>과목, 방식, 교재</h3>
          <div className="inline-actions">
            <input value={newSubject} onChange={(event) => setNewSubject(event.target.value)} placeholder="과목명" />
            <button className="button secondary" type="button" onClick={addSubject}>과목 추가</button>
          </div>
        </div>

        <div className="planner-subjects">
          {form.subjects.map((subject) => (
            <div className="planner-subject" key={subject.id}>
              <div className="form-grid">
                <label>과목명<input value={subject.name} onChange={(event) => patchSubject(subject.id, { name: event.target.value })} /></label>
                <label>중요도<select value={subject.importance} onChange={(event) => patchSubject(subject.id, { importance: Number(event.target.value) })}>
                  <option value={5}>높음</option>
                  <option value={3}>보통</option>
                  <option value={1}>낮음</option>
                </select></label>
              </div>
              <div className="method-grid">
                {studyMethods.map((method) => (
                  <label className="check-label" key={method}>
                    <input type="checkbox" checked={subject.methods.includes(method)} onChange={() => toggleSubjectMethod(subject, method)} />
                    {method}
                  </label>
                ))}
              </div>
              <div className="section-header compact">
                <strong>교재 및 공부자료</strong>
                <button className="button secondary" type="button" onClick={() => patchSubject(subject.id, { materials: [...subject.materials, emptyMaterial()] })}>자료 추가</button>
              </div>
              {subject.materials.map((material) => (
                <div className="material-row" key={material.id}>
                  <input value={material.name} onChange={(event) => patchMaterial(subject.id, material.id, { name: event.target.value })} placeholder="자료명" />
                  <select value={material.type} onChange={(event) => patchMaterial(subject.id, material.id, { type: event.target.value })}>
                    {materialTypes.map((type) => <option key={type}>{type}</option>)}
                  </select>
                  <input value={material.totalAmount} onChange={(event) => patchMaterial(subject.id, material.id, { totalAmount: event.target.value })} placeholder="전체 분량" />
                  <input value={material.currentAmount} onChange={(event) => patchMaterial(subject.id, material.id, { currentAmount: event.target.value })} placeholder="현재 진행" />
                  <input type="date" value={material.targetDate} onChange={(event) => patchMaterial(subject.id, material.id, { targetDate: event.target.value })} />
                  <button className="button secondary" type="button" onClick={() => patchSubject(subject.id, { materials: subject.materials.filter((item) => item.id !== material.id) })}>삭제</button>
                </div>
              ))}
            </div>
          ))}
        </div>

        <h3>공부 단계</h3>
        <div className="weekday-selector">
          <label className="check-label"><input type="radio" checked={form.phaseMode === "auto"} onChange={() => setForm({ ...form, phaseMode: "auto" })} />자동 배분</label>
          <label className="check-label"><input type="radio" checked={form.phaseMode === "manual"} onChange={() => setForm({ ...form, phaseMode: "manual" })} />직접 설정</label>
        </div>
        {form.phaseMode === "manual" && <ManualPhases form={form} setForm={setForm} />}

        <button className="button" type="submit">공부계획 만들기 / 다시 생성</button>
      </form>

      {plan && (
        <div className="panel">
          <div className="section-header">
            <div>
              <h2>{plan.examName || "전체 공부계획"}</h2>
              <p className="muted">완료 {progress.done} / {progress.total} · 진행률 {progress.percent}%</p>
            </div>
            <button className="button secondary" type="button" onClick={rebalance}>남은 계획 다시 짜기</button>
          </div>
          <div className="progress-track"><span style={{ width: `${progress.percent}%` }} /></div>
          <div className="subject-progress">
            {Object.entries(progress.bySubject).map(([subject, item]) => <span key={subject}>{subject} {item.percent}%</span>)}
          </div>
          <div className="plan-list">
            {plan.days?.map((day) => (
              <div className={`plan-day ${day.excluded ? "excluded" : ""}`} key={day.date}>
                <div className="section-header compact">
                  <strong>{day.date}</strong>
                  {!day.excluded && <button className="button secondary" type="button" onClick={() => addBlock(day.date)}>항목 추가</button>}
                </div>
                {day.excluded && <span>공부 제외일입니다.</span>}
                {!day.excluded && day.blocks.length === 0 && <span>배정된 공부가 없습니다.</span>}
                {day.blocks.map((block) => (
                  <div className="study-block editable" key={block.id}>
                    <input type="checkbox" checked={block.completed} onChange={() => toggleBlock(day.date, block.id)} />
                    <input value={block.subject || ""} onChange={(event) => patchBlock(day.date, block.id, { subject: event.target.value })} />
                    <input value={block.materialName || ""} onChange={(event) => patchBlock(day.date, block.id, { materialName: event.target.value })} placeholder="자료" />
                    <select value={block.method || "복습"} onChange={(event) => patchBlock(day.date, block.id, { method: event.target.value })}>
                      {studyMethods.map((method) => <option key={method}>{method}</option>)}
                    </select>
                    <input value={block.rangeLabel || ""} onChange={(event) => patchBlock(day.date, block.id, { rangeLabel: event.target.value })} placeholder="범위" />
                    <input type="number" min="0" value={block.hours || 1} onChange={(event) => patchBlock(day.date, block.id, { hours: Number(event.target.value) })} />
                    <button className="button danger-button" type="button" onClick={() => removeBlock(day.date, block.id)}>삭제</button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function ManualPhases({ form, setForm }) {
  function addPhase() {
    setForm((prev) => ({ ...prev, manualPhases: [...prev.manualPhases, { id: createId(), startDate: "", endDate: "", name: "concept" }] }));
  }

  function patchPhase(id, updates) {
    setForm((prev) => ({ ...prev, manualPhases: prev.manualPhases.map((phase) => phase.id === id ? { ...phase, ...updates } : phase) }));
  }

  return (
    <div className="phase-list">
      <button className="button secondary" type="button" onClick={addPhase}>기간 추가</button>
      {form.manualPhases.map((phase) => (
        <div className="material-row" key={phase.id}>
          <input type="date" value={phase.startDate} onChange={(event) => patchPhase(phase.id, { startDate: event.target.value })} />
          <input type="date" value={phase.endDate} onChange={(event) => patchPhase(phase.id, { endDate: event.target.value })} />
          <select value={phase.name} onChange={(event) => patchPhase(phase.id, { name: event.target.value })}>
            <option value="concept">개념 학습</option>
            <option value="practice">문제풀이 + 기출</option>
            <option value="final">모의고사 + 오답정리</option>
          </select>
          <button className="button secondary" type="button" onClick={() => setForm((prev) => ({ ...prev, manualPhases: prev.manualPhases.filter((item) => item.id !== phase.id) }))}>삭제</button>
        </div>
      ))}
    </div>
  );
}

function calculateProgress(plan) {
  const tasks = (plan?.days || []).flatMap((day) => day.blocks || []);
  const total = tasks.length;
  const done = tasks.filter((task) => task.completed).length;
  const bySubject = {};
  for (const task of tasks) {
    const key = task.subject || "기타";
    bySubject[key] ||= { total: 0, done: 0, percent: 0 };
    bySubject[key].total += 1;
    if (task.completed) bySubject[key].done += 1;
    bySubject[key].percent = Math.round((bySubject[key].done / bySubject[key].total) * 100);
  }
  return { total, done, percent: total ? Math.round((done / total) * 100) : 0, bySubject };
}

export default StudyPlanPage;
