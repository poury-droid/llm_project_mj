export function toDateOnly(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function daysUntil(value) {
  const today = toDateOnly(new Date());
  const target = toDateOnly(value);
  if (!target) return null;
  return Math.round((target - today) / (24 * 60 * 60 * 1000));
}

export function getDdayLabel(value) {
  const days = daysUntil(value);
  if (days === null) return "-";
  if (days === 0) return "오늘";
  if (days > 0) return `D-${days}`;
  return `D+${Math.abs(days)}`;
}

export function getUrgencyLabel(value) {
  const days = daysUntil(value);
  if (days === null) return "";
  if (days < 0) return "마감초과";
  if (days <= 1) return "긴급";
  if (days <= 3) return "주의";
  return "";
}

export function formatShortDate(value) {
  if (!value) return "-";
  return String(value).slice(0, 10);
}
