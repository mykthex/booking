import "dotenv/config";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware as apolloMiddleware } from "@apollo/server/express4";
import cors from "cors";
import express from "express";
import { createBookingLoader } from "./db/bookings.js";
import { createUserLoader, getUserByEmail } from "./db/users.js";
import { createCourtLoader } from "./db/courts.js";
import { createOrderLoader } from "./db/orders.js";
import { schema } from "./graphql/schema.js";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth.js";
import { Stripe } from "stripe";
import { DatabaseHealth } from "./db/health.js";
const PORT = Number(process.env.PORT || 9000);
const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:4321";
const corsOrigins = (process.env.CORS_ORIGINS || `${clientOrigin},http://localhost:3000`)
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const app = express();
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;
if (!stripe) {
    console.warn("STRIPE_SECRET_KEY is not set. Stripe endpoints will return 503 until configured.");
}
function getStripeClient(res) {
    if (!stripe) {
        res.status(503).json({
            error: "Stripe is not configured",
            message: "Set STRIPE_SECRET_KEY in the environment and redeploy.",
        });
        return null;
    }
    return stripe;
}
// Configure CORS before other middleware
app.use(cors({
    origin: corsOrigins,
    credentials: true, // Important for better-auth cookies
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
}));
app.use(express.json());
// Stripe checkout session API route
app.post("/create-checkout-session", async (req, res) => {
    try {
        const stripeClient = getStripeClient(res);
        if (!stripeClient) {
            return;
        }
        const { courtId, hour, date, customer_email } = req.body;
        // Product ID for court reservations (one for night, one for day)
        const COURT_BOOKING_PRODUCT_ID = hour >= 17 ? "prod_UPe9aOou8c4jp5" : "prod_UPe8g9FyvN45F1";
        let customerId = null;
        let productPrice = null;
        // Get product and its default price
        try {
            const product = await stripeClient.products.retrieve(COURT_BOOKING_PRODUCT_ID, {
                expand: ['default_price']
            });
            if (product.default_price && typeof product.default_price === 'object') {
                productPrice = product.default_price;
            }
            else {
                // Fallback: get prices for this product
                const prices = await stripeClient.prices.list({
                    product: COURT_BOOKING_PRODUCT_ID,
                    active: true,
                    limit: 1,
                });
                if (prices.data.length > 0) {
                    productPrice = prices.data[0];
                }
            }
            if (!productPrice) {
                throw new Error("No active price found for court booking product");
            }
        }
        catch (productError) {
            console.error("Error fetching product:", productError);
            return res.status(400).json({
                error: "Failed to fetch product information",
                details: productError.message
            });
        }
        // If customer email is provided, find or create a Stripe customer
        if (customer_email) {
            try {
                // First, try to find existing customer by email
                const existingCustomers = await stripeClient.customers.list({
                    email: customer_email,
                    limit: 1,
                });
                if (existingCustomers.data.length > 0) {
                    // Use existing customer
                    customerId = existingCustomers.data[0].id;
                }
                else {
                    // Create new customer
                    const customer = await stripeClient.customers.create({
                        email: customer_email,
                        metadata: {
                            created_via: 'court_booking'
                        }
                    });
                    customerId = customer.id;
                }
            }
            catch (customerError) {
                console.warn("Error managing customer:", customerError);
                // Continue without customer if there's an error
            }
        }
        // Create a PaymentIntent with customer attached if available
        const paymentIntentData = {
            amount: productPrice.unit_amount,
            currency: productPrice.currency,
            payment_method_types: ["card"],
            metadata: {
                courtId: courtId?.toString(),
                hour: hour?.toString(),
                date: date?.toString(),
                product_id: COURT_BOOKING_PRODUCT_ID,
                price_id: productPrice.id,
                description: `Court ${courtId} reservation for ${date} at ${hour}:00`,
            },
        };
        // Add customer only if we have one
        if (customerId) {
            paymentIntentData.customer = customerId;
        }
        const paymentIntent = await stripeClient.paymentIntents.create(paymentIntentData);
        res.json({
            client_secret: paymentIntent.client_secret,
            payment_intent_id: paymentIntent.id,
            customer_id: customerId,
            amount: productPrice.unit_amount,
            currency: productPrice.currency,
            product_id: COURT_BOOKING_PRODUCT_ID,
        });
    }
    catch (error) {
        console.error("Error creating payment intent:", error);
        res.status(500).json({ error: "Failed to create payment intent" });
    }
});
// Stripe subscription checkout session API route
app.post("/create-checkout-session-for-subscription", async (req, res) => {
    try {
        const stripeClient = getStripeClient(res);
        if (!stripeClient) {
            return;
        }
        const { lookup_key, customer_email } = req.body;
        if (!lookup_key || !customer_email) {
            return res.status(400).json({
                error: "lookup_key and customer_email are required",
            });
        }
        // Get the price using the lookup key
        const prices = await stripeClient.prices.list({
            lookup_keys: [lookup_key],
            expand: ["data.product"],
        });
        if (prices.data.length === 0) {
            return res.status(400).json({ error: "Invalid lookup key" });
        }
        // Create checkout session for subscription
        const session = await stripeClient.checkout.sessions.create({
            billing_address_collection: "auto",
            customer_email: customer_email,
            line_items: [
                {
                    price: prices.data[0].id,
                    quantity: 1,
                },
            ],
            mode: "subscription",
            success_url: `${req.headers.origin || clientOrigin}/confirmation?subscription=success`,
            cancel_url: `${req.headers.origin || clientOrigin}/confirmation?subscription=cancelled`,
        });
        res.json({
            url: session.url,
            session_id: session.id,
        });
    }
    catch (error) {
        console.error("Error creating checkout session:", error);
        res.status(500).json({ error: "Failed to create checkout session" });
    }
});
// Get user subscription endpoint
app.post("/get-user-subscription", async (req, res) => {
    try {
        const stripeClient = getStripeClient(res);
        if (!stripeClient) {
            return;
        }
        const { customer_email } = req.body;
        if (!customer_email) {
            return res.status(400).json({ error: "Customer email is required" });
        }
        // Find customer by email
        const customers = await stripeClient.customers.list({
            email: customer_email,
            limit: 1,
        });
        if (customers.data.length === 0) {
            return res.json({ subscription: null });
        }
        const customer = customers.data[0];
        // Get active subscriptions for the customer
        const subscriptions = await stripeClient.subscriptions.list({
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
            const invoices = await stripeClient.invoices.list({
                subscription: subscription.id,
                limit: 10,
            });
        }
        catch (error) {
            console.warn("Could not check for refunds:", error);
        }
        // Get product and price details to determine subscription type
        let productName = "Membership";
        let subscriptionType = "Standard";
        let priceDescription = "";
        if (price?.product) {
            try {
                const product = await stripeClient.products.retrieve(price.product);
                // Use price nickname, description, or metadata to determine subscription type
                if (price.nickname) {
                    subscriptionType = price.nickname;
                }
                else if (price.metadata?.type) {
                    subscriptionType = price.metadata.type;
                }
                else if (price.unit_amount && price.unit_amount >= 2000) {
                    // Assuming premium is $20+
                    subscriptionType = "Premium";
                }
                productName = product.name;
                priceDescription = price.metadata?.description || "";
            }
            catch (error) {
                console.warn("Could not retrieve product details:", error);
            }
        }
        res.json({
            subscription: {
                id: subscription.id,
                status: isCancelled ? "cancelled" : subscription.status,
                current_period_start: new Date(subscription.start_date * 1000),
                current_period_end: new Date((subscription.start_date + 365 * 24 * 60 * 60) * 1000),
                cancel_at_period_end: subscription.cancel_at_period_end,
                product_name: productName,
                subscription_type: subscriptionType,
                description: priceDescription,
                amount: price?.unit_amount ? price.unit_amount / 100 : 0,
                currency: price?.currency || "cad",
                price_nickname: price?.nickname || null,
                price_metadata: price?.metadata || {},
                lookup_key: price?.lookup_key || null,
                is_cancelled: isCancelled,
            },
        });
    }
    catch (error) {
        console.error("Error getting user subscription:", error);
        res.status(500).json({ error: "Failed to get subscription" });
    }
});
// Cancel subscription endpoint
app.post("/cancel-subscription", async (req, res) => {
    try {
        const stripeClient = getStripeClient(res);
        if (!stripeClient) {
            return;
        }
        const { subscription_id, cancel_immediately } = req.body;
        if (!subscription_id) {
            return res.status(400).json({ error: "Subscription ID is required" });
        }
        let updatedSubscription;
        if (cancel_immediately) {
            // Cancel immediately
            updatedSubscription = await stripeClient.subscriptions.cancel(subscription_id);
        }
        else {
            // Cancel at period end
            updatedSubscription = await stripeClient.subscriptions.update(subscription_id, {
                cancel_at_period_end: true,
            });
        }
        res.json({
            success: true,
            subscription: {
                id: updatedSubscription.id,
                status: updatedSubscription.status,
                cancel_at_period_end: updatedSubscription.cancel_at_period_end,
                current_period_end: new Date(updatedSubscription.current_period_end * 1000),
            },
        });
    }
    catch (error) {
        console.error("Error canceling subscription:", error);
        res.status(500).json({ error: "Failed to cancel subscription" });
    }
});
// Reactivate subscription endpoint
app.post("/reactivate-subscription", async (req, res) => {
    try {
        const stripeClient = getStripeClient(res);
        if (!stripeClient) {
            return;
        }
        const { subscription_id } = req.body;
        if (!subscription_id) {
            return res.status(400).json({ error: "Subscription ID is required" });
        }
        // Reactivate by setting cancel_at_period_end to false
        const updatedSubscription = await stripeClient.subscriptions.update(subscription_id, {
            cancel_at_period_end: false,
        });
        res.json({
            success: true,
            subscription: {
                id: updatedSubscription.id,
                status: updatedSubscription.status,
                cancel_at_period_end: updatedSubscription.cancel_at_period_end,
            },
        });
    }
    catch (error) {
        console.error("Error reactivating subscription:", error);
        res.status(500).json({ error: "Failed to reactivate subscription" });
    }
});
// Upgrade subscription endpoint
app.post("/subscription/upgrade", async (req, res) => {
    try {
        const stripeClient = getStripeClient(res);
        if (!stripeClient) {
            return;
        }
        const { subscriptionId, newPlan } = req.body;
        if (!subscriptionId || !newPlan) {
            return res.status(400).json({
                error: "Subscription ID and new plan are required"
            });
        }
        // Get current subscription details
        const currentSubscription = await stripeClient.subscriptions.retrieve(subscriptionId, { expand: ["items.data.price"] });
        if (currentSubscription.status !== "active") {
            return res.status(400).json({
                error: "Can only upgrade active subscriptions"
            });
        }
        // Define price lookup keys for different plans
        const priceLookupKeys = {
            standard: "standard-membership",
            premium: "privilege-membership"
        };
        const targetLookupKey = priceLookupKeys[newPlan];
        if (!targetLookupKey) {
            return res.status(400).json({
                error: "Invalid subscription plan"
            });
        }
        // Get the new price using lookup key
        const prices = await stripeClient.prices.list({
            lookup_keys: [targetLookupKey],
            expand: ["data.product"],
        });
        if (prices.data.length === 0) {
            return res.status(400).json({
                error: "Price not found for the specified plan"
            });
        }
        const newPrice = prices.data[0];
        const currentPrice = currentSubscription.items.data[0].price;
        // Check if this is actually an upgrade (prevent downgrading via this endpoint)
        if (newPrice.unit_amount && currentPrice.unit_amount && newPrice.unit_amount <= currentPrice.unit_amount) {
            return res.status(400).json({
                error: "New plan must be higher tier than current plan"
            });
        }
        // Update the subscription with proration
        const updatedSubscription = await stripeClient.subscriptions.update(subscriptionId, {
            items: [{
                    id: currentSubscription.items.data[0].id,
                    price: newPrice.id,
                }],
            proration_behavior: 'always_invoice', // This handles proration automatically
            billing_cycle_anchor: 'unchanged', // Keep the same billing cycle
        });
        // Calculate proration amount for response (informational)
        const currentPeriodEnd = currentSubscription.current_period_end;
        const currentPeriodStart = currentSubscription.current_period_start;
        const prorationAmount = Math.max(0, ((newPrice.unit_amount || 0) - (currentPrice.unit_amount || 0)) *
            (currentPeriodEnd - Math.floor(Date.now() / 1000)) /
            (currentPeriodEnd - currentPeriodStart));
        res.json({
            success: true,
            subscription: {
                id: updatedSubscription.id,
                status: updatedSubscription.status,
                current_period_end: new Date(updatedSubscription.current_period_end * 1000),
                new_plan: newPlan,
                new_price: newPrice.unit_amount / 100,
                proration_amount: Math.round(prorationAmount) / 100,
            },
        });
    }
    catch (error) {
        console.error("Error upgrading subscription:", error);
        // Handle specific Stripe errors
        if (error.type === 'StripeCardError') {
            return res.status(400).json({
                error: "Payment failed: " + error.message
            });
        }
        res.status(500).json({
            error: "Failed to upgrade subscription"
        });
    }
});
// Get subscription plans endpoint
app.get("/subscription/plans", async (req, res) => {
    try {
        const stripeClient = getStripeClient(res);
        if (!stripeClient) {
            return;
        }
        // Define available plans with their lookup keys
        const planLookupKeys = [
            "standard-membership",
            "privilege-membership"
        ];
        const plans = [];
        for (const lookupKey of planLookupKeys) {
            try {
                const prices = await stripeClient.prices.list({
                    lookup_keys: [lookupKey],
                    expand: ["data.product"],
                    active: true,
                });
                if (prices.data.length > 0) {
                    const price = prices.data[0];
                    const product = price.product;
                    plans.push({
                        id: lookupKey,
                        name: product.name,
                        description: product.description,
                        price: price.unit_amount / 100,
                        currency: price.currency,
                        interval: price.recurring?.interval,
                        features: product.metadata?.features ?
                            JSON.parse(product.metadata.features) : [],
                        priceId: price.id,
                        productId: product.id,
                    });
                }
            }
            catch (error) {
                console.warn(`Could not retrieve plan ${lookupKey}:`, error);
            }
        }
        // Sort plans by price (ascending)
        plans.sort((a, b) => a.price - b.price);
        res.json({
            success: true,
            plans,
        });
    }
    catch (error) {
        console.error("Error getting subscription plans:", error);
        res.status(500).json({
            error: "Failed to retrieve subscription plans"
        });
    }
});
// Verify checkout session endpoint
app.post("/verify-checkout-session", async (req, res) => {
    try {
        const stripeClient = getStripeClient(res);
        if (!stripeClient) {
            return;
        }
        const { session_id } = req.body;
        if (!session_id) {
            return res.status(400).json({ error: "Session ID is required" });
        }
        // Retrieve the checkout session from Stripe
        const session = await stripeClient.checkout.sessions.retrieve(session_id);
        // Check if payment was successful
        const isPaymentSuccessful = session.payment_status === "paid";
        res.json({
            success: isPaymentSuccessful,
            customer_email: session.customer_details?.email,
            subscription_id: session.subscription,
            payment_status: session.payment_status,
        });
    }
    catch (error) {
        console.error("Error verifying checkout session:", error);
        res.status(500).json({ error: "Failed to verify checkout session" });
    }
});
// Payment verification endpoint
app.post("/verify-payment", async (req, res) => {
    try {
        const stripeClient = getStripeClient(res);
        if (!stripeClient) {
            return;
        }
        const { payment_intent_id } = req.body;
        if (!payment_intent_id) {
            return res.status(400).json({ error: "Payment intent ID is required" });
        }
        // Retrieve payment intent from Stripe
        const paymentIntent = await stripeClient.paymentIntents.retrieve(payment_intent_id);
        // Check if payment was successful
        const isPaymentSuccessful = paymentIntent.status === "succeeded";
        res.json({
            success: isPaymentSuccessful,
            status: paymentIntent.status,
            amount: paymentIntent.amount,
            metadata: paymentIntent.metadata,
        });
    }
    catch (error) {
        console.error("Error verifying payment:", error);
        res.status(500).json({ error: "Failed to verify payment" });
    }
});
// Get payment intent details endpoint
app.post("/get-payment-details", async (req, res) => {
    try {
        const stripeClient = getStripeClient(res);
        if (!stripeClient) {
            return;
        }
        const { payment_intent_id } = req.body;
        if (!payment_intent_id) {
            return res.status(400).json({ error: "Payment intent ID is required" });
        }
        // Retrieve the payment intent with expanded payment method
        const paymentIntent = await stripeClient.paymentIntents.retrieve(payment_intent_id, {
            expand: ['payment_method']
        });
        if (!paymentIntent) {
            return res.status(404).json({ error: "Payment intent not found" });
        }
        // Extract payment method details
        let paymentMethodDetails = {
            type: "unknown",
            last4: "****",
            brand: "unknown"
        };
        if (paymentIntent.payment_method && typeof paymentIntent.payment_method === 'object') {
            const pm = paymentIntent.payment_method;
            if (pm.type === 'card' && pm.card) {
                paymentMethodDetails = {
                    type: pm.card.brand || "card",
                    last4: pm.card.last4 || "****",
                    brand: pm.card.brand || "unknown"
                };
            }
            else {
                paymentMethodDetails.type = pm.type;
            }
        }
        res.json({
            payment_intent_id: paymentIntent.id,
            status: paymentIntent.status,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            created: paymentIntent.created,
            payment_method: paymentMethodDetails,
            metadata: paymentIntent.metadata,
        });
    }
    catch (error) {
        console.error("Error getting payment details:", error);
        res.status(500).json({ error: "Failed to get payment details" });
    }
});
// Get user order history endpoint
app.post("/get-user-order-history", async (req, res) => {
    try {
        const stripeClient = getStripeClient(res);
        if (!stripeClient) {
            return;
        }
        const { customer_email, limit = 10 } = req.body;
        if (!customer_email) {
            return res.status(400).json({ error: "Customer email is required" });
        }
        // Find customer by email
        const customers = await stripeClient.customers.list({
            email: customer_email,
            limit: 1,
        });
        if (customers.data.length === 0) {
            return res.json({ orders: [], total_count: 0 });
        }
        const customer = customers.data[0];
        const orders = [];
        // Get payment intents (one-time payments like court bookings)
        try {
            const paymentIntents = await stripeClient.paymentIntents.list({
                customer: customer.id,
                limit: limit,
                expand: ['data.charges.data'],
            });
            for (const payment of paymentIntents.data) {
                if (payment.status === 'succeeded') {
                    orders.push({
                        id: payment.id,
                        type: 'payment',
                        status: payment.status,
                        amount: payment.amount / 100, // Convert from cents
                        currency: payment.currency.toUpperCase(),
                        created: new Date(payment.created * 1000),
                        description: payment.description || 'Court reservation',
                        metadata: payment.metadata,
                    });
                }
            }
        }
        catch (error) {
            console.warn("Could not retrieve payment intents:", error);
        }
        // Get subscriptions (recurring payments)
        try {
            const subscriptions = await stripeClient.subscriptions.list({
                customer: customer.id,
                limit: limit,
                expand: ['data.items.data.price.product'],
            });
            for (const subscription of subscriptions.data) {
                const price = subscription.items.data[0]?.price;
                const product = price?.product;
                orders.push({
                    id: subscription.id,
                    type: 'subscription',
                    status: subscription.status,
                    amount: price?.unit_amount ? price.unit_amount / 100 : 0,
                    currency: price?.currency?.toUpperCase() || 'CAD',
                    created: new Date(subscription.created * 1000),
                    description: (product && typeof product === 'object' && 'name' in product) ? product.name : 'Membership',
                    subscription_type: price?.nickname || 'Standard',
                    cancel_at_period_end: subscription.cancel_at_period_end,
                });
            }
        }
        catch (error) {
            console.warn("Could not retrieve subscriptions:", error);
        }
        // Sort orders by creation date (newest first)
        orders.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
        res.json({
            orders: orders.slice(0, limit), // Apply limit after sorting
            total_count: orders.length,
            customer_id: customer.id,
        });
    }
    catch (error) {
        console.error("Error getting user order history:", error);
        res.status(500).json({ error: "Failed to get order history" });
    }
});
// Check if email already exists
app.post("/api/auth/check-email", async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: "Email is required" });
        }
        const existingUser = await getUserByEmail(email);
        res.json({ exists: !!existingUser });
    }
    catch (error) {
        console.error("Error checking email:", error);
        res.status(500).json({ error: "Failed to check email" });
    }
});
// Better auth routes (now with CORS enabled)
app.all("/api/auth/*", toNodeHandler(auth));
// Database health check endpoints
app.get("/health", async (req, res) => {
    try {
        const health = await DatabaseHealth.checkHealth();
        const stats = await DatabaseHealth.getStats();
        res.status(health.healthy ? 200 : 503).json({
            status: health.healthy ? "healthy" : "unhealthy",
            timestamp: new Date().toISOString(),
            database: {
                healthy: health.healthy,
                issues: health.issues,
                stats: { ...health.stats, ...stats }
            },
            server: {
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                version: process.version
            }
        });
    }
    catch (error) {
        console.error("Health check failed:", error);
        res.status(503).json({
            status: "unhealthy",
            error: "Health check failed",
            timestamp: new Date().toISOString()
        });
    }
});
app.post("/maintenance", async (req, res) => {
    try {
        await DatabaseHealth.performMaintenance();
        res.json({
            success: true,
            message: "Database maintenance completed successfully",
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error("Maintenance failed:", error);
        res.status(500).json({
            success: false,
            error: "Maintenance failed",
            message: error instanceof Error ? error.message : "Unknown error",
            timestamp: new Date().toISOString()
        });
    }
});
async function getContext({ req }) {
    const bookingLoader = createBookingLoader();
    const userLoader = createUserLoader();
    const courtLoader = createCourtLoader();
    const orderLoader = createOrderLoader();
    const context = {
        bookingLoader,
        userLoader,
        courtLoader,
        orderLoader,
        user: null,
    };
    return context;
}
async function startServer() {
    try {
        // Run startup health check
        console.log("🔍 Running startup health check...");
        const health = await DatabaseHealth.checkHealth();
        if (!health.healthy) {
            console.error("❌ Database health check failed:");
            health.issues.forEach(issue => console.error(`  - ${issue}`));
            // Attempt automatic recovery
            console.log("🔧 Attempting automatic maintenance...");
            try {
                await DatabaseHealth.performMaintenance();
                console.log("✅ Maintenance completed, retrying health check...");
                const retryHealth = await DatabaseHealth.checkHealth();
                if (!retryHealth.healthy) {
                    console.error("❌ Database still unhealthy after maintenance");
                    process.exit(1);
                }
            }
            catch (maintenanceError) {
                console.error("❌ Maintenance failed:", maintenanceError);
                process.exit(1);
            }
        }
        console.log("✅ Database health check passed");
        // Get database stats
        const stats = await DatabaseHealth.getStats();
        console.log(`📊 Database stats:`, stats);
        const apolloServer = new ApolloServer({ schema });
        await apolloServer.start();
        app.use("/graphql", apolloMiddleware(apolloServer, { context: getContext }));
        app.listen({ port: PORT }, () => {
            console.log(`✅ Server running on port ${PORT}`);
            console.log(`🔐 Better Auth app listening on port ${PORT}`);
            console.log(`🚀 GraphQL endpoint: /graphql`);
            console.log(`💓 Health check: /health`);
            console.log(`🔧 Maintenance: /maintenance`);
        });
    }
    catch (error) {
        console.error("❌ Failed to start server:", error);
        process.exit(1);
    }
}
startServer().catch(console.error);
