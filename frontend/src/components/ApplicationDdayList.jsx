import React from "react";
import DdayBadge from "./DdayBadge.jsx";
import { formatShortDate } from "../utils/dateUtils.js";

const ddayItems = [
  { stage: "지원준비", label: "지원 마감", field: "deadline" },
  { stage: "필기전형", label: "필기시험", field: "writtenTestDate" },
  { stage: "면접전형", label: "면접일", field: "interviewDate" },
  { stage: "회신", label: "회신 마감", field: "replyDeadline" },
];

function ApplicationDdayList({ application }) {
  return (
    <div className="dday-list">
      {ddayItems.map((item) => {
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
