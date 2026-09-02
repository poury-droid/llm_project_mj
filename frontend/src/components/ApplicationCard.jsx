import React from "react";
import { Link } from "react-router-dom";
import DdayBadge from "./DdayBadge.jsx";
import { formatShortDate } from "../utils/dateUtils.js";

function ApplicationCard({ application }) {
  const eventDate = application.writtenTestDate || application.interviewDate || application.deadline;
  const eventLabel = application.writtenTestDate ? "필기시험" : application.interviewDate ? "면접" : "지원마감";

  return (
    <article className="card app-card">
      <div>
        <h3>{application.company}</h3>
        <p>{application.position || "직무 미입력"} · {application.title || "제목 미입력"}</p>
      </div>
      <div className="card-meta">
        <span>현재 단계: {application.stage}</span>
        <span>{eventLabel}: {formatShortDate(eventDate)}</span>
        <DdayBadge date={eventDate} />
      </div>
      <Link className="button secondary" to={`/applications/${application.id}`}>상세 보기</Link>
    </article>
  );
}

export default ApplicationCard;
