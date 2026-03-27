import { gql } from "graphql-tag";

export const queryTypes = gql`
  type Query {
    page(id: PageName!): Page
  }
`;
