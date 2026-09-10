import { extractOcrText } from "./ocrService.js";
import { analyzeImageDocumentWithLlm, canAnalyzeImageWithLlm } from "./llmAnalysisService.js";
import { analyzeImageDocumentWithGemini, canAnalyzeImageWithGemini } from "./geminiAnalysisService.js";

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
    stage: "서류전형",
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

export async function analyzeFile({ file, documentType }) {
  const fileName = file.originalname;
  const mimeType = file.mimetype;
  const fileType = mimeType === "application/pdf" ? "pdf" : "image";
  const ocr = await extractOcrText(file);
  let analysis;

  if (documentType === "interview" || documentType === "message") {
    analysis = analyzeInterviewNoticeMock(fileName);
  } else if (documentType === "written-test") {
    analysis = analyzeWrittenTestMock(fileName);
  } else {
    analysis = analyzeJobPostingMock(fileName);
  }
  if (canAnalyzeImageWithGemini(file)) {
    const geminiResult = await analyzeImageDocumentWithGemini({ file, documentType, ocrText: ocr.text });
    if (geminiResult.ok) {
      analysis = {
        ...analysis,
        ...geminiResult.analysis,
        fileName,
        pdfFileName: fileName,
        ocrText: ocr.text,
        ocrStatus: ocr.status,
        ocrConfidence: ocr.confidence,
        ocrEngine: ocr.engine || "",
        ocrMessage: ocr.message || "",
        analysisEngine: "gemini"
      };
    } else {
      analysis = {
        ...mergeOcrHints(analysis, ocr, documentType, fileName),
        analysisEngine: "rules",
        analysisMessage: `Gemini 분석을 사용할 수 없어 OCR 결과로 표시합니다: ${geminiResult.message}`
      };
    }
  } else if (canAnalyzeImageWithLlm(file)) {
    const llmResult = await analyzeImageDocumentWithLlm({ file, documentType, ocrText: ocr.text });
    if (llmResult.ok) {
      analysis = {
        ...analysis,
        ...llmResult.analysis,
        fileName,
        pdfFileName: fileName,
        ocrText: ocr.text,
        ocrStatus: ocr.status,
        ocrConfidence: ocr.confidence,
        ocrEngine: ocr.engine || "",
        ocrMessage: ocr.message || "",
        analysisEngine: "openai"
      };
    } else {
      analysis = {
        ...mergeOcrHints(analysis, ocr, documentType, fileName),
        analysisEngine: "rules",
        analysisMessage: `OpenAI 분석을 사용할 수 없어 OCR 결과로 표시합니다: ${llmResult.message}`
      };
    }
  } else {
    analysis = {
      ...mergeOcrHints(analysis, ocr, documentType, fileName),
      analysisEngine: "rules"
    };
  }

  return {
    fileType,
    documentType,
    ocr,
    analysis,
    suggestedTasks: buildSuggestedTasks(analysis, documentType)
  };
}

export const analyzeFileMock = analyzeFile;

function parseOcrAnalysisConservatively(text, documentType) {
  const lines = getUsefulLines(text);
  const stage = inferStageConservatively(text, documentType);
  const interviewSchedule = findInterviewScheduleConservatively(lines);
  const interviewDate = interviewSchedule.date || findDateByLabels(lines, ["면접일", "면접 일시", "면접일시", "면접", "인터뷰"]);
  const writtenTestDate = findDateByLabels(lines, ["필기일", "필기 일시", "필기시험", "시험일", "시험 일시", "전형일"]);
  const deadline = findDateByLabels(lines, ["마감일", "접수마감", "접수 마감", "지원마감", "지원 마감", "제출기한", "제출 기한"]);
  const replyDeadline = findDateByLabels(lines, ["회신기한", "회신 기한", "응답기한", "응답 기한", "참석여부", "참석 여부"]);
  const time = interviewSchedule.time || extractTimeNearLabels(lines, ["면접", "필기", "시험", "일시", "시간"]);

  return {
    company: findLabeledValueConservatively(lines, ["회사명", "회사", "기관명", "기관", "기업명", "기업"]),
    position: findLabeledValueConservatively(lines, ["직무", "직군", "분야", "모집분야", "채용분야", "지원분야"]),
    roleOptions: [],
    roleRequirements: {},
    selectedRole: "",
    selectedRoleRequirements: {},
    title: inferTitleConservatively(lines, documentType),
    deadline,
    stage,
    writtenTestDate: documentType === "written-test" ? writtenTestDate : "",
    interviewDate: interviewDate ? combineDateAndTime(interviewDate, time) : "",
    interviewTime: interviewDate ? time : "",
    replyDeadline,
    location: findLocationConservatively(lines),
    subjects: findSubjectsConservatively(lines),
    requiredDocuments: findDocumentsConservatively(lines),
    notes: findNotesConservatively(lines),
    replyRequired: Boolean(replyDeadline) || /(회신|참석\s*여부|응답|답장)/.test(text),
    memo: "OCR 원문에서 명확히 확인되는 항목만 자동 입력했습니다. 빈 항목은 직접 확인해 주세요."
  };
}

function findInterviewScheduleConservatively(lines) {
  const dateLabels = ["면접일시", "면접 일시", "면접일", "면접 날짜", "면접날짜", "인터뷰"];
  const timeLabels = ["면접시간", "면접 시간", "면접시각", "면접 시각", "일시", "시간"];
  for (let index = 0; index < lines.length; index += 1) {
    const window = lines.slice(index, index + 3).join(" ");
    const hasInterviewLabel = dateLabels.some((label) => normalizeKorean(window).includes(normalizeKorean(label)))
      || normalizeKorean(window).includes("면접");
    if (!hasInterviewLabel) continue;
    const date = extractDatesStrict(window)[0] || "";
    const time = extractTimeStrict(window) || (timeLabels.some((label) => normalizeKorean(window).includes(normalizeKorean(label))) ? extractTimeStrict(window) : "");
    if (date || time) return { date, time };
  }
  return { date: "", time: "" };
}

function findLocationConservatively(lines) {
  const labeled = findLabeledValueConservatively(lines, ["면접장소", "면접 장소", "면접 장소", "장소", "위치", "고사장", "시험장", "주소"]);
  if (labeled) return labeled;
  const locationLine = lines.find((line) => /면접\s*(장소|위치)|고사장|시험장|주소/.test(line));
  if (!locationLine) return "";
  return cleanupValue(locationLine.replace(/^.*?(면접\s*(장소|위치)|고사장|시험장|주소)\s*[:：-]?\s*/u, ""));
}

function inferStageConservatively(text, documentType) {
  if (documentType === "interview" || /면접|인터뷰/.test(text)) return "면접전형";
  if (documentType === "written-test" || /필기|시험|NCS|인적성/.test(text)) return "필기전형";
  if (documentType === "document-screening" || /서류/.test(text)) return "서류전형";
  return "";
}

function inferTitleConservatively(lines, documentType) {
  const explicit = lines.find((line) => /(안내|공고|채용|면접|필기|시험|전형|합격)/.test(line));
  if (explicit) return explicit;
  if (documentType === "interview") return "면접 안내";
  if (documentType === "written-test") return "필기시험 안내";
  if (documentType === "job-posting") return "채용공고";
  return "";
}

function findDateByLabels(lines, labels) {
  for (const line of lines) {
    if (!labels.some((label) => normalizeKorean(line).includes(normalizeKorean(label)))) continue;
    const [date] = extractDatesStrict(line);
    if (date) return date;
  }
  return "";
}

function extractTimeNearLabels(lines, labels) {
  for (const line of lines) {
    if (!labels.some((label) => normalizeKorean(line).includes(normalizeKorean(label)))) continue;
    const time = extractTimeStrict(line);
    if (time) return time;
  }
  return "";
}

function findLabeledValueConservatively(lines, labels) {
  for (const line of lines) {
    for (const label of labels) {
      const pattern = new RegExp(`${escapeRegExp(label)}\\s*[:：-]\\s*(.+)`);
      const match = line.match(pattern);
      if (match?.[1]) return cleanupValue(match[1]);
    }
  }
  return "";
}

function findSubjectsConservatively(lines) {
  const subjectLine = lines.find((line) => /(시험과목|과목|평가과목|검사영역)\s*[:：-]/.test(line));
  if (!subjectLine) return [];
  const value = cleanupValue(subjectLine.replace(/^(시험과목|과목|평가과목|검사영역)\s*[:：-]\s*/, ""));
  return value
    .split(/[,/·ㆍ]/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 2)
    .slice(0, 8);
}

function findDocumentsConservatively(lines) {
  const documentLines = lines.filter((line) => /(준비물|지참|제출서류|제출 서류|서류)\s*[:：-]/.test(line));
  return Array.from(new Set(documentLines.flatMap((line) => {
    const value = cleanupValue(line.replace(/^(준비물|지참물|지참|제출서류|제출 서류|서류)\s*[:：-]\s*/, ""));
    return value.split(/[,/·ㆍ]/).map((item) => item.trim()).filter((item) => item.length >= 2);
  }))).slice(0, 8);
}

function findNotesConservatively(lines) {
  return lines
    .filter((line) => /(유의|주의|안내|문의|도착|입실|불가|준비|지참)/.test(line))
    .slice(0, 8);
}

function extractDatesStrict(text) {
  const candidates = new Set();
  const patterns = [
    /(\d{4})\s*[.\-/년]\s*(\d{1,2})\s*[.\-/월]\s*(\d{1,2})\s*(?:일)?/g,
    /(\d{2})\s*[.\-/년]\s*(\d{1,2})\s*[.\-/월]\s*(\d{1,2})\s*(?:일)?/g
  ];

  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const year = Number(match[1]) < 100 ? 2000 + Number(match[1]) : Number(match[1]);
      const month = Number(match[2]);
      const day = Number(match[3]);
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        candidates.add(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
      }
    }
  }

  return Array.from(candidates);
}

function extractTimeStrict(text) {
  const meridiemMatch = text.match(/(오전|오후)\s*(\d{1,2})\s*(?::|시)?\s*(\d{1,2})?/);
  if (meridiemMatch) {
    let hour = Number(meridiemMatch[2]);
    const minute = Number(meridiemMatch[3] || 0);
    if (meridiemMatch[1] === "오후" && hour < 12) hour += 12;
    if (meridiemMatch[1] === "오전" && hour === 12) hour = 0;
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  }

  const timeMatch = text.match(/\b([01]?\d|2[0-3])\s*(?::|시)\s*([0-5]\d)?/);
  if (!timeMatch) return "";
  return `${String(Number(timeMatch[1])).padStart(2, "0")}:${String(Number(timeMatch[2] || 0)).padStart(2, "0")}`;
}

function normalizeKorean(value) {
  return String(value || "").replace(/\s/g, "").toLowerCase();
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function mergeOcrHints(analysis, ocr, documentType, fileName) {
  const ocrText = ocr?.text || "";
  const common = {
    fileName,
    pdfFileName: fileName,
    ocrText,
    ocrStatus: ocr?.status || "skipped",
    ocrConfidence: ocr?.confidence || 0,
    ocrEngine: ocr?.engine || "",
    ocrMessage: ocr?.message || ""
  };

  if (!ocrText) return { ...analysis, ...common };

  const parsed = parseOcrAnalysisConservatively(ocrText, documentType);
  return {
    ...analysis,
    ...parsed,
    ...common,
    memo: [
      parsed.memo,
      `OCR confidence: ${common.ocrConfidence}%`
    ].filter(Boolean).join("\n")
  };
}

function parseOcrAnalysis(text, documentType) {
  const lines = getUsefulLines(text);
  const fallbackDate = extractDates(text)[0] || "";
  const eventTime = extractTime(text);
  const interviewDate = findDateNear(text, ["면접", "인터뷰", "면접전형"]);
  const writtenTestDate = findDateNear(text, ["필기", "시험", "평가", "인적성", "NCS"]);

  return {
    company: inferCompany(lines),
    position: inferPosition(lines),
    roleOptions: [],
    roleRequirements: {},
    selectedRole: "",
    selectedRoleRequirements: {},
    title: inferTitle(lines, documentType),
    deadline: findDateNear(text, ["마감", "접수", "지원", "제출", "등록"]) || (documentType === "job-posting" ? fallbackDate : ""),
    stage: inferStage(text, documentType),
    writtenTestDate: writtenTestDate || (documentType === "written-test" ? fallbackDate : ""),
    interviewDate: interviewDate ? combineDateAndTime(interviewDate, eventTime) : "",
    interviewTime: eventTime,
    replyDeadline: findDateNear(text, ["회신", "참석", "응답", "답장", "참가"]),
    location: inferLocation(lines),
    subjects: inferSubjects(text),
    requiredDocuments: inferRequiredDocuments(text),
    notes: inferNotes(lines),
    replyRequired: inferReplyRequired(text),
    memo: "OCR 원문을 기준으로 자동 분석했습니다. 정확하지 않은 항목은 저장 전에 수정하세요."
  };
}

function inferTitle(lines, documentType) {
  const preferred = lines.find((line) => /(채용|공고|안내|면접|필기|시험|전형|서류|합격)/.test(line));
  if (preferred) return preferred;
  if (lines[0]) return lines[0];
  if (documentType === "interview") return "면접 안내";
  if (documentType === "written-test") return "필기시험 안내";
  return "채용 자료 분석";
}

function inferStage(text, documentType) {
  if (documentType === "interview" || /면접|인터뷰/.test(text)) return "면접전형";
  if (documentType === "written-test" || /필기|NCS|인적성|시험/.test(text)) return "필기전형";
  if (documentType === "document-screening" || /서류/.test(text)) return "서류전형";
  return "서류전형";
}

function inferCompany(lines) {
  const labeled = findLabeledValue(lines, ["회사", "기업", "기관", "공사", "공단"]);
  if (labeled) return labeled;
  const companyLine = lines.find((line) => /(주식회사|공사|공단|재단|은행|대학교|병원|센터|연구원|협회|그룹|주\))/.test(line));
  return cleanupValue(companyLine || "");
}

function inferPosition(lines) {
  return findLabeledValue(lines, ["직무", "직군", "분야", "모집분야", "채용분야", "지원분야"]);
}

function inferLocation(lines) {
  return findLabeledValue(lines, ["장소", "위치", "면접장", "고사장", "주소"]);
}

function inferSubjects(text) {
  const subjects = [];
  for (const subject of ["NCS", "인적성", "직무수행능력", "전공", "논술", "한국사", "영어"]) {
    if (text.includes(subject)) subjects.push(subject);
  }
  return Array.from(new Set(subjects));
}

function inferRequiredDocuments(text) {
  const documents = [];
  const rules = [
    ["신분증", /신분증|주민등록증|운전면허증|여권/],
    ["수험표", /수험표|응시표/],
    ["졸업증명서", /졸업.?증명/],
    ["성적증명서", /성적.?증명/],
    ["자격증 사본", /자격증/],
    ["경력증명서", /경력.?증명/],
    ["포트폴리오", /포트폴리오/]
  ];
  for (const [name, pattern] of rules) {
    if (pattern.test(text)) documents.push(name);
  }
  return documents;
}

function inferNotes(lines) {
  return lines
    .filter((line) => /(유의|주의|준비|지참|안내|문의|도착|입실|불가)/.test(line))
    .slice(0, 6);
}

function inferReplyRequired(text) {
  return /(회신|참석\s*여부|응답|답장|참가\s*여부)/.test(text);
}

function findLabeledValue(lines, labels) {
  for (const line of lines) {
    for (const label of labels) {
      const pattern = new RegExp(`${label}\\s*[:：]?\\s*(.+)`);
      const match = line.match(pattern);
      if (match?.[1]) return cleanupValue(match[1]);
    }
  }
  return "";
}

function cleanupValue(value) {
  return String(value || "")
    .replace(/^[\s:：\-]+/, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function extractTime(text) {
  const meridiemMatch = text.match(/(오전|오후)\s*(\d{1,2})\s*(?::|시)?\s*(\d{1,2})?/);
  if (meridiemMatch) {
    let hour = Number(meridiemMatch[2]);
    const minute = Number(meridiemMatch[3] || 0);
    if (meridiemMatch[1] === "오후" && hour < 12) hour += 12;
    if (meridiemMatch[1] === "오전" && hour === 12) hour = 0;
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  }

  const timeMatch = text.match(/\b([01]?\d|2[0-3])[:시]\s*([0-5]\d)?/);
  if (!timeMatch) return "";
  return `${String(Number(timeMatch[1])).padStart(2, "0")}:${String(Number(timeMatch[2] || 0)).padStart(2, "0")}`;
}

function combineDateAndTime(date, time) {
  if (!date || !time) return date || "";
  return `${date}T${time}:00.000Z`;
}

function getUsefulLines(text) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length >= 4 && !/^[\W_]+$/.test(line));
}

function extractDates(text) {
  const candidates = new Set();
  const patterns = [
    /(\d{4})[.\-/년\s]+(\d{1,2})[.\-/월\s]+(\d{1,2})/g,
    /(\d{2})[.\-/년\s]+(\d{1,2})[.\-/월\s]+(\d{1,2})/g
  ];

  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const year = Number(match[1]) < 100 ? 2000 + Number(match[1]) : Number(match[1]);
      const month = Number(match[2]);
      const day = Number(match[3]);
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        candidates.add(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
      }
    }
  }

  return Array.from(candidates);
}

function findDateNear(text, keywords) {
  const lines = getUsefulLines(text);
  for (const line of lines) {
    if (keywords.some((keyword) => line.includes(keyword))) {
      const [date] = extractDates(line);
      if (date) return date;
    }
  }
  return "";
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

  if (!tasks.length) {
    const dueDate = analysis.deadline || "";
    const stage = analysis.stage || "서류전형";
    const defaults = stage === "면접전형"
      ? ["면접 일시·장소 확인", "예상 질문 준비"]
      : stage === "필기전형"
        ? ["필기시험 일정 확인", "시험 장소와 준비물 확인"]
        : ["지원자격 확인", "지원서 및 자기소개서 준비", "제출 전 최종검토"];
    tasks.push(...defaults.map((title, index) => ({
      title,
      category: stage,
      dueDate,
      priority: index === defaults.length - 1 ? "high" : "normal",
      defaultAction: "add"
    })));
  }

  return tasks;
}
