import React from "react";

export default function StudyTaskForm({ value, onChange, onSubmit, onCancel, dates, busy, submitLabel = "저장" }) {
  const field = (key) => ({ value: value[key], onChange: (e) => onChange({ ...value, [key]: e.target.value }) });
  return <form className="study-task-form" onSubmit={onSubmit}>
    <label>날짜<select {...field("date")} required>{dates.map((date) => <option key={date} value={date}>{date}</option>)}</select></label>
    <label>과목<input {...field("subject")} required /></label>
    <label>자료명<input {...field("materialName")} /></label>
    <label>공부 방식<input {...field("method")} list="study-methods" required /><datalist id="study-methods">{["개념", "문제풀이", "복습", "오답정리", "기출", "모의고사"].map((method) => <option key={method} value={method} />)}</datalist></label>
    <label>공부 범위<input {...field("rangeLabel")} placeholder="예: 1~10페이지 오답" /></label>
    <label>공부시간 (시간)<input {...field("hours")} type="number" min="0.01" max="24" step="any" required /></label>
    <div className="schedule-checks"><button className="button" type="submit" disabled={busy}>{busy ? "저장 중..." : submitLabel}</button><button className="button secondary" type="button" disabled={busy} onClick={onCancel}>취소</button></div>
  </form>;
}
