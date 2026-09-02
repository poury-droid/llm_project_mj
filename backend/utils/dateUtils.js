// 날짜 계산은 대시보드, 경고 표시, 공부계획 생성에서 반복되므로 유틸로 분리합니다.
export function toDateOnly(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function daysBetween(from, to) {
  const start = toDateOnly(from);
  const end = toDateOnly(to);
  if (!start || !end) return null;
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round((end - start) / oneDay);
}

export function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function formatDate(date) {
  return date.toISOString().slice(0, 10);
}
