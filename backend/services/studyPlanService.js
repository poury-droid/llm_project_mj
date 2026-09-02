import { addDays, daysBetween, formatDate } from "../utils/dateUtils.js";

function getPhase(dayIndex, totalDays) {
  const ratio = dayIndex / Math.max(totalDays, 1);
  if (ratio < 0.35) return "개념";
  if (ratio < 0.7) return "문제풀이";
  return "기출 및 오답";
}

function weightedSubjects(subjects) {
  return subjects.flatMap((subject) => {
    const weight = Number(subject.importance || 3);
    return Array.from({ length: Math.max(weight, 1) }, () => subject.name);
  });
}

// 단순하지만 읽기 쉬운 규칙 기반 공부계획입니다.
// 제외한 날짜의 공부량은 커서를 유지해서 다음 가능한 날짜로 자연스럽게 재배치됩니다.
export function generateStudyPlan({ applicationId, examDate, weekdayHours, weekendHours, subjects, availableDays, excludedDates }) {
  const today = new Date();
  const totalDays = daysBetween(today, examDate);
  if (totalDays === null || totalDays < 0) {
    const error = new Error("시험일은 오늘 이후 날짜여야 합니다.");
    error.status = 400;
    throw error;
  }

  const subjectPool = weightedSubjects(subjects);
  if (subjectPool.length === 0) {
    const error = new Error("공부 과목을 1개 이상 입력해야 합니다.");
    error.status = 400;
    throw error;
  }

  let cursor = 0;
  const days = [];
  const allowedDays = availableDays?.length ? availableDays.map(Number) : [1, 2, 3, 4, 5, 6, 0];
  const blockedDates = new Set(excludedDates || []);

  for (let i = 0; i <= totalDays; i += 1) {
    const date = addDays(today, i);
    const dateKey = formatDate(date);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const hours = Number(isWeekend ? weekendHours : weekdayHours);
    const blocks = [];

    if (!allowedDays.includes(date.getDay()) || blockedDates.has(dateKey)) {
      days.push({ date: dateKey, excluded: true, blocks: [] });
      continue;
    }

    for (let hour = 0; hour < hours; hour += 1) {
      blocks.push({
        id: crypto.randomUUID(),
        subject: subjectPool[cursor % subjectPool.length],
        hours: 1,
        focus: getPhase(i, totalDays),
        completed: false
      });
      cursor += 1;
    }

    days.push({ date: dateKey, excluded: false, blocks });
  }

  return {
    id: crypto.randomUUID(),
    applicationId,
    examDate,
    weekdayHours: Number(weekdayHours),
    weekendHours: Number(weekendHours),
    subjects,
    availableDays: allowedDays,
    excludedDates: Array.from(blockedDates),
    days,
    createdAt: new Date().toISOString()
  };
}
