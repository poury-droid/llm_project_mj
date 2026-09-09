// Read-only check of the configured remote database; never prints credentials.
import "../config/env.js";
import pg from "pg";

let client;
try {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw Object.assign(new Error(), { code: "DATABASE_URL_MISSING" });
  const url = new URL(connectionString);
  if (!["postgres:", "postgresql:"].includes(url.protocol)) {
    throw Object.assign(new Error(), { code: "INVALID_DATABASE_URL" });
  }
  if (decodeURIComponent(url.password).includes("[YOUR-PASSWORD]")) {
    throw Object.assign(new Error(), { code: "PASSWORD_PLACEHOLDER_REMAINS" });
  }
  console.log(`Database host: ${url.hostname}`);
  client = new pg.Client({ connectionString, connectionTimeoutMillis: 10000, query_timeout: 10000 });
  await client.connect();
  await client.query("BEGIN READ ONLY");
  const result = await client.query(
    "SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public' ORDER BY tablename"
  );
  await client.query("ROLLBACK");
  console.log("Database connection OK (read-only check).");
  console.log(`Public tables: ${result.rows.map((row) => row.tablename).join(", ") || "(none)"}`);
} catch (error) {
  console.error(`Database check failed. Code: ${error.code || "CONNECTION_ERROR"}`);
  process.exitCode = 1;
} finally {
  if (client) await client.end();
}
