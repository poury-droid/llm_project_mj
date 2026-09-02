import { findAllApplications } from "../repositories/applicationRepository.js";
import { findAllTasks } from "../repositories/taskRepository.js";
import { daysBetween } from "../utils/dateUtils.js";

export async function getDashboard(req, res) {
  const today = new Date();
  const applications = await findAllApplications();
  const tasks = await findAllTasks();
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
  const upcomingEvents = applications
    .flatMap((app) => [
      app.writtenTestDate ? { applicationId: app.id, company: app.company, type: "필기시험", date: app.writtenTestDate } : null,
      app.interviewDate ? { applicationId: app.id, company: app.company, type: "면접", date: app.interviewDate } : null
    ])
    .filter(Boolean)
    .map((event) => ({ ...event, daysLeft: daysBetween(today, event.date) }))
    .filter((event) => event.daysLeft !== null && event.daysLeft >= 0)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  res.json({
    activeCount: active.length,
    weekDeadlines,
    todayTasks,
    threeDayTasks,
    urgentTasks,
    nearestEvent: upcomingEvents[0] || null,
    stages: applications.map((app) => ({ id: app.id, company: app.company, stage: app.stage, writtenTestDate: app.writtenTestDate, interviewDate: app.interviewDate }))
  });
}
