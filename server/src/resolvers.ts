import { GraphQLError } from "graphql";

export interface ResolverContext {
  user: null;
}

function notFoundError(message: string) {
  return new GraphQLError(message, {
    extensions: { code: "NOT_FOUND" },
  });
}

function unauthorizedError(message: string) {
  return new GraphQLError(message, {
    extensions: { code: "UNAUTHORIZED" },
  });
}

function toIsoDate(value: string) {
  return value.slice(0, "yyyy-mm-dd".length);
}
