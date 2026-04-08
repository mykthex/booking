import { gql } from "graphql-tag";

const roleTypes = gql`
  type Role {
    id: ID
    name: String
  }
`;

export { roleTypes };
