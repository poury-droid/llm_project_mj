import { findAllApplications } from "../repositories/applicationRepository.js";
import { findAllTasks } from "../repositories/taskRepository.js";
import { findAllStudyPlans } from "../repositories/studyPlanRepository.js";
import { daysBetween } from "../utils/dateUtils.js";

export async function getDashboard(req, res) {
  const today = new Date();
  const applications = await findAllApplications();
  const tasks = await findAllTasks();
  const studyPlans = await findAllStudyPlans();
  const applicationById = new Map(applications.map((app) => [app.id, app]));
  const withApplicationInfo = (task) => {
    const application = applicationById.get(task.applicationId);
    return {
      ...task,
      company: application?.company || ""
    };
  };
  const active = applications.filter((app) => app.stage !== "최종결과");
  const weekDeadlines = applications.filter((app) => {
    const d = daysBetween(today, app.deadline);
    return d !== null && d >= 0 && d <= 7;
  });
  const todayTasks = tasks.filter((task) => !task.completed && daysBetween(today, task.dueDate) === 0);
  const threeDayTasks = tasks.filter((task) => {
    const d = daysBetween(today, task.dueDate);
    return !task.completed && d !== null && d >= 0 && d <= 3;
  });
  const urgentTasks = tasks.filter((task) => !task.completed && ["urgent", "high"].includes(task.priority));
  const checklists = applications.map((application) => ({
    applicationId: application.id,
    company: application.company,
    position: application.position,
    stage: application.stage,
    tasks: tasks
      .filter((task) => task.applicationId === application.id)
      .sort((a, b) => Number(a.completed) - Number(b.completed))
  })).filter((item) => item.tasks.length > 0);
  const upcomingEvents = applications
    .flatMap((app) => [
      app.deadline ? { applicationId: app.id, company: app.company, type: "지원 마감", date: app.deadline } : null,
      app.writtenTestDate ? { applicationId: app.id, company: app.company, type: "필기시험", date: app.writtenTestDate } : null,
      app.interviewDate ? { applicationId: app.id, company: app.company, type: "면접", date: app.interviewDate } : null,
      app.replyDeadline ? { applicationId: app.id, company: app.company, type: "최종 발표", date: app.replyDeadline } : null
    ])
    .filter(Boolean)
    .map((event) => ({ ...event, daysLeft: daysBetween(today, event.date) }))
    .filter((event) => event.daysLeft !== null && event.daysLeft >= 0)
    .sort((a, b) => a.daysLeft - b.daysLeft);
  const studyChecklist = studyPlans
    .flatMap((plan) => plan.days.flatMap((day) => day.blocks.map((block) => ({ ...block, applicationId: plan.applicationId, date: day.date, excluded: day.excluded }))))
    .filter((block) => !block.completed && !block.excluded && daysBetween(today, block.date) === 0)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 8)
    .map((block) => ({ ...block, company: applicationById.get(block.applicationId)?.company || "" }));

  res.json({
    activeCount: active.length,
    weekDeadlines,
    todayTasks: todayTasks.map(withApplicationInfo),
    threeDayTasks: threeDayTasks.map(withApplicationInfo),
    urgentTasks: urgentTasks.map(withApplicationInfo),
    checklists,
    studyChecklist,
    calendarEvents: upcomingEvents,
    nearestEvent: upcomingEvents[0] || null,
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
