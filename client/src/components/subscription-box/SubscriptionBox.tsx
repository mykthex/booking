import React, { useEffect, useRef, useState } from "react";

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
  is_cancelled: boolean;
  cancelled_at: number | null;
}

interface SubscriptionBoxProps {
  userEmail?: string;
  isAuthenticated: boolean;
}

export const SubscriptionBox: React.FC<SubscriptionBoxProps> = ({
  userEmail,
  isAuthenticated,
}) => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSubscriptionId, setCurrentSubscriptionId] = useState<
    string | null
  >(null);

  const loadSubscriptionData = async () => {
    if (!isAuthenticated || !userEmail) {
      setLoading(false);
      return;
    }

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

      if (data.subscription) {
        setSubscription(data.subscription);
        setCurrentSubscriptionId(data.subscription.id);
      } else {
        setSubscription(null);
      }
    } catch (err) {
      console.error("Error loading subscription:", err);
      setError("Error loading subscription data.");
    } finally {
      setLoading(false);
    }
  };

  const cancelSubscription = async () => {
    if (!currentSubscriptionId) {
      alert("No subscription found to cancel");
      return;
    }

    const confirmMessage =
      "Are you sure you want to cancel your subscription? You will keep access until the end of your billing period and will not be refunded.";

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:9000/cancel-subscription",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            subscription_id: currentSubscriptionId,
            cancel_immediately: false,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to cancel subscription");
      }

      const data = await response.json();

      if (data.success) {
        alert(
          "Subscription will be cancelled at the end of the billing period.",
        );
        // Reload subscription data
        loadSubscriptionData();
      } else {
        throw new Error("Cancellation failed");
      }
    } catch (err) {
      console.error("Error canceling subscription:", err);
      alert("Failed to cancel subscription. Please try again.");
    }
  };

  const reactivateSubscription = async () => {
    if (!currentSubscriptionId) {
      alert("No subscription found to reactivate");
      return;
    }

    const confirmMessage =
      "Are you sure you want to reactivate your subscription? Your subscription will continue and you'll be billed at the end of the current period.";

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:9000/reactivate-subscription",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            subscription_id: currentSubscriptionId,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to reactivate subscription");
      }

      const data = await response.json();

      if (data.success) {
        alert("Subscription has been reactivated successfully!");
        // Reload subscription data
        loadSubscriptionData();
      } else {
        throw new Error("Reactivation failed");
      }
    } catch (err) {
      console.error("Error reactivating subscription:", err);
      alert("Failed to reactivate subscription. Please try again.");
    }
  };

  useEffect(() => {
    loadSubscriptionData();
  }, [userEmail, isAuthenticated]);

  return (
    <div className="card w-96 bg-base-100 card-lg shadow-sm">
      <div className="card-body">
        <h2 className="card-title">Subscription</h2>

        {loading && (
          <div className="text-center py-4">
            <span className="loading loading-spinner loading-md"></span>
            <p className="mt-2">Loading subscription...</p>
          </div>
        )}

        {error && <p className="text-error">{error}</p>}

        {!loading && !error && (!subscription || subscription.is_cancelled) && (
          <div>
            <p className="text-warning">
              No active subscription found. Your subscription has been cancelled
              on{" "}
              {subscription?.cancelled_at
                ? new Date(
                    subscription.cancelled_at * 1000,
                  ).toLocaleDateString()
                : "N/A"}
              .
            </p>
            <div className="card-actions justify-end mt-4">
              <a href="/subscribe" className="btn btn-primary">
                Subscribe Now
              </a>
            </div>
          </div>
        )}
        {!loading && !error && subscription && !subscription.is_cancelled && (
          <div>
            <div className="space-y-2">
              <p>
                <strong>Plan:</strong> {subscription.subscription_type}
              </p>
              <p>
                <strong>Amount:</strong> ${subscription.amount}{" "}
                {subscription.currency.toUpperCase()}/month
              </p>
              <p>
                <strong>Status:</strong>{" "}
                <span className="badge badge-success">
                  {subscription.status}
                </span>
              </p>
              <p>
                <strong>Next billing:</strong>{" "}
                {new Date(subscription.current_period_end).toLocaleDateString()}
              </p>
              {subscription.cancel_at_period_end && (
                <div className="mt-2 p-2 bg-warning/20 rounded">
                  <p className="text-warning text-sm">
                    Your subscription will be cancelled at the end of the
                    current period. No refund will be provided and you'll keep
                    access until then.
                  </p>
                </div>
              )}
            </div>
            <div className="card-actions justify-end mt-4">
              <button
                className={`btn btn-sm ${subscription.cancel_at_period_end ? "btn-warning" : "btn-error"}`}
                onClick={
                  subscription.cancel_at_period_end
                    ? reactivateSubscription
                    : cancelSubscription
                }
              >
                {subscription.cancel_at_period_end
                  ? "Reactivate Subscription"
                  : "Cancel Subscription"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
