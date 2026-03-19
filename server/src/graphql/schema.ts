import { makeExecutableSchema } from "@graphql-tools/schema";

import { typesResolvers } from "../resolvers/resolvers.js";
import { typeDefs } from "../types/typesDef.js";

export const schema = makeExecutableSchema({
  resolvers: typesResolvers,
  typeDefs,
});
