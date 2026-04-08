import type { IResolvers } from "@graphql-tools/utils";
import { Role } from "../db/types";

export const roleResolvers: IResolvers = {
  Role: {
    name: async (parent: Role, _args: any) => {
      return parent.role || null;
    },
  },
};
