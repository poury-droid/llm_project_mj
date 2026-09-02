const templates = {
  관심공고: ["공고 상세 읽기", "지원자격 확인", "마감일 캘린더 등록"],
  지원준비: ["지원자격 확인", "지원서 작성", "자기소개서 작성", "자격증 번호 확인", "교육사항 확인", "경력사항 확인", "첨부파일 확인", "제출 전 최종검토"],
  서류전형: ["서류 접수 상태 확인", "합격 발표일 확인", "다음 전형 준비사항 확인"],
  필기전형: ["필기시험 날짜 확인", "시험 장소 확인", "입실 시간 확인", "수험표 확인", "신분증 준비", "필기구 준비", "교통편 확인"],
  면접전형: ["면접 날짜 확인", "면접 장소 확인", "제출서류 준비", "면접 복장 준비", "회사 조사", "직무 조사", "예상 질문 준비", "자기소개 준비", "교통편 확인"],
  최종결과: ["결과 발표 확인", "입사서류 확인", "입사 가능일 정리"]
};

// 전형 단계가 바뀔 때 같은 항목을 중복 생성하지 않도록 기존 제목과 비교합니다.
export function buildStageChecklist(stage, applicationId, existingTasks = [], dueDate = "") {
  const existingTitles = new Set(existingTasks.map((task) => task.title));
  return (templates[stage] || [])
    .filter((title) => !existingTitles.has(title))
    .map((title) => ({
      id: crypto.randomUUID(),
      applicationId,
      title,
      category: stage,
      dueDate,
      completed: false,
      priority: stage === "필기전형" || stage === "면접전형" ? "high" : "normal",
      createdAt: new Date().toISOString()
    }));
}

export function getChecklistTemplates() {
  return templates;
}
