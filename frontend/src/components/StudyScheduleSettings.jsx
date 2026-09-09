import React from "react";
import "../styles/studySchedule.css";

export const defaultScheduleOptions = { dailyStudy: true, reviewMode: "daily", reviewPercent: 30, reviewDays: [2, 4], reviewMethods: ["복습", "오답정리"] };

export default function StudyScheduleSettings({ value, onChange, disabled = false }) {
  const options = { ...defaultScheduleOptions, ...value };
  const change = (key, next) => onChange({ ...options, [key]: next });
  const toggle = (key, item) => change(key, options[key].includes(item) ? options[key].filter((entry) => entry !== item) : [...options[key], item]);
  return <fieldset className="study-schedule-settings" disabled={disabled}>
    <legend>공부 배정 방식</legend>
    <label className="schedule-check"><input type="checkbox" checked={options.dailyStudy} onChange={(e) => change("dailyStudy", e.target.checked)} />매일 공부</label>
    <p className="muted">새 진도를 매일 나누고, 진도가 끝난 날은 복습·오답으로 채워요. 직접 제외한 날짜와 공부시간이 0인 날은 비워둡니다.</p>
    <div className="form-grid">
      <label>복습·오답 배정<select value={options.reviewMode} onChange={(e) => change("reviewMode", e.target.value)}><option value="daily">매일 진도와 섞기</option><option value="weekdays">선택한 요일에 섞기</option></select></label>
      <label>복습·오답 시간 비율 ({options.reviewPercent}%)<input type="range" min="0" max="80" step="10" value={options.reviewPercent} onChange={(e) => change("reviewPercent", Number(e.target.value))} /><small>새 진도 {100 - options.reviewPercent}% · 복습·오답 {options.reviewPercent}%</small></label>
    </div>
    {options.reviewMode === "weekdays" && <div className="schedule-checks">{["일", "월", "화", "수", "목", "금", "토"].map((day, index) => <label className="schedule-check" key={day}><input type="checkbox" checked={options.reviewDays.includes(index)} onChange={() => toggle("reviewDays", index)} />{day}</label>)}</div>}
    <div className="schedule-checks">{["복습", "오답정리"].map((method) => <label className="schedule-check" key={method}><input type="checkbox" checked={options.reviewMethods.includes(method)} onChange={() => toggle("reviewMethods", method)} />{method}</label>)}</div>
    <p className="muted">두 방식을 선택하면 번갈아 배정해요. 실제 공부에 걸리는 시간과 범위는 생성 후 수정할 수 있어요.</p>
  </fieldset>;
}
