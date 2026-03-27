import type { IResolvers } from "@graphql-tools/utils";
import { PageName } from "../classes/page/types.js";
import { Page } from "../classes/page/page.js";

export const queryResolvers: IResolvers = {
  Query: {
    page: async (parent: unknown, args: { id: PageName }, context: any) => {
      return new Page(args.id);
    },
  },
};
