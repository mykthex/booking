import { GraphQLError } from "graphql";
function notFoundError(message) {
    return new GraphQLError(message, {
        extensions: { code: "NOT_FOUND" },
    });
}
function unauthorizedError(message) {
    return new GraphQLError(message, {
        extensions: { code: "UNAUTHORIZED" },
    });
}
function toIsoDate(value) {
    return value.slice(0, "yyyy-mm-dd".length);
}
