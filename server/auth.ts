import { betterAuth } from "better-auth";
import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { admin } from "better-auth/plugins";
import { sendConfirmationEmail } from "./mailer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create database with WAL mode for better concurrent access
const database = new Database(join(__dirname, "data", "db.sqlite3"), {
  timeout: 5000,
});
database.pragma("journal_mode = WAL");

export const auth = betterAuth({
  database: database,
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url, token }, request) => {
      // Send verification email using your preferred email service
      console.log("Sending verification email to:", user.email, url, token);
      sendConfirmationEmail(user, url, token);
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  plugins: [admin()],
  user: {
    additionalFields: {
      membershipId: {
        type: "number",
        required: true,
      },
      surname: {
        type: "string",
        required: true,
      },
      role: {
        type: ["user", "admin"],
        required: false,
        defaultValue: "user",
        input: false, // don't allow user to set role
      },
    },
  },
  trustedOrigins: ["http://localhost:4321", "http://localhost:3000"],
});
