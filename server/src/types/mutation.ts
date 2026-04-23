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
    ): Booking
    updateBooking(
      id: ID!
      player1Id: ID
      player2Id: ID
      courtId: ID
      date: String
      hour: Int
      paid: Boolean
    ): Booking
    createCourt(name: String!, number: Int!, type: String!, active: Boolean!): Court
    updateCourt(id: ID!, name: String, number: Int, type: String, active: Boolean): Court
    deleteBooking(id: ID!): Boolean
  }
`;
