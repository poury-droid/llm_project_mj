export const defaultScheduleOptions = {
  dailyStudy: true, reviewMode: "daily", reviewPercent: 30,
  reviewDays: [2, 4], reviewMethods: ["복습", "오답정리"]
};

function invalid(message) { throw Object.assign(new Error(message), { status: 400 }); }
export function normalizeScheduleOptions(value = {}) {
  const options = { ...defaultScheduleOptions, ...value };
  options.reviewPercent = Number(options.reviewPercent);
  if (!Number.isFinite(options.reviewPercent) || options.reviewPercent < 0 || options.reviewPercent > 80) invalid("복습·오답 비율은 0~80%로 입력해주세요.");
  if (!["daily", "weekdays"].includes(options.reviewMode)) invalid("복습 배정 방식을 확인해주세요.");
  if (!Array.isArray(options.reviewDays) || !Array.isArray(options.reviewMethods)) invalid("복습 요일과 방식을 확인해주세요.");
  options.dailyStudy = options.dailyStudy === true;
  options.reviewDays = [...new Set((options.reviewDays || []).map(Number))].filter((day) => Number.isInteger(day) && day >= 0 && day <= 6);
  options.reviewMethods = (options.reviewMethods || []).filter((method) => ["복습", "오답정리"].includes(method));
  if (!options.reviewMethods.length) invalid("복습 또는 오답정리를 하나 이상 선택해주세요.");
  if (options.reviewMode === "weekdays" && !options.reviewDays.length) invalid("복습할 요일을 하나 이상 선택해주세요.");
  return options;
}

export function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function dayHours(plan, date) {
  const day = new Date(`${date}T12:00:00`).getDay();
  const hours = Number(day === 0 || day === 6 ? plan.weekendHours : plan.weekdayHours);
  if (!Number.isFinite(hours) || hours < 0 || hours > 24) invalid("하루 공부시간은 0~24시간으로 입력해주세요.");
  return hours;
}

function reviewFraction(options, date) {
  const day = new Date(`${date}T12:00:00`).getDay();
  return options.reviewMode === "daily" || options.reviewDays.includes(day) ? options.reviewPercent / 100 : 0;
}

function reviewBlock(source, hours, options, index) {
  return { ...source, id: crypto.randomUUID(), hours, completed: false,
    method: options.reviewMethods[index % options.reviewMethods.length],
    kind: "review", generatedReview: true, reviewOf: source.id };
}

function splitRangeTask(task) {
  if (task.userEdited || ["복습", "오답정리"].includes(task.method)) return null;
  const match = /^(\d+)~(\d+)(.+)$/.exec(task.rangeLabel || "");
  if (!match || Number(match[2]) <= Number(match[1]) || task.hours < 0.02) return null;
  const start = Number(match[1]), end = Number(match[2]), unit = match[3];
  const middle = Math.floor((start + end) / 2);
  const firstHours = task.hours * (middle - start + 1) / (end - start + 1);
  return [
    { ...task, endRange: `${middle}${unit}`, rangeLabel: `${start}~${middle}${unit}`, hours: firstHours },
    { ...task, id: crypto.randomUUID(), startRange: `${middle + 1}${unit}`, rangeLabel: `${middle + 1}~${end}${unit}`, hours: task.hours - firstHours }
  ];
}

export function generateDailySchedule(plan, today = new Date()) {
  const options = normalizeScheduleOptions(plan.scheduleOptions);
  const date = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const days = [];
  while (localDateKey(date) < String(plan.examDate).slice(0, 10)) {
    const key = localDateKey(date);
    const excluded = (plan.excludedDates || []).includes(key) ||
      (!options.dailyStudy && !(plan.availableDays || [0, 1, 2, 3, 4, 5, 6]).includes(date.getDay())) || dayHours(plan, key) <= 0;
    days.push({ date: key, excluded, blocks: [] });
    date.setDate(date.getDate() + 1);
  }
  if (!days.some((day) => !day.excluded)) invalid("시험 전 공부할 수 있는 날짜와 시간을 설정해주세요.");
  const materials = plan.subjects.flatMap((subject) => (subject.materials || []).map((material) => ({ subject, material, current: Number(material.currentAmount || 0) })));
  for (const { material, current } of materials) {
    if (!Number.isInteger(Number(material.totalAmount)) || Number(material.totalAmount) < 0 || !Number.isInteger(current) || current < 0 || current > Number(material.totalAmount)) invalid("전체·완료 분량은 0 이상의 정수로 입력하고, 완료 분량은 전체 분량 이하로 입력해주세요.");
  }
  if (!materials.some(({ material, current }) => Number(material.totalAmount) > current)) invalid("남은 공부 분량을 입력해주세요.");
  let remainingDays = days.filter((day) => !day.excluded).length;
  let reviewIndex = 0;
  const learned = [];
  for (const day of days) {
    if (day.excluded) continue;
    const capacity = dayHours(plan, day.date);
    const active = materials.filter(({ material, current }) => Number(material.totalAmount) > current);
    const fraction = reviewFraction(options, day.date);
    const reviewHours = active.length ? capacity * fraction : (options.dailyStudy || fraction > 0 ? capacity : 0);
    const totalWeight = active.reduce((sum, item) => sum + Math.max(1, Number(item.subject.importance) || 1), 0);
    for (const item of active) {
      const amount = Math.ceil((Number(item.material.totalAmount) - item.current) / remainingDays);
      const start = item.current + 1;
      const end = Math.min(Number(item.material.totalAmount), item.current + amount);
      item.current = end;
      const block = {
        id: crypto.randomUUID(), subjectId: item.subject.id, subject: item.subject.name,
        materialId: item.material.id, materialName: item.material.name, materialType: item.material.type,
        method: item.subject.methods?.[0] || "개념", startRange: `${start}${item.material.unit}`,
        endRange: `${end}${item.material.unit}`, rangeLabel: `${start}~${end}${item.material.unit}`,
        hours: (capacity - reviewHours) * Math.max(1, Number(item.subject.importance) || 1) / totalWeight,
        completed: false, kind: "study"
      };
      day.blocks.push(block);
      learned.push(block);
    }
    if (reviewHours > 0 && learned.length) {
      const sources = day.blocks.length ? [...day.blocks] : [learned[reviewIndex % learned.length]];
      for (const source of sources) day.blocks.push(reviewBlock(source, reviewHours / sources.length, options, reviewIndex++));
    }
    remainingDays -= 1;
  }
  return days;
}

// Rebalance existing work without dropping tasks or altering completed records.
export function redistributeSchedule(plan, rawOptions = plan.scheduleOptions) {
  const options = normalizeScheduleOptions(rawOptions);
  const today = localDateKey();
  const pending = [];
  const completedSources = [];
  const days = plan.days.map((day) => ({ ...day, blocks: (day.blocks || []).filter((block) => {
    if (block.completed) { completedSources.push(block); return true; }
    if (!block.generatedReview) pending.push({ ...block });
    return false;
  }) }));
  const eligible = days.filter((day) => {
    if (day.date < today || day.date >= String(plan.examDate).slice(0, 10)) return false;
    const weekday = new Date(`${day.date}T12:00:00`).getDay();
    day.excluded = (plan.excludedDates || []).includes(day.date) || (!options.dailyStudy && !(plan.availableDays || [0, 1, 2, 3, 4, 5, 6]).includes(weekday)) || dayHours(plan, day.date) <= 0;
    return !day.excluded;
  });
  const freeHours = (day) => Math.max(0, dayHours(plan, day.date) - day.blocks.reduce((sum, block) => sum + Number(block.hours || 0), 0));
  for (const task of pending) if (!(Number(task.hours) > 0) || !Number.isFinite(Number(task.hours))) invalid("공부 항목의 시간을 확인해주세요.");
  const total = pending.reduce((sum, task) => sum + Number(task.hours), 0);
  if (total > eligible.reduce((sum, day) => sum + freeHours(day), 0) + 1e-8) invalid("남은 공부를 모두 담기에는 시간이 부족해요. 공부시간을 늘리거나 항목을 조정해주세요. 기존 계획은 유지됩니다.");
  if (options.dailyStudy) {
    const freeDays = eligible.filter((day) => freeHours(day) > 0);
    const maximum = Math.max(0, ...freeDays.map(freeHours));
    // Split only machine-readable new-work ranges; preserve manually edited sessions.
    while (pending.length < freeDays.length || pending.some((task) => task.hours > maximum)) {
      const index = pending.reduce((best, task, i) => splitRangeTask(task) && (best < 0 || task.hours > pending[best].hours) ? i : best, -1);
      if (index < 0) break;
      pending.splice(index, 1, ...splitRangeTask(pending[index]));
    }
  }
  const assigned = new Map(eligible.map((day) => [day.date, 0]));
  const materialDates = new Map();
  for (const task of pending) {
    const candidates = eligible.filter((day) => freeHours(day) + 1e-8 >= Number(task.hours));
    candidates.sort((a, b) => {
      const reviewA = reviewFraction(options, a.date), reviewB = reviewFraction(options, b.date);
      return (assigned.get(a.date) / Math.max(0.01, dayHours(plan, a.date) * (1 - reviewA))) -
        (assigned.get(b.date) / Math.max(0.01, dayHours(plan, b.date) * (1 - reviewB)));
    });
    const materialKey = task.materialId && !["복습", "오답정리"].includes(task.method) ? task.materialId : null;
    const target = candidates.find((day) => !materialKey || day.date >= (materialDates.get(materialKey) || ""));
    if (!target) invalid("공부 항목을 순서대로 담을 시간이 부족해요. 공부시간을 늘리거나 항목을 나누어주세요. 기존 계획은 유지됩니다.");
    target.blocks.push(task);
    assigned.set(target.date, assigned.get(target.date) + Number(task.hours));
    if (materialKey) materialDates.set(materialKey, target.date);
  }
  let reviewIndex = 0;
  for (const day of eligible) {
    const sources = [...completedSources, ...days.filter((item) => item.date <= day.date).flatMap((item) => item.blocks)].filter((block) => !block.generatedReview);
    const free = freeHours(day);
    const hours = !day.blocks.length && options.dailyStudy ? free : Math.min(free, dayHours(plan, day.date) * reviewFraction(options, day.date));
    if (hours > 1e-8 && sources.length) day.blocks.push(reviewBlock(sources[reviewIndex % sources.length], hours, options, reviewIndex++));
    if (options.dailyStudy && !day.blocks.length && pending.length) invalid("매일 배정하려면 큰 공부 항목을 나누거나 해당 날짜의 공부시간을 늘려주세요. 기존 계획은 유지됩니다.");
  }
  return { ...plan, scheduleOptions: options, days, updatedAt: new Date().toISOString() };
}
