import { getDdayLabel, getUrgencyLabel } from "../utils/dateUtils.js";

// D-Day 표현을 여러 컴포넌트에서 같은 방식으로 쓰기 위한 작은 hook입니다.
export function useDday(date) {
  return {
    label: getDdayLabel(date),
    urgency: getUrgencyLabel(date)
  };
}
