// Node 실행 환경에 따라 .env를 자동으로 읽어 process.env에 등록합니다.
// 배포 환경에서 이미 주입된 환경변수는 덮어쓰지 않습니다.
import fs from "fs";
import path from "path";

const envPath = path.resolve(process.cwd(), ".env");

if (typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile(envPath);
  } catch {
    // 운영 서버에서 .env 없이 플랫폼 환경변수를 사용하는 경우는 정상입니다.
  }
} else if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator < 1) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^(['"])(.*)\1$/, "$2");
    if (!process.env[key]) process.env[key] = value;
  }
}
