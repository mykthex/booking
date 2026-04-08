import { gql } from "graphql-tag";

const membershipTypes = gql`
  type Membership {
    name: String
    id: ID
    cost: Float
  }
`;

export { membershipTypes };
