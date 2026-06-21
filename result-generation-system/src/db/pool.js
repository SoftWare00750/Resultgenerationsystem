// src/db/pool.js
require("dotenv").config();
const { Pool } = require("pg");

// Repairs connection strings where the query string got concatenated
// onto the path without a "?" separator, e.g.
//   postgres://user:pass@host:5432/rgs_db_xzpwsslmode=require
// -> postgres://user:pass@host:5432/rgs_db_xzpw?sslmode=require
function sanitizeDatabaseUrl(raw) {
  return raw.replace(/([^?&])(sslmode=)/, "$1?$2");
}

function createPool() {
  if (process.env.DATABASE_URL) {
    const fixedUrl = sanitizeDatabaseUrl(process.env.DATABASE_URL.trim());
    const url = new URL(fixedUrl);

    const sslMode = url.searchParams.get("sslmode");

    const config = {
      host: url.hostname,
      port: url.port ? parseInt(url.port, 10) : 5432,
      database: decodeURIComponent(url.pathname.replace(/^\//, "")),
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
    };

    if (sslMode === "require" || sslMode === "verify-ca" || sslMode === "verify-full") {
      config.ssl = { rejectUnauthorized: sslMode === "verify-full" };
    } else if (sslMode === "disable" || sslMode === "allow" || sslMode === "prefer") {
      config.ssl = false;
    }

    return new Pool(config);
  }

  return new Pool({
    host: process.env.PGHOST || "localhost",
    port: parseInt(process.env.PGPORT || "5432", 10),
    database: process.env.PGDATABASE || "rgs_db",
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
  });
}

const pool = createPool();

pool.on("error", (err) => {
  console.error("Unexpected Postgres pool error", err);
});

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
};