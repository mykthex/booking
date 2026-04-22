import React, { useEffect, useRef, useState } from "react";
import { 
  getUserSubscription, 
  cancelSubscription as cancelUserSubscription, 
  reactivateSubscription as reactivateUserSubscription,
  isSubscriptionValid 
} from "../../lib/subscription-utils";

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

  // Modal state
  const [modal, setModal] = useState<{
    isOpen: boolean;
    type: "confirm" | "alert";
    title: string;
    message: string;
    onConfirm?: () => void;
    confirmText?: string;
    cancelText?: string;
  }>({
    isOpen: false,
    type: "alert",
    title: "",
    message: "",
  });

  const showModal = (
    type: "confirm" | "alert",
    title: string,
    message: string,
    onConfirm?: () => void,
    confirmText: string = "OK",
    cancelText: string = "Cancel",
  ) => {
    setModal({
      isOpen: true,
      type,
      title,
      message,
      onConfirm,
      confirmText,
      cancelText,
    });
  };

  const closeModal = () => {
    setModal((prev) => ({ ...prev, isOpen: false }));
  };

  const handleConfirm = () => {
    if (modal.onConfirm) {
      modal.onConfirm();
    }
    closeModal();
  };

  const loadSubscriptionData = async () => {
    if (!isAuthenticated || !userEmail) {
      setLoading(false);
      return;
    }

    try {
      const subscriptionData = await getUserSubscription(userEmail);
      
      if (subscriptionData) {
        setSubscription(subscriptionData);
        setCurrentSubscriptionId(subscriptionData.id);
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
      showModal("alert", "Error", "No subscription found to cancel");
      return;
    }

    const performCancel = async () => {
      try {
        const data = await cancelUserSubscription(currentSubscriptionId, false);

        if (data.success) {
          showModal(
            "alert",
            "Success",
            "Subscription will be cancelled at the end of the billing period.",
          );
          // Reload subscription data
          loadSubscriptionData();
        } else {
          throw new Error("Cancellation failed");
        }
      } catch (err) {
        console.error("Error canceling subscription:", err);
        showModal(
          "alert",
          "Error",
          "Failed to cancel subscription. Please try again.",
        );
      }
    };

    showModal(
      "confirm",
      "Cancel Subscription",
      "Are you sure you want to cancel your subscription? You will keep access until the end of your billing period and will not be refunded.",
      performCancel,
      "Yes, Cancel",
      "Keep Subscription",
    );
  };

  const reactivateSubscription = async () => {
    if (!currentSubscriptionId) {
      showModal("alert", "Error", "No subscription found to reactivate");
      return;
    }

    const performReactivation = async () => {
      try {
        const data = await reactivateUserSubscription(currentSubscriptionId);

        if (data.success) {
          showModal(
            "alert",
            "Success",
            "Subscription has been reactivated successfully!",
          );
          // Reload subscription data
          loadSubscriptionData();
        } else {
          throw new Error("Reactivation failed");
        }
      } catch (err) {
        console.error("Error reactivating subscription:", err);
        showModal(
          "alert",
          "Error",
          "Failed to reactivate subscription. Please try again.",
        );
      }
    };

    showModal(
      "confirm",
      "Reactivate Subscription",
      "Are you sure you want to reactivate your subscription? Your subscription will continue and you'll be billed at the end of the current period.",
      performReactivation,
      "Yes, Reactivate",
      "Cancel",
    );
  };

  useEffect(() => {
    loadSubscriptionData();
  }, [userEmail, isAuthenticated]);

  return (
    <>
      <div className="card w-96 bg-base-200 card-lg shadow-sm">
        <div className="card-body">
          <h2 className="card-title">Subscription</h2>

          {loading && (
            <div className="text-center py-4">
              <span className="loading loading-spinner loading-md"></span>
              <p className="mt-2">Loading subscription...</p>
            </div>
          )}

          {error && <p className="text-error">{error}</p>}

          {!loading &&
            !error &&
            (!subscription || subscription.is_cancelled) && (
              <div>
                <p className="text-warning">No active subscription found.</p>
                <div className="card-actions justify-end mt-4">
                  <a href="/subscribe" className="btn btn-neutral">
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
                  {new Date(
                    subscription.current_period_end,
                  ).toLocaleDateString()}
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

      {/* Modal/Lightbox */}
      {modal.isOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-900">
              {modal.title}
            </h3>
            <p className="text-gray-700 mb-6">{modal.message}</p>
            <div className="flex gap-3 justify-end">
              {modal.type === "confirm" ? (
                <>
                  <button className="btn btn-outline" onClick={closeModal}>
                    {modal.cancelText}
                  </button>
                  <button className="btn btn-neutral" onClick={handleConfirm}>
                    {modal.confirmText}
                  </button>
                </>
              ) : (
                <button className="btn btn-neutral" onClick={closeModal}>
                  OK
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
