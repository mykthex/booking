import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  overwrite: true,
  schema: "graphql/graphql-schema.graphql",
  generates: {
    "src/lib/graphql/.generatedTypes.ts": {
      plugins: ["typescript", "typescript-operations"],
      config: {
        useImplementingTypes: true,
        scalars: {
          Date: "string",
          Html: "string",
        },
        typesPrefix: "GraphQL",
        /**
         * Wrapping all fields in Maybe and removing optionals (undefined)
         * This is needed if a property is not selected in a query
         */
        wrapFieldDefinitions: true,
        fieldWrapperValue: "Maybe<T>",
      },
    },
  },
};
export default config;
