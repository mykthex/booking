import { exec } from "child_process";

const endpoint = "http://localhost:9000/graphql";
const schemaCommand = `get-graphql-schema ${endpoint} > ./graphql/graphql-schema.graphql`;
const tsCommand = "graphql-codegen --config graphql/codegen.ts";
const esLintCommand = "eslint --fix ./src/lib/graphql/.generatedTypes.ts";

console.log(`Generating Schema for endpoint ${endpoint}...`);

exec(schemaCommand, (e) => {
  console.log("Generating TS file from generated schema...", e);
  exec(tsCommand, (w) => {
    console.log("Autofixing eslint issues in generated file", w);
    exec(esLintCommand);
  });
});
