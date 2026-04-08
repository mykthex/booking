import { GraphQLClient, gql } from "graphql-request";

const client = new GraphQLClient("http://localhost:9000/graphql");

export async function getBookings(userId) {
  const query = gql`
    query Bookings($userId: ID) {
      bookings(userId: $userId) {
        player2
        player1
        player1Id
        player2Id
        date
        courtId
        courtName
        hour
        paid
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

export async function getUsers() {
  const query = gql`
    query Users {
      users {
        id
        name
        email
        surname
        role
        roleId
        membershipId
        membership
      }
    }
  `;
  const { users } = await client.request(query);
  return users;
}

export async function getPlayers() {
  const query = gql`
    query Players {
      users {
        id
        name
        surname
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
  paid,
}) {
  const mutation = gql`
    mutation Mutation(
      $hour: Int
      $date: String
      $courtId: ID
      $player2Id: ID
      $userId: ID
      $paid: Boolean
    ) {
      createBooking(
        hour: $hour
        date: $date
        courtId: $courtId
        player2Id: $player2Id
        userId: $userId
        paid: $paid
      ) {
        player2
        player1
        id
        hour
        date
        courtName
        courtId
        paid
      }
    }
  `;

  const { createBooking } = await client.request(mutation, {
    hour,
    date,
    courtId,
    player2Id,
    userId,
    paid,
  });

  return createBooking;
}

export async function deleteBooking(id) {
  const mutation = gql`
    mutation DeleteBooking($id: ID!) {
      deleteBooking(id: $id)
    }
  `;

  const { deleteBooking } = await client.request(mutation, { id });
  return deleteBooking;
}

export async function updateBooking({ id, player1Id, player2Id, paid }) {
  console.log("Updating booking with:", { id, player1Id, player2Id, paid });
  const mutation = gql`
    mutation UpdateBooking(
      $id: ID!
      $player1Id: ID
      $player2Id: ID
      $paid: Boolean
    ) {
      updateBooking(
        id: $id
        player1Id: $player1Id
        player2Id: $player2Id
        paid: $paid
      ) {
        player2
        player1
        id
        paid
      }
    }
  `;

  const { updateBooking } = await client.request(mutation, {
    id,
    player1Id,
    player2Id,
    paid,
  });

  return updateBooking;
}
