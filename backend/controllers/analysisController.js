import { analyzeFileMock, analyzeInterviewNoticeMock, analyzeJobPostingMock } from "../services/analysisService.js";

export async function analyzeJobPosting(req, res) {
  const fileName = req.file?.originalname || req.body?.fileName;
  res.json(analyzeJobPostingMock(fileName));
}

export async function analyzeInterviewNotice(req, res) {
  const fileName = req.file?.originalname || req.body?.fileName;
  res.json(analyzeInterviewNoticeMock(fileName));
}

export async function analyzeFile(req, res) {
  if (!req.file) return res.status(400).json({ message: "분석할 파일을 선택하세요." });
  res.json(analyzeFileMock({
    fileName: req.file.originalname,
    mimeType: req.file.mimetype,
    documentType: req.body.documentType || "other"
  }));
}
