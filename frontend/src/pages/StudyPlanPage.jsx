import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
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

function StudyPlanPage() {
  const { id } = useParams();
  const [application, setApplication] = useState(null);
  const [plan, setPlan] = useState(null);
  const [form, setForm] = useState({
    examDate: "",
    weekdayHours: 2,
    weekendHours: 4,
    availableDays: [1, 2, 3, 4, 5, 6, 0],
    excludedDates: [],
    excludeDate: "",
    subjectsText: "NCS 수리:5\nNCS 의사소통:3\n경제학:5"
  });
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const app = await api.getApplication(id);
    setApplication(app);
    setPlan(app.studyPlan);
    setForm((prev) => ({
      ...prev,
      examDate: app.stage === "필기전형" && app.writtenTestDate
        ? app.writtenTestDate.slice(0, 10)
        : app.studyPlan?.examDate || prev.examDate,
      weekdayHours: app.studyPlan?.weekdayHours || prev.weekdayHours,
      weekendHours: app.studyPlan?.weekendHours || prev.weekendHours,
      availableDays: app.studyPlan?.availableDays || prev.availableDays,
      excludedDates: app.studyPlan?.excludedDates || prev.excludedDates
    }));
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, [id]);

  const progress = useMemo(() => {
    const blocks = plan?.days?.flatMap((day) => day.blocks) || [];
    const done = blocks.filter((block) => block.completed).length;
    return { done, total: blocks.length, percent: blocks.length ? Math.round((done / blocks.length) * 100) : 0 };
  }, [plan]);

  function parseSubjects() {
    return form.subjectsText.split("\n").map((line) => {
      const [name, importance = "3"] = line.split(":");
      return { name: name.trim(), importance: Number(importance) };
    }).filter((item) => item.name);
  }

  async function createPlan(event) {
    event.preventDefault();
    try {
      const saved = await api.createStudyPlan(id, {
        examDate: application.stage === "필기전형" && application.writtenTestDate
          ? application.writtenTestDate.slice(0, 10)
          : form.examDate,
        weekdayHours: Number(form.weekdayHours),
        weekendHours: Number(form.weekendHours),
        availableDays: form.availableDays,
        excludedDates: form.excludedDates,
        subjects: parseSubjects()
      });
      setPlan(saved);
      setForm((prev) => ({ ...prev, examDate: saved.examDate }));
      setFeedback("현재 조건으로 공부계획을 다시 계산했습니다.");
    } catch (err) {
      setError(err.message);
    }
  }

  function toggleAvailableDay(value) {
    setForm((prev) => ({
      ...prev,
      availableDays: prev.availableDays.includes(value)
        ? prev.availableDays.filter((day) => day !== value)
        : [...prev.availableDays, value]
    }));
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
    setPlan(nextPlan);
    await api.updateStudyPlan(id, nextPlan);
    setFeedback("공부 일정 완료 상태가 저장되었습니다.");
  }

  if (!application) return <p>공부계획 화면을 불러오는 중입니다.</p>;

  return (
    <section>
      <div className="page-title">
        <div>
          <h1>공부계획</h1>
          <p>{application.company} · {application.position}</p>
        </div>
        <Link className="button secondary" to={`/applications/${id}`}>상세로 돌아가기</Link>
      </div>
      {error && <p className="error">{error}</p>}
      {feedback && <p className="success">{feedback}</p>}

      <form className="panel" onSubmit={createPlan}>
        <div className="form-grid">
          <label>필기시험일<input type="date" value={form.examDate} onChange={(event) => setForm({ ...form, examDate: event.target.value })} disabled={application.stage === "필기전형" && Boolean(application.writtenTestDate)} required /></label>
          <label>평일 하루 공부 가능 시간<input type="number" min="0" value={form.weekdayHours} onChange={(event) => setForm({ ...form, weekdayHours: event.target.value })} /></label>
          <label>주말 하루 공부 가능 시간<input type="number" min="0" value={form.weekendHours} onChange={(event) => setForm({ ...form, weekendHours: event.target.value })} /></label>
          <label className="wide">과목별 중요도<textarea value={form.subjectsText} onChange={(event) => setForm({ ...form, subjectsText: event.target.value })} /></label>
        </div>

        <h3>공부 가능한 요일</h3>
        <div className="weekday-selector">
          {weekDays.map((day) => (
            <label className="check-label" key={day.value}>
              <input type="checkbox" checked={form.availableDays.includes(day.value)} onChange={() => toggleAvailableDay(day.value)} />
              {day.label}
            </label>
          ))}
        </div>

        <h3>특정 날짜 공부 제외</h3>
        <div className="inline-form compact-form">
          <input type="date" value={form.excludeDate} onChange={(event) => setForm({ ...form, excludeDate: event.target.value })} />
          <button className="button secondary" type="button" onClick={addExcludedDate}>제외일 추가</button>
        </div>
        <div className="tags">
          {form.excludedDates.map((date) => (
            <span key={date}>{date}<button type="button" onClick={() => setForm({ ...form, excludedDates: form.excludedDates.filter((item) => item !== date) })}>×</button></span>
          ))}
        </div>

        <button className="button" type="submit">공부계획 만들기 / 다시 짜기</button>
      </form>

      {plan && (
        <div className="panel">
          <div className="section-header">
            <div>
              <h2>전체 공부계획</h2>
              <p className="muted">필기시험일까지 · 완료율 {progress.done} / {progress.total} · {progress.percent}%</p>
            </div>
          </div>
          <div className="progress-track"><span style={{ width: `${progress.percent}%` }} /></div>
          <div className="plan-list">
            {plan.days?.length ? plan.days.map((day) => (
              <div className={`plan-day ${day.excluded ? "excluded" : ""}`} key={day.date}>
                <strong>{day.date}</strong>
                <div>
                  {day.excluded && <span>이 날은 공부 제외일입니다.</span>}
                  {!day.excluded && day.blocks.length === 0 && <span>이 날은 휴식 또는 복습일입니다.</span>}
                  {day.blocks.map((block) => (
                    <label className="study-block" key={block.id}>
                      <input type="checkbox" checked={block.completed} onChange={() => toggleBlock(day.date, block.id)} />
                      {block.subject} {block.hours}시간 · {block.focus}
                    </label>
                  ))}
                </div>
              </div>
            )) : (
              <p className="empty">오늘 등록된 공부계획이 없습니다.</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default StudyPlanPage;
