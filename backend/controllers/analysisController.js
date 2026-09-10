// 업로드된 파일의 종류에 따라 분석 서비스 함수를 호출하는 Controller입니다.
import { analyzeFile as analyzeUploadedFile, analyzeInterviewNoticeMock, analyzeJobPostingMock } from "../services/analysisService.js";

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
  res.json(await analyzeUploadedFile({
    file: req.file,
    documentType: req.body.documentType || "other"
  }));
}
