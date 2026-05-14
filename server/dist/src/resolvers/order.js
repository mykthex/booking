export const orderResolvers = {
    Order: {
        __resolveType(obj) {
            // Determine the type based on the object properties
            if (obj.type === 'stripe_subscription' || obj.subscriptionType || obj.cancelAtPeriodEnd !== undefined) {
                return 'Subscription';
            }
            // For stripe_payment and booking types
            if (obj.type === 'stripe_payment' || obj.type === 'booking') {
                return 'BookingPayment';
            }
            // Default fallback
            return 'BookingPayment';
        }
    },
    Subscription: {
        subscriptionType: async (parent, _args, context) => {
            return parent?.subscriptionType || null;
        },
        cancelAtPeriodEnd: async (parent, _args, context) => {
            return parent?.cancelAtPeriodEnd || false;
        }
    },
};
