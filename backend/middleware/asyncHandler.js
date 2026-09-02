// Express의 async 함수에서 발생한 에러를 공통 에러 처리기로 넘겨줍니다.
export function asyncHandler(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}
