const stages = ["관심공고", "지원준비", "서류전형", "필기전형", "면접전형", "최종결과"];
const priorities = ["low", "normal", "high", "urgent"];

function fail(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

export function validateApplication(req, res, next) {
  const { company, position, title, deadline, stage } = req.body;
  if (!company || !position || !title || !deadline || !stage) return next(fail("회사명, 직무, 공고 제목, 마감일, 전형 단계는 필수입니다."));
  if (!stages.includes(stage)) return next(fail("올바른 전형 단계가 아닙니다."));
  next();
}

export function validateTask(req, res, next) {
  const { title, priority = "normal" } = req.body;
  if (!title) return next(fail("체크리스트 제목은 필수입니다."));
  if (!priorities.includes(priority)) return next(fail("올바른 우선순위가 아닙니다."));
  next();
}

export function validateStudyPlan(req, res, next) {
  const { examDate, weekdayHours, weekendHours, subjects } = req.body;
  if (!examDate || weekdayHours === undefined || weekendHours === undefined) return next(fail("시험일, 평일 공부 시간, 주말 공부 시간은 필수입니다."));
  if (!Array.isArray(subjects) || subjects.length === 0) return next(fail("공부 과목을 입력하세요."));
  next();
}
