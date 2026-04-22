import { gql } from "graphql-tag";

const courtTypes = gql`
  type Court {
    id: Int
    name: String
    number: String
    active: Boolean
    type: String
  }
`;

export { courtTypes };
