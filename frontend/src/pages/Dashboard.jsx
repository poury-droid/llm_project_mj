import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ApplicationCard from "../components/ApplicationCard.jsx";
import DdayBadge from "../components/DdayBadge.jsx";
import { api } from "../services/api.js";
import { formatShortDate } from "../utils/dateUtils.js";

const calendarWeekdays = ["일", "월", "화", "수", "목", "금", "토"];

function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [error, setError] = useState("");

  async function loadDashboard() {
    setError("");
    try {
      setDashboard(await api.getDashboard());
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  async function toggleTask(task, completed) {
    try {
      await api.updateTask(task.id, { completed });
      await loadDashboard();
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleStudyBlock(block) {
    try {
      const plan = await api.getStudyPlan(block.applicationId);
      const nextPlan = {
        ...plan,
        days: plan.days.map((day) => day.date === block.date
          ? { ...day, blocks: day.blocks.map((item) => item.id === block.id ? { ...item, completed: true } : item) }
          : day)
      };
      await api.updateStudyPlan(block.applicationId, nextPlan);
      await loadDashboard();
    } catch (err) {
      setError(err.message);
    }
  }

  const calendarDays = useMemo(() => buildCalendarDays(calendarMonth), [calendarMonth]);
  const eventsByDate = useMemo(() => {
    const map = new Map();
    (dashboard?.calendarEvents || []).forEach((event) => {
      const date = formatShortDate(event.date);
      map.set(date, [...(map.get(date) || []), event]);
    });
    return map;
  }, [dashboard]);

  if (error) return <p className="error">{error}</p>;
  if (!dashboard) return <p>한눈에 보기 화면을 불러오는 중입니다.</p>;

  return (
    <section>
      <div className="page-title">
        <div>
          <h1>한눈에 보기</h1>
          <p>오늘 놓치면 안 되는 일정과 준비사항을 먼저 보여줍니다.</p>
        </div>
        <Link className="button" to="/analyze/pdf">자료 분석하기</Link>
      </div>

      <div className="summary-grid">
        <div className="metric"><span>진행 중 지원</span><strong>{dashboard.activeCount}</strong></div>
        <div className="metric"><span>이번 주 마감</span><strong>{dashboard.weekDeadlines.length}</strong></div>
        <div className="metric"><span>오늘 할 일</span><strong>{dashboard.todayTasks.length}</strong></div>
        <div className="metric"><span>3일 이내</span><strong>{dashboard.threeDayTasks.length}</strong></div>
      </div>

      <div className="two-column dashboard-top-grid">
        <section className="panel calendar-panel">
          <div className="section-header compact">
            <div><h2>전형 일정</h2><p className="muted">지원 마감과 시험·면접 일정을 한눈에 확인하세요.</p></div>
            <div className="calendar-nav">
              <button className="icon-button" aria-label="이전 달" onClick={() => shiftMonth(setCalendarMonth, -1)}>‹</button>
              <strong>{calendarMonth.getFullYear()}년 {calendarMonth.getMonth() + 1}월</strong>
              <button className="icon-button" aria-label="다음 달" onClick={() => shiftMonth(setCalendarMonth, 1)}>›</button>
            </div>
          </div>
          <div className="calendar-grid calendar-weekdays">{calendarWeekdays.map((day) => <strong key={day}>{day}</strong>)}</div>
          <div className="calendar-grid">
            {calendarDays.map((day) => (
              <div className={`calendar-day ${day.inMonth ? "" : "outside"}`} key={day.key}>
                <span className="calendar-date">{day.date.getDate()}</span>
                {(eventsByDate.get(day.key) || []).map((event) => <Link className={`calendar-event ${event.type === "필기시험" ? "written" : event.type === "면접" ? "interview" : "deadline"}`} to={`/applications/${event.applicationId}`} key={`${event.applicationId}-${event.type}`} title={`${event.company} · ${event.type}`}><b>{event.type}</b><span>{event.company}</span></Link>)}
              </div>
            ))}
          </div>
          <div className="calendar-legend"><span><i className="legend-dot deadline" />마감</span><span><i className="legend-dot written" />필기</span><span><i className="legend-dot interview" />면접</span></div>
        </section>
        <section className="panel">
          <div className="section-header compact"><div><h2>필기시험 공부 체크리스트</h2><p className="muted">공부계획의 다음 항목부터 진행해보세요.</p></div><Link className="button secondary" to="/applications">공부계획 보기</Link></div>
          <StudyChecklist items={dashboard.studyChecklist || []} onToggle={toggleStudyBlock} />
        </section>
      </div>

      {dashboard.nearestEvent && (
        <div className="panel highlight">
          <h2>가장 가까운 시험 또는 면접</h2>
          <p>{dashboard.nearestEvent.company} · {dashboard.nearestEvent.type} <DdayBadge date={dashboard.nearestEvent.date} /></p>
        </div>
      )}

      <div className="two-column">
        <div className="panel">
          <h2>오늘 해야 할 일</h2>
          <SimpleTaskList tasks={dashboard.todayTasks} onToggle={toggleTask} />
        </div>
        <div className="panel">
          <h2>미완료 긴급 항목</h2>
          <SimpleTaskList tasks={dashboard.urgentTasks} onToggle={toggleTask} />
        </div>
      </div>

      <h2>지원 공고별 현재 전형 단계</h2>
      <div className="card-grid">
        {dashboard.stages.map((item) => (
          <ApplicationCard key={item.id} application={{ ...item, position: "", title: "", deadline: item.writtenTestDate || item.interviewDate }} />
        ))}
      </div>
    </section>
  );
}

function SimpleTaskList({ tasks, onToggle }) {
  if (!tasks.length) return <p className="empty">표시할 항목이 없습니다.</p>;

  return (
    <ul className="clean-list task-summary-list">
      {tasks.map((task) => (
        <li key={task.id}>
          <label className="task-summary-item">
            <input
              type="checkbox"
              checked={task.completed}
              onChange={(event) => onToggle(task, event.target.checked)}
            />
            <span>
              {task.company && <strong>{task.company} · </strong>}
              {task.title}
            </span>
          </label>
          <DdayBadge date={task.dueDate} />
        </li>
      ))}
    </ul>
  );
}

function buildCalendarDays(month) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = new Date(month.getFullYear(), month.getMonth(), 1 - first.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return { date, key: formatLocalDate(date), inMonth: date.getMonth() === month.getMonth() };
  });
}

function formatLocalDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function shiftMonth(setMonth, amount) {
  setMonth((month) => new Date(month.getFullYear(), month.getMonth() + amount, 1));
}

function StudyChecklist({ items, onToggle }) {
  if (!items.length) return <p className="empty">남은 공부 항목이 없습니다. 잘하고 있어요.</p>;
  return (
    <ul className="clean-list study-checklist">
      {items.map((item) => (
        <li key={item.id}>
          <label className="task-summary-item">
            <input type="checkbox" onChange={() => onToggle(item)} />
            <span><strong>{item.company}</strong><small>{item.subject} · {item.focus}</small></span>
          </label>
          <time>{formatShortDate(item.date)}</time>
        </li>
      ))}
    </ul>
  );
}

export default Dashboard;
