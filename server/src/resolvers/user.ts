import type { IResolvers } from "@graphql-tools/utils";
import type { User } from "../db/types";

export const userResolvers: IResolvers = {
  User: {
    role: async (parent: User) => {
      // Map numeric role to string representation
      switch (parent.role) {
        case 1:
          return "admin";
        default:
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
      // Map numeric membership to string representation
      switch (parent.membershipId) {
        case 1:
          return "basic";
        case 2:
          return "Privilège";
        default:
          return "none";
      }
    },
  },
};
