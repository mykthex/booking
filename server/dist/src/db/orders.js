import DataLoader from "dataloader";
import { Stripe } from "stripe";
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY environment variable");
}
const stripe = new Stripe(stripeSecretKey);
export async function getUserOrderHistory(input) {
    const { userEmail, userId, limit = 20 } = input;
    const allOrders = [];
    // Get Stripe order history if email provided
    if (userEmail) {
        try {
            const customers = await stripe.customers.list({
                email: userEmail,
                limit: 1,
            });
            if (customers.data.length > 0) {
                const customer = customers.data[0];
                // Get payment intents
                const paymentIntents = await stripe.paymentIntents.list({
                    customer: customer.id,
                    limit: Math.min(limit, 50),
                });
                paymentIntents.data.forEach(payment => {
                    if (payment.status === 'succeeded') {
                        allOrders.push({
                            id: payment.id,
                            type: 'Payment',
                            status: payment.status,
                            amount: payment.amount / 100,
                            currency: payment.currency.toUpperCase(),
                            created: new Date(payment.created * 1000).toISOString(),
                            description: payment.description || 'Court reservation payment',
                        });
                    }
                });
                // Get subscriptions
                const subscriptions = await stripe.subscriptions.list({
                    customer: customer.id,
                    limit: Math.min(limit, 20),
                    expand: ['data.items.data.price'],
                });
                subscriptions.data.forEach(subscription => {
                    const price = subscription.items.data[0]?.price;
                    const product = price?.product;
                    allOrders.push({
                        id: subscription.id,
                        type: 'Subscription',
                        status: subscription.status,
                        amount: price?.unit_amount ? price.unit_amount / 100 : 0,
                        currency: price?.currency?.toUpperCase() || 'CAD',
                        created: new Date(subscription.created * 1000).toISOString(),
                        description: (product && typeof product === 'object' && 'name' in product) ? product.name : 'Membership subscription',
                        cancelAtPeriodEnd: subscription.cancel_at_period_end,
                        subscriptionType: price?.nickname || 'Standard',
                    });
                });
            }
        }
        catch (error) {
            console.warn("Could not retrieve Stripe history:", error);
        }
    }
    // Sort all orders by creation date (newest first)
    allOrders.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
    return allOrders.slice(0, limit);
}
// DataLoader for user order history
export function createOrderLoader() {
    return new DataLoader(async (inputs) => {
        // Since each input can have different parameters, we'll process them individually
        const promises = inputs.map(input => getUserOrderHistory(input));
        return await Promise.all(promises);
    });
}
