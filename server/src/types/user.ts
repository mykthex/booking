import { gql } from "graphql-tag";

const userTypes = gql`
  type User {
    id: ID
    email: String
    name: String
    surname: String
    role: String
    roleId: Int
    membershipId: Int
    membership: String
  }
`;

export { userTypes };
