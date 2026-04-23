import { gql } from "graphql-tag";

const courtTypes = gql`
  type Court {
    id: ID
    name: String
    number: Int
    active: Boolean
    type: String
  }
`;

export { courtTypes };
