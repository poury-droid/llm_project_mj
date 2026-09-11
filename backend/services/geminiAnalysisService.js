import { normalizeAnalysis } from "./llmAnalysisService.js";

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);

export function canAnalyzeImageWithGemini(file) {
  return Boolean(process.env.GEMINI_API_KEY && file?.buffer && IMAGE_TYPES.has(file.mimetype));
}

export async function analyzeImageDocumentWithGemini({ file, documentType, ocrText = "" }) {
  if (!canAnalyzeImageWithGemini(file)) return { ok: false, message: "GEMINI_API_KEY가 설정되지 않았습니다." };

  const schema = {
    company: "string", position: "string", title: "string", deadline: "YYYY-MM-DD or empty string",
    stage: "서류전형|필기전형|면접전형|최종결과|empty string",
    writtenTestDate: "YYYY-MM-DD or empty string", interviewDate: "YYYY-MM-DD or empty string",
    interviewTime: "HH:mm or empty string", replyDeadline: "YYYY-MM-DD or empty string",
    location: "string", subjects: ["string"], requiredDocuments: ["string"], notes: ["string"],
    replyRequired: false, memo: "string"
  };
  const prompt = [
    "한국어 채용공고·필기시험·면접 안내 이미지에서 정보를 추출하세요.",
    "반드시 JSON만 반환하세요. 이미지에 명확히 보이지 않는 값은 빈 문자열 또는 빈 배열로 두세요.",
    "날짜는 라벨 주변의 날짜만 사용하고 임의로 추측하지 마세요.",
    "면접일시가 날짜와 시간이 분리되어 있으면 interviewDate와 interviewTime에 각각 넣으세요.",
    "면접 장소는 장소, 면접장소, 면접 장소, 위치, 고사장, 시험장 라벨의 값을 넣으세요.",
    `자료 종류: ${documentType || "other"}`,
    ocrText ? `참고 OCR 원문:\n${ocrText}` : "",
    `반환 JSON 형식:\n${JSON.stringify(schema)}`
  ].filter(Boolean).join("\n\n");

  try {
    const model = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
      signal: AbortSignal.timeout(Number(process.env.GEMINI_TIMEOUT_MS || 45000)),
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: file.mimetype, data: file.buffer.toString("base64") } }
          ]
        }],
        generationConfig: { responseMimeType: "application/json", temperature: 0, maxOutputTokens: 1200 }
      })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) return { ok: false, message: payload.error?.message || "Gemini 이미지 분석에 실패했습니다." };
    const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("") || "";
    const match = text.match(/\{[\s\S]*\}/);
    return { ok: true, analysis: normalizeAnalysis(JSON.parse(match ? match[0] : text)) };
  } catch (error) {
    return { ok: false, message: error.message || "Gemini 이미지 분석에 실패했습니다." };
  }
}
