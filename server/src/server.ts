import { ApolloServer } from "@apollo/server";
import { expressMiddleware as apolloMiddleware } from "@apollo/server/express4";
import cors from "cors";
import express from "express";
import { ResolverContext } from "./resolvers";
import { createBookingLoader } from "./db/bookings.js";
import { createUserLoader, getUserById } from "./db/users.js";
import { createCourtLoader } from "./db/courts.js";
import { schema } from "./graphql/schema.js";
import { toNodeHandler } from "better-auth/node";
import { auth } from "../auth";

const PORT = 9000;

const app = express();

// Configure CORS before other middleware
app.use(
  cors({
    origin: ["http://localhost:4321", "http://localhost:3000"], // Add your client origins
    credentials: true, // Important for better-auth cookies
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  }),
);

app.use(express.json());

// Better auth routes (now with CORS enabled)
app.all("/api/auth/*", toNodeHandler(auth));

async function getContext({ req }): Promise<ResolverContext> {
  const bookingLoader = createBookingLoader();
  const userLoader = createUserLoader();
  const courtLoader = createCourtLoader();
  const context: ResolverContext = {
    bookingLoader,
    userLoader,
    courtLoader,
    user: null,
  };

  return context;
}

async function startServer() {
  const apolloServer = new ApolloServer({ schema });
  await apolloServer.start();
  app.use("/graphql", apolloMiddleware(apolloServer, { context: getContext }));

  app.listen({ port: PORT }, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Better Auth app listening on port ${PORT}`);
    console.log(`GraphQL endpoint: http://localhost:${PORT}/graphql`);
  });
}

startServer().catch(console.error);
