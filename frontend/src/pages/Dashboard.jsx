import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ApplicationCard from "../components/ApplicationCard.jsx";
import DdayBadge from "../components/DdayBadge.jsx";
import { api } from "../services/api.js";

function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getDashboard().then(setDashboard).catch((err) => setError(err.message));
  }, []);

  if (error) return <p className="error">{error}</p>;
  if (!dashboard) return <p>대시보드를 불러오는 중입니다.</p>;

  return (
    <section>
      <div className="page-title">
        <div>
          <h1>대시보드</h1>
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

      {dashboard.nearestEvent && (
        <div className="panel highlight">
          <h2>가장 가까운 시험 또는 면접</h2>
          <p>{dashboard.nearestEvent.company} · {dashboard.nearestEvent.type} <DdayBadge date={dashboard.nearestEvent.date} /></p>
        </div>
      )}

      <div className="two-column">
        <div className="panel">
          <h2>오늘 해야 할 일</h2>
          <SimpleTaskList tasks={dashboard.todayTasks} />
        </div>
        <div className="panel">
          <h2>미완료 긴급 항목</h2>
          <SimpleTaskList tasks={dashboard.urgentTasks} />
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

function SimpleTaskList({ tasks }) {
  if (!tasks.length) return <p className="empty">표시할 항목이 없습니다.</p>;
  return <ul className="clean-list">{tasks.map((task) => <li key={task.id}>{task.title} <DdayBadge date={task.dueDate} /></li>)}</ul>;
}

export default Dashboard;
