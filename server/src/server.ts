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
      success_url: `${req.headers.origin || "http://localhost:4321"}/account?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin || "http://localhost:4321"}/account`,
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

// Get user subscription endpoint
app.post("/get-user-subscription", async (req, res) => {
  try {
    const { customer_email } = req.body;

    if (!customer_email) {
      return res.status(400).json({ error: "Customer email is required" });
    }

    // Find customer by email
    const customers = await stripe.customers.list({
      email: customer_email,
      limit: 1,
    });

    if (customers.data.length === 0) {
      return res.json({ subscription: null });
    }

    const customer = customers.data[0];

    // Get active subscriptions for the customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: "active",
      expand: ["data.items.data.price"],
    });

    if (subscriptions.data.length === 0) {
      return res.json({ subscription: null });
    }

    const subscription = subscriptions.data[0];
    const price = subscription.items.data[0]?.price;

    // Check for refunds on this subscription
    let isCancelled = subscription.status === "canceled";
    try {
      // Get invoices for this subscription to check for refunds
      const invoices = await stripe.invoices.list({
        subscription: subscription.id,
        limit: 10,
      });
    } catch (error) {
      console.warn("Could not check for refunds:", error);
    }

    // Get product and price details to determine subscription type
    let productName = "Membership";
    let subscriptionType = "Standard";
    let priceDescription = "";

    if (price?.product) {
      try {
        const product = await stripe.products.retrieve(price.product as string);

        // Use price nickname, description, or metadata to determine subscription type
        if (price.nickname) {
          subscriptionType = price.nickname;
        } else if (price.metadata?.type) {
          subscriptionType = price.metadata.type;
        } else if (price.unit_amount && price.unit_amount >= 2000) {
          // Assuming premium is $20+
          subscriptionType = "Premium";
        }

        productName = product.name;
        priceDescription = price.metadata?.description || "";
      } catch (error) {
        console.warn("Could not retrieve product details:", error);
      }
    }

    res.json({
      subscription: {
        id: subscription.id,
        status: isCancelled ? "cancelled" : subscription.status,
        current_period_start: new Date(subscription.start_date * 1000),
        current_period_end: new Date(
          (subscription.start_date + 365 * 24 * 60 * 60) * 1000,
        ),
        cancel_at_period_end: subscription.cancel_at_period_end,
        product_name: productName,
        subscription_type: subscriptionType,
        description: priceDescription,
        amount: price?.unit_amount ? price.unit_amount / 100 : 0,
        currency: price?.currency || "cad",
        price_nickname: price?.nickname || null,
        price_metadata: price?.metadata || {},
        is_cancelled: isCancelled,
        cancelled_at: subscription.canceled_at,
      },
    });
  } catch (error) {
    console.error("Error getting user subscription:", error);
    res.status(500).json({ error: "Failed to get subscription" });
  }
});

// Cancel subscription endpoint
app.post("/cancel-subscription", async (req, res) => {
  try {
    const { subscription_id, cancel_immediately } = req.body;

    if (!subscription_id) {
      return res.status(400).json({ error: "Subscription ID is required" });
    }

    let updatedSubscription;

    if (cancel_immediately) {
      // Cancel immediately
      updatedSubscription = await stripe.subscriptions.cancel(subscription_id);
    } else {
      // Cancel at period end
      updatedSubscription = await stripe.subscriptions.update(subscription_id, {
        cancel_at_period_end: true,
      });
    }

    res.json({
      success: true,
      subscription: {
        id: updatedSubscription.id,
        status: updatedSubscription.status,
        cancel_at_period_end: updatedSubscription.cancel_at_period_end,
        current_period_end: new Date(
          updatedSubscription.current_period_end * 1000,
        ),
      },
    });
  } catch (error) {
    console.error("Error canceling subscription:", error);
    res.status(500).json({ error: "Failed to cancel subscription" });
  }
});

// Reactivate subscription endpoint
app.post("/reactivate-subscription", async (req, res) => {
  try {
    const { subscription_id } = req.body;

    if (!subscription_id) {
      return res.status(400).json({ error: "Subscription ID is required" });
    }

    // Reactivate by setting cancel_at_period_end to false
    const updatedSubscription = await stripe.subscriptions.update(
      subscription_id,
      {
        cancel_at_period_end: false,
      },
    );

    res.json({
      success: true,
      subscription: {
        id: updatedSubscription.id,
        status: updatedSubscription.status,
        cancel_at_period_end: updatedSubscription.cancel_at_period_end,
        current_period_end: new Date(updatedSubscription.ended_at * 1000),
      },
    });
  } catch (error) {
    console.error("Error reactivating subscription:", error);
    res.status(500).json({ error: "Failed to reactivate subscription" });
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
