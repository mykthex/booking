import { gql } from "graphql-tag";

const orderTypes = gql`
  union Order = BookingPayment | Subscription

  type BookingPayment {
    id: ID!
    type: String!
    status: String!
    amount: Float!
    currency: String!
    created: String!
    description: String
  }

  type Subscription {
    id: ID!
    type: String!
    status: String!
    amount: Float!
    currency: String!
    created: String!
    description: String
    subscriptionType: String
    cancelAtPeriodEnd: Boolean
  }
`;

export { orderTypes };
