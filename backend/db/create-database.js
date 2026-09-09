// PostgreSQL 서버에 대상 데이터베이스가 없을 때 한 번 실행하는 초기화 스크립트입니다.
import "../config/env.js";
import pg from "pg";

const { Client } = pg;

const DEFAULT_DATABASE = "job_process_assistant";
const DEFAULT_MAINTENANCE_DATABASE = "postgres";

function getTargetConfig() {
  // CREATE DATABASE는 대상 DB가 아니라 관리자용 postgres DB에 접속해서 실행합니다.
  if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);
    const database = decodeURIComponent(url.pathname.replace(/^\//, "")) || DEFAULT_DATABASE;
    url.pathname = `/${process.env.PGMAINTENANCE_DATABASE || DEFAULT_MAINTENANCE_DATABASE}`;
    return {
      database,
      adminConfig: {
        connectionString: url.toString()
      }
    };
  }

  const database = process.env.PGDATABASE || DEFAULT_DATABASE;
  return {
    database,
    adminConfig: {
      host: process.env.PGHOST || "localhost",
      port: Number(process.env.PGPORT || 5432),
      database: process.env.PGMAINTENANCE_DATABASE || DEFAULT_MAINTENANCE_DATABASE,
      user: process.env.PGUSER || "postgres",
      password: process.env.PGPASSWORD || "postgres"
    }
  };
}

function quoteIdentifier(identifier) {
  // DB 이름을 식별자로 안전하게 감싸 CREATE DATABASE 쿼리에 사용합니다.
  return `"${identifier.replaceAll('"', '""')}"`;
}

async function createDatabase() {
  const { database, adminConfig } = getTargetConfig();
  const client = new Client(adminConfig);

  await client.connect();
  try {
    // 이미 있으면 재실행해도 실패하지 않도록 먼저 존재 여부를 확인합니다.
    const result = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [database]);
    if (result.rowCount > 0) {
      console.log(`PostgreSQL database already exists: ${database}`);
      return;
    }

    await client.query(`CREATE DATABASE ${quoteIdentifier(database)}`);
    console.log(`PostgreSQL database created: ${database}`);
  } finally {
    await client.end();
  }
}

createDatabase().catch((error) => {
  console.error("Failed to create PostgreSQL database.");
  if (error.code) console.error(`Code: ${error.code}`);
  if (error.message) console.error(error.message);
  if (Array.isArray(error.errors)) {
    for (const cause of error.errors) {
      console.error(cause.message);
    }
  }
  process.exitCode = 1;
});
