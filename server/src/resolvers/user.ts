import type { IResolvers } from "@graphql-tools/utils";
import type { User } from "../db/types";
import { db } from "../db/database.js";

export const userResolvers: IResolvers = {
  User: {
    role: async (parent: User) => {
      // Query role name from database
      try {
        const role = await db
          .selectFrom("role")
          .select("role")
          .where("id", "=", parent.role)
          .executeTakeFirst();

        return role?.role || "user";
      } catch (error) {
        console.error("Error fetching role:", error);
        return "user";
      }
    },
    roleId: async (parent: User) => {
      return parent.role;
    },
    membershipId: async (parent: User) => {
      return parent.membershipId;
    },
    membership: async (parent: User) => {
      // Query membership name from database
      try {
        const membership = await db
          .selectFrom("memberships")
          .select("name")
          .where("id", "=", parent.membershipId)
          .executeTakeFirst();

        return membership?.name || "none";
      } catch (error) {
        console.error("Error fetching membership:", error);
        return "none";
      }
    },
  },
};
