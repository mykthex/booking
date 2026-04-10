import { Database } from "./types.js";
import SQLite from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";

// Create database with WAL mode and timeout for concurrent access
const sqlite = new SQLite("./data/db.sqlite3", {
  timeout: 5000,
});
sqlite.pragma("journal_mode = WAL");

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
