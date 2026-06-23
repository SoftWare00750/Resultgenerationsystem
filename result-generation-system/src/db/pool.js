// src/db/pool.js
require("dotenv").config();
const { Pool } = require("pg");

/**
 * Repairs connection strings where the query string got concatenated
 * onto the path without a "?" separator, e.g.
 *   postgres://user:pass@host:5432/rgs_db_xzpwsslmode=require
 * -> postgres://user:pass@host:5432/rgs_db_xzpw?sslmode=require
 */
function sanitizeDatabaseUrl(raw) {
  return raw.trim().replace(/([^?&])(sslmode=)/, "$1?$2");
}

function createPool() {
  if (process.env.DATABASE_URL) {
    const fixedUrl = sanitizeDatabaseUrl(process.env.DATABASE_URL);

    let sslMode = "require";
    try {
      const url = new URL(fixedUrl);
      sslMode = url.searchParams.get("sslmode") || "require";
    } catch {
      // keep default
    }

    const sslConfig =
      sslMode === "disable"
        ? false
        : { rejectUnauthorized: false };

    return new Pool({
      connectionString: fixedUrl,
      ssl: sslConfig,
    });
  }

  return new Pool({
    host: process.env.PGHOST || "localhost",
    port: parseInt(process.env.PGPORT || "5432", 10),
    database: process.env.PGDATABASE || "rgs_db",
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    ssl: process.env.PGSSLMODE === "require"
      ? { rejectUnauthorized: false }
      : false,
  });
}

const pool = createPool();

pool.on("error", (err) => {
  console.error("Unexpected Postgres pool error", err.message);
});

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
};