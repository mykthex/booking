import { pageResolvers } from "./page";
import { queryResolvers } from "./query";
import type { IResolvers } from "@graphql-tools/utils";

export const typesResolvers: IResolvers[] = [queryResolvers, pageResolvers];
