import { findAllApplications } from "../repositories/applicationRepository.js";
import { findAllTasks } from "../repositories/taskRepository.js";
import { findAllStudyPlans } from "../repositories/studyPlanRepository.js";
import { daysBetween } from "../utils/dateUtils.js";

export async function getDashboard(req, res) {
  const today = new Date();
  const applications = await findAllApplications(req.user.id);
  const tasks = await findAllTasks(req.user.id);
  const studyPlans = await findAllStudyPlans(req.user.id);
  const applicationById = new Map(applications.map((app) => [app.id, app]));
  const withApplicationInfo = (task) => {
    const application = applicationById.get(task.applicationId);
    return {
      ...task,
      company: application?.company || ""
    };
  };
  const active = applications.filter((app) => app.stage !== "최종결과");
  const calendarEvents = applications
    .flatMap(getApplicationEvents)
    .map((event) => ({ ...event, daysLeft: daysBetween(today, event.date) }))
    .filter((event) => event.daysLeft !== null && event.daysLeft >= 0)
    .sort((a, b) => a.daysLeft - b.daysLeft);
  const weekDeadlines = calendarEvents.filter((event) => {
    const d = daysBetween(today, event.date);
    return d !== null && d >= 0 && d <= 7;
  });
  const todayTasks = tasks.filter((task) => !task.completed && daysBetween(today, task.dueDate) === 0);
  const threeDayTasks = tasks.filter((task) => {
    const d = daysBetween(today, task.dueDate);
    return !task.completed && d !== null && d >= 0 && d <= 3;
  });
  const urgentTasks = tasks.filter((task) => {
    const d = daysBetween(today, task.dueDate);
    return !task.completed && ["urgent", "high"].includes(task.priority) && d !== null && d >= 0 && d <= 14;
  });
  const checklists = applications.map((application) => ({
    applicationId: application.id,
    company: application.company,
    position: application.position,
    stage: application.stage,
    tasks: tasks
      .filter((task) => task.applicationId === application.id)
      .sort((a, b) => Number(a.completed) - Number(b.completed))
  })).filter((item) => item.tasks.length > 0);
  const studyChecklist = studyPlans
    .flatMap((plan) => plan.days.flatMap((day) => day.blocks.map((block) => ({
      ...block,
      studyPlanId: plan.id,
      applicationId: plan.applicationId,
      personalExamId: plan.personalExamId,
      examName: plan.examName,
      date: day.date,
      excluded: day.excluded,
      studyMethod: block.method || block.studyMethod || "",
      materialName: block.materialName || "",
      studyRange: block.rangeLabel || ""
    }))))
    .filter((block) => !block.completed && !block.excluded && daysBetween(today, block.date) === 0)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 8)
    .map((block) => ({
      ...block,
      hours: formatStudyHours(block.hours),
      company: applicationById.get(block.applicationId)?.company || ""
    }));

  res.json({
    activeCount: active.length,
    weekDeadlines,
    todayTasks: todayTasks.map(withApplicationInfo),
    threeDayTasks: threeDayTasks.map(withApplicationInfo),
    urgentTasks: urgentTasks.map(withApplicationInfo),
    checklists,
    studyChecklist,
    studyPlanApplicationId: studyPlans[0]?.applicationId || null,
    calendarEvents,
    nearestEvent: calendarEvents[0] || null,
    stages: applications.map((app) => ({
      id: app.id,
      company: app.company,
      position: app.position,
      title: app.title,
      stage: app.stage,
      deadline: app.deadline,
      writtenTestDate: app.writtenTestDate,
      interviewDate: app.interviewDate,
      replyDeadline: app.replyDeadline
    }))
  });
}

function formatStudyHours(hours) {
  const value = Number(hours);
  if (!Number.isFinite(value)) return hours;
  return Number(value.toFixed(1));
}

function getApplicationEvents(app) {
  return [
    { type: "지원 마감", date: app.deadline },
    { type: "필기시험", date: app.writtenTestDate },
    { type: "면접", date: app.interviewDate },
    { type: "회신 마감", date: app.replyDeadline }
  ]
    .filter((event) => event.date)
    .map((event) => ({
      ...event,
      applicationId: app.id,
      company: app.company
    }));
}
