import { Database } from "./types.js";
import SQLite from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";
import fs from "fs";
import path from "path";

// Ensure data directory exists
const dataDir = "./data";
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = "./data/db.sqlite3";

// Create database with enhanced configuration for reliability
const sqlite = new SQLite(dbPath, {
  timeout: 10000, // Increased timeout for better concurrency handling
  verbose: process.env.NODE_ENV === "development" ? console.log : undefined,
});

// Configure SQLite for maximum reliability
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("synchronous = FULL"); // Ensure data is written to disk
sqlite.pragma("cache_size = 1000");
sqlite.pragma("temp_store = memory");
sqlite.pragma("mmap_size = 268435456"); // 256MB memory mapping
sqlite.pragma("wal_autocheckpoint = 1000"); // Checkpoint WAL every 1000 pages

// Run integrity check on startup
try {
  const result = sqlite.prepare("PRAGMA integrity_check").get() as any;
  if (result.integrity_check !== "ok") {
    console.error("Database integrity check failed:", result);
    process.exit(1);
  }
  console.log("✅ Database integrity check passed");
} catch (error) {
  console.error("Database integrity check error:", error);
  process.exit(1);
}

const dialect = new SqliteDialect({
  database: sqlite,
});

// Database interface is passed to Kysely's constructor, and from now on, Kysely
// knows your database structure.
// Dialect is passed to Kysely's constructor, and from now on, Kysely knows how
// to communicate with your database.
export const db = new Kysely<Database>({
  dialect,
});

// Graceful shutdown handling
process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);
process.on("SIGUSR2", gracefulShutdown); // nodemon restart

function gracefulShutdown(signal: string) {
  console.log(`\n🔄 Received ${signal}, closing database connection...`);
  
  try {
    // Checkpoint WAL file before closing
    sqlite.prepare("PRAGMA wal_checkpoint(TRUNCATE)").run();
    console.log("✅ WAL checkpointed successfully");
  } catch (error) {
    console.warn("⚠️ WAL checkpoint warning:", error);
  }
  
  try {
    sqlite.close();
    console.log("✅ Database connection closed successfully");
  } catch (error) {
    console.error("❌ Error closing database:", error);
  }
  
  process.exit(0);
}

// Export cleanup function for manual use
export function closeDatabaseConnection() {
  sqlite.prepare("PRAGMA wal_checkpoint(TRUNCATE)").run();
  sqlite.close();
}
