import { GraphQLClient, gql } from "graphql-request";
import { getAccessToken } from "./auth";

const client = new GraphQLClient("http://localhost:9000/graphql");

export async function getBookings(userId) {
  const query = gql`
    query Bookings($userId: ID) {
      bookings(userId: $userId) {
        player2
        player1
        date
        courtId
        courtName
        hour
        id
      }
    }
  `;
  const { bookings } = await client.request(query, { userId });
  return bookings;
}

export async function getCourts() {
  const query = gql`
    query Courts {
      courts {
        id
        name
        number
      }
    }
  `;
  const { courts } = await client.request(query);
  return courts;
}

export async function getPlayers() {
  const query = gql`
    query Players {
      users {
        id
        name
        email
      }
    }
  `;
  const { users } = await client.request(query);
  return users;
}

export async function createBooking({
  hour,
  date,
  courtId,
  player2Id,
  userId,
}) {
  const mutation = gql`
    mutation Mutation(
      $hour: Int
      $date: String
      $courtId: ID
      $player2Id: ID
      $userId: ID
    ) {
      createBooking(
        hour: $hour
        date: $date
        courtId: $courtId
        player2Id: $player2Id
        userId: $userId
      ) {
        player2
        player1
        id
        hour
        date
        courtName
        courtId
      }
    }
  `;

  const { createBooking } = await client.request(mutation, {
    hour,
    date,
    courtId,
    player2Id,
    userId,
  });

  console.log("Booking created:", createBooking);

  return createBooking;
}
