import React from "react";
import DdayBadge from "./DdayBadge.jsx";
import { formatShortDate } from "../utils/dateUtils.js";

const ddayItems = [
  { stage: "지원준비", label: "지원 마감", field: "deadline", appliesTo: ["관심공고", "지원준비", "서류전형"] },
  { stage: "필기전형", label: "필기시험", field: "writtenTestDate", appliesTo: ["필기전형"] },
  { stage: "면접전형", label: "면접일", field: "interviewDate", appliesTo: ["면접전형"] },
  { stage: "최종결과", label: "회신 마감", field: "replyDeadline", appliesTo: ["최종결과"] }
];

function ApplicationDdayList({ application, currentOnly = false, hideEmpty = false }) {
  const items = ddayItems
    .filter((item) => !currentOnly || item.appliesTo.includes(application.stage))
    .filter((item) => !hideEmpty || application[item.field]);

  if (!items.length) return <p className="empty">등록된 일정이 없습니다.</p>;

  return (
    <div className="dday-list">
      {items.map((item) => {
        const date = application[item.field];
        return (
          <div className="dday-row" key={item.field}>
            <div>
              <strong>{item.stage}</strong>
              <span>{item.label}</span>
            </div>
            <span>{formatShortDate(date)}</span>
            <DdayBadge date={date} />
          </div>
        );
      })}
    </div>
  );
}

export default ApplicationDdayList;
