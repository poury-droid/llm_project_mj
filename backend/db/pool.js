// PostgreSQL 연결 풀과 공통 SQL 실행 함수를 제공합니다.
import "../config/env.js";
import pg from "pg";

const { Pool } = pg;

// DATABASE_URL이 있으면 하나의 연결 문자열을 사용하고,
// 없으면 PGHOST 등 개별 환경변수 또는 아래 기본값으로 접속합니다.
const connectionString = process.env.DATABASE_URL;

export const pool = new Pool(
  connectionString
    ? { connectionString }
    : {
        host: process.env.PGHOST || "localhost",
        port: Number(process.env.PGPORT || 5432),
        database: process.env.PGDATABASE || "job_process_assistant",
        user: process.env.PGUSER || "postgres",
        password: process.env.PGPASSWORD || "postgres"
      }
);

export async function query(text, params) {
  // 모든 Repository가 이 함수를 통해 SQL을 실행합니다.
  // $1, $2 형태의 파라미터를 사용해 SQL Injection을 예방합니다.
  return pool.query(text, params);
}

export async function withTransaction(callback) {
  // 여러 INSERT/UPDATE를 하나의 작업으로 묶습니다.
  // 중간에 하나라도 실패하면 전체 변경을 ROLLBACK합니다.
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
