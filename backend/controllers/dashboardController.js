// 공고, 할 일, 학습계획을 조합해 대시보드 전용 요약 데이터를 생성합니다.
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
  const currentStageEvents = applications
    .map(getCurrentStageEvent)
    .filter(Boolean)
    .map((event) => ({ ...event, daysLeft: daysBetween(today, event.date) }))
    .filter((event) => event.daysLeft !== null && event.daysLeft >= 0)
    .sort((a, b) => a.daysLeft - b.daysLeft);
  const weekDeadlines = currentStageEvents.filter((event) => {
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
    .map((block) => ({ ...block, company: applicationById.get(block.applicationId)?.company || "" }));

  res.json({
    activeCount: active.length,
    weekDeadlines,
    todayTasks: todayTasks.map(withApplicationInfo),
    threeDayTasks: threeDayTasks.map(withApplicationInfo),
    urgentTasks: urgentTasks.map(withApplicationInfo),
    checklists,
    studyChecklist,
    studyPlanApplicationId: studyPlans[0]?.applicationId || null,
    calendarEvents: currentStageEvents,
    nearestEvent: currentStageEvents[0] || null,
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

function getCurrentStageEvent(app) {
  const stageEvents = {
    관심공고: { type: "지원 마감", date: app.deadline },
    지원준비: { type: "지원 마감", date: app.deadline },
    서류전형: { type: "지원 마감", date: app.deadline },
    필기전형: { type: "필기시험", date: app.writtenTestDate },
    면접전형: { type: "면접", date: app.interviewDate },
    최종결과: { type: "최종 발표", date: app.replyDeadline }
  };
  const event = stageEvents[app.stage];
  if (!event?.date) return null;
  return {
    applicationId: app.id,
    company: app.company,
    type: event.type,
    date: event.date
  };
}
