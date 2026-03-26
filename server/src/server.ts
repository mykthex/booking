import { ApolloServer } from "@apollo/server";
import { expressMiddleware as apolloMiddleware } from "@apollo/server/express4";
import cors from "cors";
import express from "express";
import { ResolverContext } from "./resolvers";
import { createBookingLoader } from "./db/bookings.js";
import { createUserLoader } from "./db/users.js";
import { createCourtLoader } from "./db/courts.js";
import { schema } from "./graphql/schema.js";
import { toNodeHandler } from "better-auth/node";
import { auth } from "../auth";
import { Stripe } from "stripe";

const PORT = 9000;

const app = express();

const stripe = new Stripe(
  "sk_test_51TCq1AATY03GEKJ6jPB2sGvRZB6xBj9RZKeQcoqUbKCFLG1VQQRwEckn6eSIfpe8XHcF9vrgza8hAzXMFzLRCR9j00FR5kAvsU",
);

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

// Stripe checkout session API route
app.post("/create-checkout-session", async (req, res) => {
  try {
    const { courtId, hour, date, amount = 2000 } = req.body;

    // Create a PaymentIntent instead of CheckoutSession for custom UI
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: "cad",
      payment_method_types: ["card"],
      metadata: {
        courtId: courtId?.toString(),
        hour: hour?.toString(),
        date: date?.toString(),
        description: `Court ${courtId} reservation for ${date} at ${hour}:00`,
      },
    });

    res.json({
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id,
    });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    res.status(500).json({ error: "Failed to create payment intent" });
  }
});

// Stripe subscription checkout session API route
app.post("/create-checkout-session-for-subscription", async (req, res) => {
  try {
    const { lookup_key, customer_email } = req.body;

    if (!lookup_key || !customer_email) {
      return res.status(400).json({
        error: "lookup_key and customer_email are required",
      });
    }

    // Get the price using the lookup key
    const prices = await stripe.prices.list({
      lookup_keys: [lookup_key],
      expand: ["data.product"],
    });

    if (prices.data.length === 0) {
      return res.status(400).json({ error: "Invalid lookup key" });
    }

    // Create checkout session for subscription
    const session = await stripe.checkout.sessions.create({
      billing_address_collection: "auto",
      customer_email: customer_email,
      line_items: [
        {
          price: prices.data[0].id,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.origin || "http://localhost:4321"}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin || "http://localhost:4321"}/cancel`,
    });

    res.json({
      url: session.url,
      session_id: session.id,
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

// Verify checkout session endpoint
app.post("/verify-checkout-session", async (req, res) => {
  try {
    const { session_id } = req.body;

    if (!session_id) {
      return res.status(400).json({ error: "Session ID is required" });
    }

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);

    // Check if payment was successful
    const isPaymentSuccessful = session.payment_status === "paid";

    res.json({
      success: isPaymentSuccessful,
      customer_email: session.customer_details?.email,
      subscription_id: session.subscription,
      payment_status: session.payment_status,
    });
  } catch (error) {
    console.error("Error verifying checkout session:", error);
    res.status(500).json({ error: "Failed to verify checkout session" });
  }
});

// Payment verification endpoint
app.post("/verify-payment", async (req, res) => {
  try {
    const { payment_intent_id } = req.body;

    if (!payment_intent_id) {
      return res.status(400).json({ error: "Payment intent ID is required" });
    }

    // Retrieve payment intent from Stripe
    const paymentIntent =
      await stripe.paymentIntents.retrieve(payment_intent_id);

    // Check if payment was successful
    const isPaymentSuccessful = paymentIntent.status === "succeeded";

    res.json({
      success: isPaymentSuccessful,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      metadata: paymentIntent.metadata,
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ error: "Failed to verify payment" });
  }
});

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
