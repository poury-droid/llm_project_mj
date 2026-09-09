import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";
import { getDdayLabel } from "../utils/dateUtils.js";
import "../styles/plannerCardMenu.css";

function StudyPlannerHome() {
  const [plans, setPlans] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setPlans(await api.getStudyPlans());
    } catch (err) {
      setError(err.message);
    }
  }

  async function deletePlan(plan) {
    if (!window.confirm(`'${plan.examName || plan.company || "공부계획"}' 계획을 삭제할까요?`)) return;
    try {
      if (plan.applicationId) await api.deleteStudyPlan(plan.applicationId);
      else await api.deleteStudyPlanById(plan.id);
      setPlans((current) => current.filter((item) => item.id !== plan.id));
    } catch (err) {
      setError(err.message);
    }
  }


  const applicationPlans = useMemo(() => plans.filter((plan) => plan.type !== "personalExam"), [plans]);
  const personalPlans = useMemo(() => plans.filter((plan) => plan.type === "personalExam"), [plans]);

  return (
    <section>
      <div className="page-title">
        <div>
          <h1>공부 플래너</h1>
          <p>기업별 필기시험과 개인 시험을 한 화면에서 구분해 관리합니다.</p>
        </div>
      </div>
      {error && <p className="error">{error}</p>}

      <PlannerSection title="채용 필기시험" plans={applicationPlans} empty="공부계획이 있는 채용 필기시험이 없습니다." onDelete={deletePlan} />
      <PlannerSection title="개인 시험" plans={personalPlans} empty="등록된 개인 시험 공부계획이 없습니다." onDelete={deletePlan} />
      <div className="panel planner-create-panel">
        <h2>새 공부계획</h2>
        <p className="muted">시험 선택부터 공부할 것 등록까지 네 단계로 진행합니다.</p>
        <Link className="button" to="/study-plans/new">+ 공부계획 만들기</Link>
      </div>
    </section>
  );
}

function PlannerSection({ title, plans, empty, onDelete }) {
  return (
    <div className="panel">
      <div className="section-header">
        <h2>{title}</h2>
      </div>
      {!plans.length && <p className="empty">{empty}</p>}
      <div className="planner-card-grid">
        {plans.map((plan) => <PlannerCard key={plan.id} plan={plan} onDelete={onDelete} />)}
      </div>
    </div>
  );
}

function PlannerCard({ plan, onDelete }) {
  const progress = plan.progress || { percent: 0 };
  const detailUrl = plan.applicationId ? `/applications/${plan.applicationId}/study-plan` : `/study-plans/${plan.id}`;
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <article className="planner-card">
      <div>
        <h3>{plan.type === "personalExam" ? plan.examName : plan.company || plan.examName}</h3>
        {plan.type !== "personalExam" && <p>직무: {plan.position || "미입력"}</p>}
        {plan.type === "personalExam" && <p>목표: {plan.target || "미입력"}</p>}
      </div>
      <dl className="compact-info">
        <div><dt>시험</dt><dd>{plan.examDate || "-"} · {getDdayLabel(plan.examDate)}</dd></div>
        <div><dt>과목</dt><dd>{plan.subjectsText || (plan.subjects || []).map((subject) => subject.name).join(" / ") || "-"}</dd></div>
        <div><dt>진행률</dt><dd>{progress.percent || 0}%</dd></div>
      </dl>
      <div className="progress-track"><span style={{ width: `${progress.percent || 0}%` }} /></div>
      <div className="planner-card-actions"><Link className="button secondary" to={detailUrl}>공부계획 상세보기</Link><div className="planner-card-menu"><button className="icon-button" type="button" title="계획 관리" aria-label="계획 관리" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>⋯</button>{menuOpen && <div className="planner-card-menu-panel" role="menu"><span>계획 관리</span><button className="danger-text" type="button" onClick={() => onDelete(plan)}>공부계획 삭제</button></div>}</div></div>
    </article>
  );
}

export default StudyPlannerHome;
