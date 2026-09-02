// 모든 API 에러 응답 형식을 한곳에서 통일합니다.
export function notFoundHandler(req, res, next) {
  const error = new Error(`경로를 찾을 수 없습니다: ${req.method} ${req.originalUrl}`);
  error.status = 404;
  next(error);
}

export function errorHandler(error, req, res, next) {
  const status = error.status || 500;
  res.status(status).json({
    message: error.message || "서버 오류가 발생했습니다."
  });
}
