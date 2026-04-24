import type { IResolvers } from "@graphql-tools/utils";

interface Context {
  userLoader: any;
  courtLoader: any;
}

export const orderResolvers: IResolvers = {
  Order: {
    __resolveType(obj: any) {
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
    subscriptionType: async (parent: any, _args: any, context: Context) => {
      return parent?.subscriptionType || null;
    },
    cancelAtPeriodEnd: async (parent: any, _args: any, context: Context) => {
      return parent?.cancelAtPeriodEnd || false;
    }
  },
};
