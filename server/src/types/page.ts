import { gql } from "graphql-tag";

const pageTypes = gql`
  enum PageName {
    home
  }
  type Page {
    title: String
    description: String
    image: String
  }
`;

export { pageTypes };
