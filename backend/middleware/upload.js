import multer from "multer";

const allowedMimeTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp"
]);

// 업로드 파일은 아직 디스크에 저장하지 않고 메모리에서만 분석합니다.
// 실제 파일 보관이 필요해지면 이 파일에서 storage 설정만 바꾸면 됩니다.
export const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter(req, file, callback) {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return callback(new Error("PDF, JPG, PNG, WEBP 파일만 업로드할 수 있습니다."));
    }
    callback(null, true);
  },
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});
