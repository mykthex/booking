import { GraphQLClient, gql } from "graphql-request";

const client = new GraphQLClient("http://localhost:9000/graphql");

export async function getPage(pageId) {
  const query = gql`
    query GetPage($pageId: PageName!) {
      page(id: $pageId) {
        title
        image
        description
      }
    }
  `;
  const { page } = await client.request(query, { pageId });
  return page;
}
