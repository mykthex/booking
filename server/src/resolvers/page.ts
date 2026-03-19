import type { IResolvers } from "@graphql-tools/utils";
import { Page } from "../classes/page/page";

export const pageResolvers: IResolvers = {
  Page: {
    title: async (parent: Page, _args: any) => {
      console.log("Resolving title for page:", parent.meta);
      return parent.meta.title || null;
    },
    description: async (parent: Page, _args: any) => {
      return parent.meta.description || null;
    },
    image: async (parent: Page, _args: any) => {
      return parent.meta.image || null;
    },
  },
};
