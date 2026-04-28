interface Subscription {
  id: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  product_name: string;
  amount: number;
  currency: string;
  subscription_type: string;
  description: string;
  price_nickname: string | null;
  price_metadata: Record<string, any>;
  lookup_key: string | null;
  is_cancelled: boolean;
  cancelled_at: number | null;
}

export interface SubscriptionStatus {
  subscription: Subscription | null;
  isValid: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Fetch user subscription data from the server
 */
export const getUserSubscription = async (userEmail: string): Promise<Subscription | null> => {
  try {
    const response = await fetch(
      "http://localhost:9000/get-user-subscription",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ customer_email: userEmail }),
      },
    );

    if (!response.ok) {
      throw new Error("Failed to fetch subscription");
    }

    const data = await response.json();
    return data.subscription || null;
  } catch (error) {
    console.error("Error loading subscription:", error);
    throw error;
  }
};

/**
 * Check if a subscription is valid and active
 */
export const isSubscriptionValid = (subscription: Subscription | null): boolean => {
  if (!subscription) {
    return false;
  }

  // Check if subscription is active and not cancelled
  const isActive = subscription.status === "active";
  const isNotCancelled = !subscription.is_cancelled;
  
  // Check if we're still in the valid period (even if cancel_at_period_end is true)
  const currentDate = new Date();
  const periodEnd = new Date(subscription.current_period_end);
  const isInValidPeriod = currentDate <= periodEnd;

  return isActive && isNotCancelled && isInValidPeriod;
};

/**
 * Hook-like function to get subscription status
 */
export const getSubscriptionStatus = async (userEmail?: string, isAuthenticated: boolean = false): Promise<SubscriptionStatus> => {
  if (!isAuthenticated || !userEmail) {
    return {
      subscription: null,
      isValid: false,
      isLoading: false,
      error: null,
    };
  }

  try {
    const subscription = await getUserSubscription(userEmail);
    
    return {
      subscription,
      isValid: isSubscriptionValid(subscription),
      isLoading: false,
      error: null,
    };
  } catch (error) {
    return {
      subscription: null,
      isValid: false,
      isLoading: false,
      error: error instanceof Error ? error.message : "Failed to load subscription",
    };
  }
};

/**
 * Cancel a subscription
 */
export const cancelSubscription = async (subscriptionId: string, cancelImmediately: boolean = false) => {
  const response = await fetch(
    "http://localhost:9000/cancel-subscription",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        subscription_id: subscriptionId,
        cancel_immediately: cancelImmediately,
      }),
    },
  );

  if (!response.ok) {
    throw new Error("Failed to cancel subscription");
  }

  return response.json();
};

/**
 * Reactivate a subscription
 */
export const reactivateSubscription = async (subscriptionId: string) => {
  const response = await fetch(
    "http://localhost:9000/reactivate-subscription",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        subscription_id: subscriptionId,
      }),
    },
  );

  if (!response.ok) {
    throw new Error("Failed to reactivate subscription");
  }

  return response.json();
};

/**
 * Subscription plan interface
 */
export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: string;
  features: string[];
  priceId: string;
  productId: string;
}

/**
 * Get available subscription plans
 */
export const getSubscriptionPlans = async (): Promise<SubscriptionPlan[]> => {
  try {
    const response = await fetch("http://localhost:9000/subscription/plans");

    if (!response.ok) {
      throw new Error("Failed to fetch subscription plans");
    }

    const data = await response.json();
    return data.plans || [];
  } catch (error) {
    console.error("Error loading subscription plans:", error);
    throw error;
  }
};

/**
 * Upgrade subscription to a new plan
 */
export const upgradeSubscription = async (subscriptionId: string, newPlan: string) => {
  try {
    const response = await fetch("http://localhost:9000/subscription/upgrade", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        subscriptionId,
        newPlan,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to upgrade subscription");
    }

    return response.json();
  } catch (error) {
    console.error("Error upgrading subscription:", error);
    throw error;
  }
};