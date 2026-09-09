import app from "./app.js";
import { ensureDatabase } from "./db/schema.js";

const port = process.env.PORT || 4000;

// 서버가 요청을 받기 전에 필요한 테이블을 먼저 보장합니다.
// 테이블이 
// 없으면 서버를 시작하지 않으므로 초기 실행 순서가 안전합니다.
await ensureDatabase();

app.listen(port, () => {
  console.log(`Backend API server is running on http://localhost:${port}`);
});
