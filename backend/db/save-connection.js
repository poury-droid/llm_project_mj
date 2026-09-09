import fs from "node:fs";

// Use only the connection explicitly set in this terminal.
const connectionString = process.env.DATABASE_URL?.trim();
try {
  if (!connectionString) throw new Error("DATABASE_URL is not set in this terminal.");
  const url = new URL(connectionString);
  if (!["postgres:", "postgresql:"].includes(url.protocol) || !url.hostname || !url.password) {
    throw new Error("A complete PostgreSQL connection URL is required.");
  }
  if (decodeURIComponent(url.password).includes("[YOUR-PASSWORD]")) {
    throw new Error("Replace the password placeholder first.");
  }
  if (/[\r\n"']/.test(connectionString)) {
    throw new Error("The connection URL contains unescaped characters.");
  }
  const file = new URL("../.env.local", import.meta.url);
  const existing = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  const lines = existing.split(/\r?\n/).filter((line) => !/^\s*(?:export\s+)?DATABASE_URL\s*=/.test(line));
  while (lines.length && !lines.at(-1).trim()) lines.pop();
  lines.push(`DATABASE_URL="${connectionString}"`);
  fs.writeFileSync(file, `${lines.join("\n")}\n`, { mode: 0o600 });
  console.log("Connection saved to backend/.env.local (excluded from Git).");
} catch (error) {
  // URL parser errors can contain credentials, so do not print their messages.
  console.error(error.code === "ERR_INVALID_URL" ? "Invalid connection URL." : error.message);
  process.exitCode = 1;
}
