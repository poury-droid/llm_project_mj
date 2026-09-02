import React from "react";
import { Link } from "react-router-dom";
import ApplicationCard from "../components/ApplicationCard.jsx";
import { useApplications } from "../hooks/useApplications.js";

function ApplicationList() {
  const { applications, loading, error } = useApplications();

  return (
    <section>
      <div className="page-title">
        <div>
          <h1>지원 공고 목록</h1>
          <p>회사별 전형 단계와 주요 D-Day를 확인합니다.</p>
        </div>
        <Link className="button" to="/applications/new">새 공고 등록</Link>
      </div>
      {loading && <p>불러오는 중입니다.</p>}
      {error && <p className="error">{error}</p>}
      <div className="card-grid">
        {applications.map((application) => <ApplicationCard key={application.id} application={application} />)}
      </div>
    </section>
  );
}

export default ApplicationList;
