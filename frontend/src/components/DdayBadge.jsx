import React from "react";
import { useDday } from "../hooks/useDday.js";

function DdayBadge({ date }) {
  const { label, urgency } = useDday(date);
  const isDanger = urgency === "긴급" || urgency === "마감초과";
  const className = urgency ? `badge ${isDanger ? "danger" : "warn"}` : "badge";
  return <span className={className}>{urgency ? `${urgency} · ${label}` : label}</span>;
}

export default DdayBadge;
