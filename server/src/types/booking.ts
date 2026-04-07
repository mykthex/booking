import { gql } from "graphql-tag";

const bookingTypes = gql`
  type Booking {
    date: String
    player1Id: String
    player2Id: String
    player1: String
    player2: String
    courtId: Int
    courtName: String
    hour: String
    paid: Boolean
    id: ID
  }
`;

export { bookingTypes };
