import test from "node:test";
import assert from "node:assert/strict";
import { generateDailySchedule, redistributeSchedule, localDateKey, normalizeScheduleOptions } from "./studySchedule.js";
import { generateStudyPlan } from "./studyPlanService.js";

const start = new Date(2026, 8, 9, 0, 1);
const template = () => ({ examDate: "2026-09-19", weekdayHours: 2, weekendHours: 4,
  availableDays: [0, 1, 2, 3, 4, 5, 6], excludedDates: [], scheduleOptions: {},
  subjects: [{ id: "subject", name: "경제학", importance: 3, methods: ["문제풀이"],
    materials: [{ id: "book", name: "문제집", unit: "문제", totalAmount: 100, currentAmount: 0 }] }] });
const flatten = (days) => days.flatMap((day) => day.blocks);

test("every study day has work, with review during the plan and no duplicated new ranges", () => {
  const days = generateDailySchedule(template(), start);
  assert.equal(days.length, 10);
  assert.ok(days.every((day) => day.blocks.length));
  assert.ok(days[0].blocks.some((task) => task.generatedReview));
  assert.ok(flatten(days).some((task) => task.method === "오답정리"));
  const newWork = flatten(days).filter((task) => !task.generatedReview);
  let last = 0;
  for (const task of newWork) { assert.equal(parseInt(task.startRange), last + 1); last = parseInt(task.endRange); }
  assert.equal(last, 100);
  for (const day of days) {
    const weekday = new Date(day.date + "T12:00:00").getDay();
    const hours = weekday === 0 || weekday === 6 ? 4 : 2;
    assert.ok(Math.abs(day.blocks.reduce((sum, task) => sum + task.hours, 0) - hours) < 1e-8);
    assert.ok(Math.abs(day.blocks.filter((task) => task.generatedReview).reduce((sum, task) => sum + task.hours, 0) - hours * .3) < 1e-8);
  }
});

test("weekday review selection is respected while new work remains", () => {
  const plan = template(); plan.scheduleOptions = { reviewMode: "weekdays", reviewDays: [2, 4], reviewPercent: 40, reviewMethods: ["오답정리"] };
  const days = generateDailySchedule(plan, start);
  for (const day of days) {
    const weekday = new Date(day.date + "T12:00:00").getDay();
    assert.equal(day.blocks.some((task) => task.generatedReview), [2, 4].includes(weekday));
  }
});

test("explicit exclusions and zero-hour weekends stay empty", () => {
  const plan = template(); plan.excludedDates = ["2026-09-10"]; plan.weekendHours = 0;
  const days = generateDailySchedule(plan, start);
  for (const day of days) {
    if (["2026-09-10", "2026-09-12", "2026-09-13"].includes(day.date)) {
      assert.equal(day.excluded, true); assert.equal(day.blocks.length, 0);
    } else assert.ok(day.blocks.length);
  }
});

test("short materials are followed by review rather than fictitious new ranges", () => {
  const plan = template(); plan.subjects[0].materials[0].totalAmount = 2;
  const days = generateDailySchedule(plan, start);
  assert.ok(days.every((day) => day.blocks.length));
  assert.equal(flatten(days).filter((task) => !task.generatedReview).length, 2);
  assert.ok(days.slice(2).every((day) => day.blocks.every((task) => task.generatedReview)));
});

test("multiple materials include unfinished work and never exceed daily hours", () => {
  const plan = template();
  plan.subjects[0].materials.push({ id: "done", name: "완료", unit: "페이지", totalAmount: 20, currentAmount: 20 });
  plan.subjects.push({ id: "second", name: "영어", importance: 1, methods: ["개념"], materials: [{ id: "english", name: "영어책", unit: "강의", totalAmount: 15, currentAmount: 5 }] });
  const days = generateDailySchedule(plan, start);
  const work = flatten(days).filter((task) => !task.generatedReview);
  assert.ok(!work.some((task) => task.materialId === "done"));
  assert.equal(parseInt(work.find((task) => task.materialId === "english").startRange), 6);
  assert.equal(parseInt(work.filter((task) => task.materialId === "english").at(-1).endRange), 15);
});

function currentPlan() {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const dateAt = (offset) => { const day = new Date(today); day.setDate(day.getDate() + offset); return localDateKey(day); };
  return { ...template(), examDate: dateAt(4), weekdayHours: 3, weekendHours: 3,
    days: Array.from({ length: 4 }, (_, i) => ({ date: dateAt(i), excluded: false, blocks: [] })) };
}
const task = (id, extra = {}) => ({ id, subject: "경제학", materialName: "교재", method: "개념", rangeLabel: "1~10페이지", hours: 1, completed: false, ...extra });

test("rebalance preserves completed tasks, user edits and unfinished identities", () => {
  const plan = currentPlan();
  const done = task("done", { completed: true });
  plan.days[0].blocks = [done, task("one"), task("manual", { method: "오답정리", generatedReview: false })];
  plan.days[1].blocks = [task("two"), task("generated", { generatedReview: true })];
  const original = structuredClone(plan);
  const result = redistributeSchedule(plan);
  assert.deepEqual(plan, original);
  assert.deepEqual(result.days[0].blocks.find((block) => block.id === "done"), done);
  for (const id of ["one", "two", "manual"]) assert.equal(flatten(result.days).filter((block) => block.id === id).length, 1);
  assert.ok(!flatten(result.days).some((block) => block.id === "generated"));
  assert.ok(result.days.every((day) => day.blocks.length));
});

test("insufficient capacity fails without losing the original plan", () => {
  const plan = currentPlan(); plan.days[0].blocks = Array.from({ length: 20 }, (_, i) => task(String(i)));
  const original = structuredClone(plan);
  assert.throws(() => redistributeSchedule(plan), (error) => error.status === 400 && error.message.includes("시간이 부족"));
  assert.deepEqual(plan, original);
});

test("rebalance with no remaining days fails if unfinished work exists", () => {
  const plan = currentPlan(); plan.examDate = "2020-01-01"; plan.days[0].blocks = [task("unfinished")];
  assert.throws(() => redistributeSchedule(plan), { status: 400 });
});

test("rebalance splits a large range across days without losing pages or hours", () => {
  const plan = currentPlan();
  plan.days[0].blocks = [task("large", { materialId: "book", rangeLabel: "1~100페이지", startRange: "1페이지", endRange: "100페이지", hours: 8 })];
  const result = redistributeSchedule(plan);
  const blocks = flatten(result.days).filter((block) => !block.generatedReview);
  assert.equal(blocks.reduce((sum, block) => sum + block.hours, 0), 8);
  let last = 0;
  for (const block of blocks) { assert.equal(parseInt(block.startRange), last + 1); last = parseInt(block.endRange); }
  assert.equal(last, 100);
  assert.ok(result.days.every((day) => day.blocks.length));
});

test("invalid settings and zero study time fail explicitly", () => {
  assert.throws(() => normalizeScheduleOptions({ reviewPercent: 101 }), { status: 400 });
  assert.throws(() => normalizeScheduleOptions({ reviewMethods: [] }), { status: 400 });
  assert.throws(() => normalizeScheduleOptions({ reviewMode: "weekdays", reviewDays: [] }), { status: 400 });
  assert.throws(() => generateDailySchedule({ ...template(), weekdayHours: 0, weekendHours: 0 }, start), { status: 400 });
});

test("date keys use local calendar days even near midnight", () => {
  assert.equal(localDateKey(start), "2026-09-09");
  assert.equal(generateDailySchedule(template(), start)[0].date, "2026-09-09");
});

test("public generator retains settings and recalculates progress", () => {
  const plan = currentPlan();
  const result = generateStudyPlan(plan);
  assert.equal(result.scheduleOptions.dailyStudy, true);
  assert.equal(result.progress.total, flatten(result.days).length);
  assert.equal(result.progress.done, 0);
});
