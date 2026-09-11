import tesseract from "tesseract.js";

const { recognize } = tesseract;

const OCR_SUPPORTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp"
]);

export function canRunOcr(mimeType) {
  return OCR_SUPPORTED_IMAGE_TYPES.has(mimeType);
}

export async function extractOcrText(file) {
  if (!file?.buffer) {
    return {
      status: "skipped",
      text: "",
      confidence: 0,
      message: "No file buffer was provided."
    };
  }

  if (!canRunOcr(file.mimetype)) {
    return {
      status: "skipped",
      text: "",
      confidence: 0,
      message: "OCR is currently available for image files only."
    };
  }

  if (process.env.OCR_PROVIDER !== "tesseract" && process.env.OPENAI_API_KEY) {
    const openaiResult = await extractOpenAiVisionText(file);
    if (openaiResult.status === "success") return openaiResult;
    if (process.env.OCR_PROVIDER === "openai") return openaiResult;
  }

  try {
    const result = await withTimeout(
      recognize(file.buffer, process.env.OCR_LANG || "kor+eng"),
      Number(process.env.OCR_TIMEOUT_MS || 60000),
      "로컬 OCR 시간이 초과되었습니다. 이미지 해상도를 낮추거나 Gemini API 키를 확인해 주세요."
    );
    const text = normalizeOcrText(result.data?.text || "");
    return {
      status: text ? "success" : "empty",
      text,
      confidence: Math.round(result.data?.confidence || 0),
      engine: "tesseract",
      message: text ? "" : "OCR finished but no readable text was found."
    };
  } catch (error) {
    return {
      status: "failed",
      text: "",
      confidence: 0,
      engine: "tesseract",
      message: error.message || "OCR failed."
    };
  }
}

function withTimeout(promise, timeoutMs, message) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function extractOpenAiVisionText(file) {
  if (!process.env.OPENAI_API_KEY) {
    return {
      status: "failed",
      text: "",
      confidence: 0,
      engine: "openai",
      message: "OPENAI_API_KEY is not configured."
    };
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OCR_OPENAI_MODEL || "gpt-5.6-luna",
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: [
                  "이미지에 보이는 모든 한글/영문 텍스트를 가능한 원문 그대로 추출하세요.",
                  "읽는 순서를 유지하고, 임의로 요약하거나 고치지 마세요.",
                  "표/목록은 줄바꿈으로 보존하세요.",
                  "출력은 추출 텍스트만 반환하세요."
                ].join("\n")
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
      return {
        status: "failed",
        text: "",
        confidence: 0,
        engine: "openai",
        message: payload.error?.message || "OpenAI Vision OCR failed."
      };
    }

    const text = normalizeOcrText(payload.output_text || extractTextFromResponse(payload));
    return {
      status: text ? "success" : "empty",
      text,
      confidence: text ? 95 : 0,
      engine: "openai",
      message: text ? "" : "OpenAI Vision OCR finished but no readable text was found."
    };
  } catch (error) {
    return {
      status: "failed",
      text: "",
      confidence: 0,
      engine: "openai",
      message: error.message || "OpenAI Vision OCR failed."
    };
  }
}

function extractTextFromResponse(payload) {
  return (payload.output || [])
    .flatMap((item) => item.content || [])
    .map((content) => content.text || "")
    .filter(Boolean)
    .join("\n");
}

function normalizeOcrText(text) {
  return text
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
