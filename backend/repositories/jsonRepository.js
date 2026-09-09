// 과거 JSON 저장소와의 호환 또는 마이그레이션에 사용하는 파일 저장 유틸입니다.
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, "..", "data", "db.json");

// 레거시 JSON 저장소입니다. 현재 운영 API는 PostgreSQL Repository를 사용하며,
// 이 파일과 db.json은 기존 데이터 확인/이전 용도로만 남겨둡니다.
export async function readDb() {
  const content = await fs.readFile(dbPath, "utf-8");
  return JSON.parse(content);
}

export async function writeDb(data) {
  await fs.writeFile(dbPath, JSON.stringify(data, null, 2), "utf-8");
}
