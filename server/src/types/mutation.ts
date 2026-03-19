import { gql } from "graphql-tag";

export const mutationTypes = gql`
  type Mutation {
    createBooking(
      userId: ID
      player2Id: ID
      courtId: ID
      date: String
      hour: Int
    ): [Booking!]!
  }
`;
