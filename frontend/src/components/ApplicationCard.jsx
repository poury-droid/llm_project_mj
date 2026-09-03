import React from "react";
import { Link } from "react-router-dom";
import ApplicationDdayList from "./ApplicationDdayList.jsx";

function ApplicationCard({ application }) {
  return (
    <article className="card app-card">
      <div>
        <h3>{application.company}</h3>
        <p>{application.position || "직무 미입력"} · {application.title || "제목 미입력"}</p>
      </div>
      <div className="card-meta">
        <span>현재 단계: {application.stage}</span>
      </div>
      <ApplicationDdayList application={application} />
      <Link className="button secondary" to={`/applications/${application.id}`}>상세 보기</Link>
    </article>
  );
}

export default ApplicationCard;
