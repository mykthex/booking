import { betterAuth } from "better-auth";
import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { admin } from "better-auth/plugins";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export const auth = betterAuth({
  database: new Database(join(__dirname, "data", "db.sqlite3")),
  emailAndPassword: {
    enabled: true,
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
