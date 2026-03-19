import { betterAuth } from "better-auth";
import Database from "better-sqlite3";

export const auth = betterAuth({
  database: new Database("./data/db.sqlite3"),
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: ["http://localhost:4321", "http://localhost:3000"],
});
