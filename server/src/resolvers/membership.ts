import type { IResolvers } from "@graphql-tools/utils";
import { Membership } from "../db/types";

export const membershipResolvers: IResolvers = {
  Membership: {
    id: async (parent: Membership, _args: any) => {
      return parent.id || null;
    },
    name: async (parent: Membership, _args: any) => {
      return parent.name || null;
    },
    cost: async (parent: Membership, _args: any) => {
      return parent.cost || null;
    },
  },
};
