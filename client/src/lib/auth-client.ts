import { createAuthClient } from "better-auth/react";

import { inferAdditionalFields } from "better-auth/client/plugins";
import type { auth } from "../../../server/auth";
import { adminClient } from "better-auth/client/plugins";
import { API_BASE_URL } from "./api-url";

export const authClient = createAuthClient({
  /** The base URL of the server (optional if you're using the same domain) */
  baseURL: API_BASE_URL,
  basePath: "/api/auth", // This tells the client where auth endpoints are mounted
  plugins: [inferAdditionalFields<typeof auth>(), adminClient()],
});
export const { signIn, signOut, signUp, updateUser, changePassword, admin } = authClient;
