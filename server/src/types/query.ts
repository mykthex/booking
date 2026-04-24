import { gql } from "graphql-tag";

export const queryTypes = gql`
  type Query {
    bookings(userId: ID): [Booking!]!
    user(id: ID!): User
    users: [User!]
    page(id: PageName!): Page
    courts: [Court!]!
    roles: [Role!]!
    memberships: [Membership!]!
    userOrderHistory(userEmail: String, userId: String, limit: Int = 20): [Order!]!
  }
`;
