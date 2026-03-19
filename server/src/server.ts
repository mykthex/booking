import { ApolloServer } from "@apollo/server";
import { expressMiddleware as apolloMiddleware } from "@apollo/server/express4";
import cors from "cors";
import express from "express";
import { authMiddleware, handleLogin } from "./auth.js";
import { ResolverContext, resolvers } from "./resolvers.js";
import { createBookingLoader } from "./db/bookings.js";
import { createUserLoader } from "./db/users.js";
import { createCourtLoader } from "./db/courts.js";
import { schema } from "./graphql/schema.js";

const PORT = 9000;

const app = express();
app.use(cors(), express.json(), authMiddleware);

app.post("/login", handleLogin);

async function getContext({ req }): Promise<ResolverContext> {
  const bookingLoader = createBookingLoader();
  const userLoader = createUserLoader();
  const courtLoader = createCourtLoader();
  const context: ResolverContext = { bookingLoader, userLoader, courtLoader };

  return context;
}

async function startServer() {
  const apolloServer = new ApolloServer({ schema });
  await apolloServer.start();
  app.use("/graphql", apolloMiddleware(apolloServer, { context: getContext }));

  app.listen({ port: PORT }, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`GraphQL endpoint: http://localhost:${PORT}/graphql`);
  });
}

startServer().catch(console.error);
