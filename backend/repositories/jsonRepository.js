import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, "..", "data", "db.json");

// 지금은 JSON 파일을 DB처럼 사용합니다. 나중에 SQLite/PostgreSQL로 바꿀 때 이 파일만 교체하면 됩니다.
export async function readDb() {
  const content = await fs.readFile(dbPath, "utf-8");
  return JSON.parse(content);
}

export async function writeDb(data) {
  await fs.writeFile(dbPath, JSON.stringify(data, null, 2), "utf-8");
}
