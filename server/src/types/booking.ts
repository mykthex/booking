import { gql } from "graphql-tag";

const bookingTypes = gql`
  type Booking {
    date: String
    player1: String
    player2: String
    courtId: Int
    courtName: String
    hour: String
    paid: Boolean
    id: ID
  }

  type User {
    id: ID
    email: String
    name: String
  }
`;

export { bookingTypes };
