import { addDays, daysBetween, formatDate } from "../utils/dateUtils.js";
import { generateDailySchedule, normalizeScheduleOptions, redistributeSchedule } from "./studySchedule.js";

const methodByPhase = {
  concept: ["개념 학습", "복습"],
  practice: ["문제풀이", "기출문제", "오답정리"],
  final: ["모의고사", "기출문제", "오답정리", "복습"]
};

function getPhase(dayIndex, totalDays) {
  const ratio = dayIndex / Math.max(totalDays, 1);
  if (ratio < 0.35) return "concept";
  if (ratio < 0.75) return "practice";
  return "final";
}

function weightedSubjects(subjects) {
  return subjects.flatMap((subject) => {
    const weight = Number(subject.importance || 3);
    return Array.from({ length: Math.max(weight, 1) }, () => subject);
  });
}

function guessUnit(type = "") {
  if (type.includes("모의고사") || type.includes("기출") || type.includes("문제집")) return "회";
  if (type.includes("강의")) return "강";
  return "페이지";
}

function normalizeMaterial(material, index) {
  const total = Number(material.totalAmount || material.total || 0);
  const current = Number(material.currentAmount || material.current || 0);
  return {
    id: material.id || crypto.randomUUID(),
    name: material.name || `자료 ${index + 1}`,
    type: material.type || "기타",
    unit: material.unit || guessUnit(material.type),
    totalAmount: total,
    currentAmount: current,
    targetDate: material.targetDate || ""
  };
}

function normalizeSubjects(subjects = []) {
  return subjects
    .filter((subject) => subject?.name)
    .map((subject) => ({
      id: subject.id || crypto.randomUUID(),
      name: subject.name,
      importance: Number(subject.importance || 3),
      methods: subject.methods?.length ? subject.methods : ["개념 학습", "문제풀이", "복습"],
      materials: (subject.materials || []).map(normalizeMaterial)
    }));
}

function estimateWorkUnits(material) {
  const remaining = Math.max(0, Number(material.totalAmount || 0) - Number(material.currentAmount || 0));
  if (!remaining) return 0;
  const unit = String(material.unit || "");
  return unit.includes("페이지") ? Math.ceil(remaining / 25) : remaining;
}

function pickMethod(subject, phaseKey) {
  const preferred = methodByPhase[phaseKey] || methodByPhase.practice;
  return preferred.find((method) => subject.methods.includes(method)) || subject.methods[0] || "복습";
}

function buildRange(material, progressMap, method) {
  if (!material) return { label: "", startRange: "", endRange: "" };
  const chunkSize = method.includes("모의고사") || method.includes("기출") ? 1 : 25;
  const current = progressMap.get(material.id) ?? Number(material.currentAmount || 0);
  const total = Number(material.totalAmount || 0);
  if (total > 0 && current >= total) return null;
  const start = total > 0 ? Math.min(current + 1, total) : current + 1;
  const end = total > 0 ? Math.min(current + chunkSize, total) : current + chunkSize;
  progressMap.set(material.id, end);
  return {
    label: `${start}~${end}${material.unit}`,
    startRange: `${start}${material.unit}`,
    endRange: `${end}${material.unit}`
  };
}

export function calculateProgress(plan) {
  const tasks = (plan.days || []).flatMap((day) => day.blocks || []);
  const total = tasks.length;
  const done = tasks.filter((task) => task.completed).length;
  const percent = total ? Math.round((done / total) * 100) : 0;
  const bySubject = {};

  for (const task of tasks) {
    const key = task.subject || "기타";
    bySubject[key] ||= { total: 0, done: 0, percent: 0 };
    bySubject[key].total += 1;
    if (task.completed) bySubject[key].done += 1;
    bySubject[key].percent = Math.round((bySubject[key].done / bySubject[key].total) * 100);
  }

  return { total, done, percent, bySubject };
}

export function generateStudyPlan({
  type = "application",
  applicationId = null,
  personalExamId = null,
  examName = "",
  examDate,
  target = "",
  currentLevel = "",
  weekdayHours,
  weekendHours,
  subjects,
  availableDays,
  excludedDates,
  phaseMode = "auto",
  manualPhases = [],
  intensity = "normal",
  scheduleOptions
}) {
  const today = new Date();
  const totalDays = daysBetween(today, examDate);
  if (totalDays === null || totalDays < 0) {
    const error = new Error("시험일은 오늘 이후 날짜여야 합니다.");
    error.status = 400;
    throw error;
  }

  const normalizedSubjects = normalizeSubjects(subjects);
  const subjectPool = weightedSubjects(normalizedSubjects);
  if (subjectPool.length === 0) {
    const error = new Error("공부 과목을 1개 이상 입력해야 합니다.");
    error.status = 400;
    throw error;
  }

  if (scheduleOptions) {
    const plan = {
      id: crypto.randomUUID(), type, applicationId, personalExamId, examName, examDate,
      target, currentLevel, weekdayHours: Number(weekdayHours), weekendHours: Number(weekendHours),
      subjects: normalizedSubjects, availableDays: availableDays || [0, 1, 2, 3, 4, 5, 6],
      excludedDates: excludedDates || [], phaseMode, manualPhases, intensity,
      scheduleOptions: normalizeScheduleOptions(scheduleOptions),
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    };
    plan.days = generateDailySchedule(plan);
    return { ...plan, progress: calculateProgress(plan) };
  }

  let cursor = 0;
  const days = [];
  const materialProgress = new Map(normalizedSubjects.flatMap((subject) => (
    subject.materials.map((material) => [material.id, Number(material.currentAmount || 0)])
  )));
  const allowedDays = availableDays?.length ? availableDays.map(Number) : [1, 2, 3, 4, 5, 6, 0];
  const blockedDates = new Set(excludedDates || []);
  const studyDayCount = Array.from({ length: totalDays }, (_, index) => addDays(today, index)).filter((date) => {
    const dateKey = formatDate(date);
    return allowedDays.includes(date.getDay()) && !blockedDates.has(dateKey);
  }).length;
  const totalWorkUnits = normalizedSubjects.reduce((sum, subject) => sum + subject.materials.reduce((materialSum, material) => materialSum + estimateWorkUnits(material), 0), 0);
  let assignedBlocks = 0;

  // 시험 당일은 시험 준비일이 아니므로 전날까지만 공부를 배정합니다.
  for (let i = 0; i < totalDays; i += 1) {
    const date = addDays(today, i);
    const dateKey = formatDate(date);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const hours = Number(isWeekend ? weekendHours : weekdayHours);
    const blocks = [];

    if (!allowedDays.includes(date.getDay()) || blockedDates.has(dateKey)) {
      days.push({ date: dateKey, excluded: true, blocks: [] });
      continue;
    }

    const intensityFactor = intensity === "relaxed" ? 0.75 : intensity === "intensive" ? 1.25 : 1;
    const dailyCapacity = Math.max(1, Math.floor(hours * intensityFactor));
    const targetThroughToday = studyDayCount ? Math.ceil(totalWorkUnits * (days.filter((item) => !item.excluded).length + 1) / studyDayCount) : totalWorkUnits;
    const dailyTarget = Math.min(dailyCapacity, Math.max(0, targetThroughToday - assignedBlocks));
    for (let hour = 0; hour < dailyTarget; hour += 1) {
      const availableSubjects = subjectPool.filter((subject) => subject.materials.some((material) => {
        const current = materialProgress.get(material.id) ?? Number(material.currentAmount || 0);
        return !Number(material.totalAmount || 0) || current < Number(material.totalAmount);
      }));
      if (!availableSubjects.length) break;
      const subject = availableSubjects[cursor % availableSubjects.length];
      const autoPhase = getPhase(i, totalDays);
      const phase = phaseMode === "manual"
        ? manualPhases.find((item) => item.startDate <= dateKey && dateKey <= item.endDate)?.name || autoPhase
        : autoPhase;
      const method = pickMethod(subject, phase);
      const unfinishedMaterials = subject.materials.filter((material) => !Number(material.totalAmount) || (materialProgress.get(material.id) || 0) < Number(material.totalAmount));
      const material = unfinishedMaterials[cursor % unfinishedMaterials.length];
      const range = buildRange(material, materialProgress, method);
      if (!range) { cursor += 1; hour -= 1; continue; }
      blocks.push({
        id: crypto.randomUUID(),
        subjectId: subject.id,
        subject: subject.name,
        materialId: material?.id || "",
        materialName: material?.name || "",
        materialType: material?.type || "",
        method,
        startRange: range.startRange,
        endRange: range.endRange,
        rangeLabel: range.label,
        hours: 1,
        focus: phase,
        completed: false
      });
      cursor += 1;
      assignedBlocks += 1;
    }

    days.push({ date: dateKey, excluded: false, blocks });
  }

  const plan = {
    id: crypto.randomUUID(),
    type,
    applicationId,
    personalExamId: personalExamId || (type === "personalExam" ? crypto.randomUUID() : null),
    examName,
    examDate,
    target,
    currentLevel,
    weekdayHours: Number(weekdayHours),
    weekendHours: Number(weekendHours),
    subjects: normalizedSubjects,
    availableDays: allowedDays,
    excludedDates: Array.from(blockedDates),
    phaseMode,
    manualPhases,
    intensity,
    days,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  return { ...plan, progress: calculateProgress(plan) };
}

export function rebalanceIncompletePlan(plan, scheduleOptions = plan.scheduleOptions) {
  const next = redistributeSchedule(plan, scheduleOptions);
  return { ...next, progress: calculateProgress(next) };
}
