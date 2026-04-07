import { gql } from "graphql-tag";

export const mutationTypes = gql`
  type Mutation {
    createBooking(
      userId: ID
      player2Id: ID
      courtId: ID
      date: String
      hour: Int
      paid: Boolean
    ): [Booking!]!
    updateBooking(
      id: ID!
      userId: ID
      player2Id: ID
      courtId: ID
      date: String
      hour: Int
      paid: Boolean
    ): Booking
    deleteBooking(id: ID!): Boolean
  }
`;
