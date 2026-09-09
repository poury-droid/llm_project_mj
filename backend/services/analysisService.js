export function analyzeJobPostingMock(fileName = "uploaded.pdf") {
  return {
    company: "한국OO공사",
    position: "",
    roleOptions: ["일반행정", "경영지원", "전산", "기술행정"],
    roleRequirements: {
      일반행정: {
        eligibility: ["TOEIC 700점 이상"],
        preferred: ["한국사능력검정시험 1급", "컴퓨터활용능력 1급"],
        bonusItems: [{ name: "컴퓨터활용능력 1급", points: 3, sourceText: "컴퓨터활용능력 1급 보유자 +3점" }],
        missingCheckpoints: ["어학성적 유효기간"]
      },
      경영지원: {
        eligibility: ["TOEIC 700점 이상"],
        preferred: ["전산회계", "ERP 정보관리사"],
        bonusItems: [],
        missingCheckpoints: ["회계 관련 자격증"]
      },
      전산: {
        eligibility: ["정보처리기사 또는 관련 전공"],
        preferred: ["SQLD", "정보보안기사"],
        bonusItems: [{ name: "정보처리기사", points: 5, sourceText: "정보처리기사 +5점" }],
        missingCheckpoints: ["전산 직무 필수 자격"]
      },
      기술행정: {
        eligibility: ["관련 분야 기사 자격"],
        preferred: ["산업안전기사"],
        bonusItems: [],
        missingCheckpoints: ["기사 자격증"]
      }
    },
    title: "2026년 하반기 신입직원 공개채용",
    deadline: "2026-09-14",
    stage: "지원준비",
    pdfFileName: fileName,
    writtenTestDate: "2026-10-05",
    interviewDate: "",
    replyDeadline: "",
    location: "",
    subjects: ["NCS", "경제학"],
    requiredDocuments: ["성적증명서", "자격증 사본", "경력증명서"],
    notes: ["지원 직무를 선택한 뒤 해당 직무 기준으로 자격요건과 가점을 확인하세요."],
    replyRequired: false,
    memo: "mock 분석 결과입니다. 저장 전에 직무와 항목을 확인하세요."
  };
}

export function analyzeInterviewNoticeMock(fileName = "interview.png") {
  return {
    fileName,
    company: "OO연구원",
    position: "연구행정",
    roleOptions: ["연구행정"],
    title: "면접 전형 안내",
    deadline: "2026-10-15",
    stage: "면접전형",
    writtenTestDate: "",
    interviewDate: "2026-10-20T14:00:00.000Z",
    interviewTime: "14:00",
    location: "서울 OO센터",
    replyDeadline: "2026-10-15",
    subjects: [],
    requiredDocuments: ["졸업증명서", "성적증명서"],
    notes: ["면접 장소와 입실 시간을 확인하세요."],
    replyRequired: true,
    memo: "mock 이미지 분석 결과입니다."
  };
}

export function analyzeWrittenTestMock(fileName = "written-test.png") {
  return {
    fileName,
    company: "서울OO공단",
    position: "행정",
    roleOptions: ["행정"],
    title: "필기시험 안내",
    deadline: "2026-09-05",
    stage: "필기전형",
    writtenTestDate: "2026-09-26",
    interviewDate: "",
    replyDeadline: "",
    location: "서울 OO고등학교",
    subjects: ["NCS 의사소통", "NCS 수리", "행정학"],
    requiredDocuments: ["수험표", "신분증"],
    notes: ["입실 마감 시간과 고사장 교통편을 확인하세요."],
    replyRequired: false,
    memo: "mock 필기시험 안내 분석 결과입니다."
  };
}

export function analyzeFileMock({ fileName, mimeType, documentType }) {
  const fileType = mimeType === "application/pdf" ? "pdf" : "image";
  let analysis;

  if (documentType === "interview" || documentType === "message") {
    analysis = analyzeInterviewNoticeMock(fileName);
  } else if (documentType === "written-test") {
    analysis = analyzeWrittenTestMock(fileName);
  } else {
    analysis = analyzeJobPostingMock(fileName);
  }

  return {
    fileType,
    documentType,
    analysis,
    suggestedTasks: buildSuggestedTasks(analysis, documentType)
  };
}

export function buildSuggestedTasks(analysis, documentType) {
  const tasks = [];
  if (analysis.replyRequired && analysis.replyDeadline) {
    tasks.push({
      title: "면접 참석 여부 회신",
      category: "회신",
      dueDate: analysis.replyDeadline,
      priority: "high",
      defaultAction: "add"
    });
  }

  for (const document of analysis.requiredDocuments || []) {
    tasks.push({
      title: `${document} 준비`,
      category: "서류",
      dueDate: analysis.replyDeadline || analysis.deadline || "",
      priority: documentType === "interview" ? "high" : "normal",
      defaultAction: "add"
    });
  }

  if (analysis.interviewDate) {
    tasks.push(
      { title: "면접 장소 확인", category: "면접전형", dueDate: analysis.interviewDate.slice(0, 10), priority: "normal", defaultAction: "add" },
      { title: "교통편 확인", category: "면접전형", dueDate: analysis.interviewDate.slice(0, 10), priority: "normal", defaultAction: "add" },
      { title: "예상 질문 준비", category: "면접전형", dueDate: analysis.interviewDate.slice(0, 10), priority: "high", defaultAction: "add" }
    );
  }

  if (analysis.writtenTestDate) {
    tasks.push(
      { title: "필기시험 날짜 확인", category: "필기전형", dueDate: analysis.writtenTestDate, priority: "high", defaultAction: "add" },
      { title: "수험표 확인", category: "필기전형", dueDate: analysis.writtenTestDate, priority: "high", defaultAction: "add" }
    );
  }

  return tasks;
}
