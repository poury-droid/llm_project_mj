const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function canAnalyzeImageWithLlm(file) {
  return Boolean(process.env.OPENAI_API_KEY && file?.buffer && IMAGE_TYPES.has(file.mimetype));
}

export async function analyzeImageDocumentWithLlm({ file, documentType, ocrText = "" }) {
  if (!canAnalyzeImageWithLlm(file)) {
    return { ok: false, message: "OpenAI image analysis is not configured." };
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.ANALYSIS_OPENAI_MODEL || process.env.OCR_OPENAI_MODEL || "gpt-5.6-luna",
        input: [
          {
            role: "developer",
            content: [
              {
                type: "input_text",
                text: [
                  "You analyze Korean job-process documents from images.",
                  "Return only valid JSON. Do not wrap it in markdown.",
                  "Never guess. If a value is not explicitly visible or not clearly implied by a label, use an empty string, false, or an empty array.",
                  "Do not invent exam subjects. Fill subjects only when the image explicitly has labels such as 시험과목, 과목, 평가영역, 검사영역, or a clear section listing subjects.",
                  "Classify dates by their nearby label. Do not put a random visible date into deadline, writtenTestDate, interviewDate, or replyDeadline.",
                  "Use YYYY-MM-DD for dates. Use ISO-like YYYY-MM-DDTHH:mm:00.000Z only when date and time are both visible for interviewDate.",
                  "Preserve Korean text exactly where possible."
                ].join("\n")
              }
            ]
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: [
                  `documentType: ${documentType || "other"}`,
                  ocrText ? `OCR 참고 원문:\n${ocrText}` : "",
                  "이미지를 읽고 아래 스키마에 맞는 JSON만 반환하세요.",
                  JSON.stringify({
                    company: "string",
                    position: "string",
                    title: "string",
                    deadline: "YYYY-MM-DD or empty string",
                    stage: "서류전형|필기전형|면접전형|최종결과|empty string",
                    writtenTestDate: "YYYY-MM-DD or empty string",
                    interviewDate: "YYYY-MM-DDTHH:mm:00.000Z, YYYY-MM-DD, or empty string",
                    interviewTime: "HH:mm or empty string",
                    replyDeadline: "YYYY-MM-DD or empty string",
                    location: "string",
                    subjects: ["string"],
                    requiredDocuments: ["string"],
                    notes: ["string"],
                    replyRequired: false,
                    memo: "string"
                  })
                ].filter(Boolean).join("\n\n")
              },
              {
                type: "input_image",
                image_url: `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
                detail: "high"
              }
            ]
          }
        ]
      })
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { ok: false, message: payload.error?.message || "OpenAI image analysis failed." };
    }

    const analysis = normalizeAnalysis(parseJsonPayload(payload.output_text || extractTextFromResponse(payload)));
    return { ok: true, analysis };
  } catch (error) {
    return { ok: false, message: error.message || "OpenAI image analysis failed." };
  }
}

function extractTextFromResponse(payload) {
  return (payload.output || [])
    .flatMap((item) => item.content || [])
    .map((content) => content.text || "")
    .filter(Boolean)
    .join("\n");
}

function parseJsonPayload(text) {
  const cleaned = String(text || "").trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  return JSON.parse(match ? match[0] : cleaned);
}

export function normalizeAnalysis(value = {}) {
  return {
    company: stringValue(value.company),
    position: stringValue(value.position),
    roleOptions: Array.isArray(value.roleOptions) ? value.roleOptions.map(stringValue).filter(Boolean) : [],
    roleRequirements: value.roleRequirements && typeof value.roleRequirements === "object" ? value.roleRequirements : {},
    selectedRole: "",
    selectedRoleRequirements: {},
    title: stringValue(value.title),
    deadline: dateValue(value.deadline),
    stage: stringValue(value.stage),
    writtenTestDate: dateValue(value.writtenTestDate),
    interviewDate: combineInterviewDateTime(dateTimeValue(value.interviewDate), timeValue(value.interviewTime)),
    interviewTime: timeValue(value.interviewTime),
    replyDeadline: dateValue(value.replyDeadline),
    location: stringValue(value.location),
    subjects: arrayValue(value.subjects),
    requiredDocuments: arrayValue(value.requiredDocuments),
    notes: arrayValue(value.notes),
    replyRequired: Boolean(value.replyRequired),
    memo: stringValue(value.memo) || "OpenAI 이미지 분석 결과입니다. 저장 전에 원문과 대조해 주세요."
  };
}

function stringValue(value) {
  return typeof value === "string" ? value.trim() : "";
}

function arrayValue(value) {
  return Array.isArray(value) ? value.map(stringValue).filter(Boolean).slice(0, 12) : [];
}

function dateValue(value) {
  const text = stringValue(value);
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : "";
}

function dateTimeValue(value) {
  const text = stringValue(value);
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(text)) return text;
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  return "";
}

function timeValue(value) {
  const text = stringValue(value);
  return /^\d{2}:\d{2}$/.test(text) ? text : "";
}

function combineInterviewDateTime(date, time) {
  if (!date || !time || date.includes("T")) return date;
  return `${date}T${time}:00`;
}
