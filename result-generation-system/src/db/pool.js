require("dotenv").config();
const { Pool } = require("pg");

function createPool() {
  if (process.env.DATABASE_URL) {
    // Parse the URL manually so query-string params (e.g. ?sslmode=require)
    // are never silently concatenated into the database name by older pg versions.
    const url = new URL(process.env.DATABASE_URL);

    const sslMode = url.searchParams.get("sslmode");

    // Build a clean config object — no query string left in the DB name.
    const config = {
      host:     url.hostname,
      port:     url.port ? parseInt(url.port, 10) : 5432,
      database: url.pathname.replace(/^\//, ""), // strip leading "/"
      user:     url.username,
      password: url.password,
    };

    // Honour sslmode=require / sslmode=no-verify without crashing on
    // self-signed certs (common on Render, Railway, Supabase, etc.)
    if (sslMode === "require" || sslMode === "verify-ca" || sslMode === "verify-full") {
      config.ssl = { rejectUnauthorized: sslMode === "verify-full" };
    } else if (sslMode === "disable" || sslMode === "allow" || sslMode === "prefer") {
      config.ssl = false;
    }

    return new Pool(config);
  }

  // Fallback: discrete env vars (local development)
  return new Pool({
    host:     process.env.PGHOST     || "localhost",
    port:     parseInt(process.env.PGPORT || "5432", 10),
    database: process.env.PGDATABASE || "rgs_db",
    user:     process.env.PGUSER,
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