import { useState } from "react";
import type { GraphQLUser } from "../../lib/graphql/.generatedTypes";
import classNames from "classnames";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Field } from "../field/Field";

interface PaymentFormProps {
  courtId: number;
  hour: number;
  currentDate: Date;
  players: GraphQLUser[];
  userId: string;
  onPaymentSuccess: (selectedPlayerId: string) => Promise<void>;
  onCancel: () => void;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  courtId,
  hour,
  currentDate,
  players,
  userId,
  onPaymentSuccess,
  onCancel,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setPaymentError("Stripe is not loaded");
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    const formData = new FormData(event.currentTarget);
    const selectedPlayerId = formData.get("player") as string;

    if (!selectedPlayerId) {
      setPaymentError("Please select a player");
      setIsProcessing(false);
      return;
    }

    try {
      // Confirm the payment
      const { error: paymentError, paymentIntent } =
        await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: `${window.location.origin}/payment-success`,
          },
          redirect: "if_required",
        });

      if (paymentError) {
        console.error("Payment failed:", paymentError);
        setPaymentError(paymentError.message || "Payment failed");
        setIsProcessing(false);
        return;
      }

      // Verify payment on server-side for extra security
      if (paymentIntent?.id) {
        const verificationResponse = await fetch(
          "http://localhost:9000/verify-payment",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              payment_intent_id: paymentIntent.id,
            }),
          },
        );

        const verificationData = await verificationResponse.json();

        if (!verificationData.success) {
          setPaymentError("Payment verification failed");
          setIsProcessing(false);
          return;
        }
      }

      // Payment successful and verified, create the booking
      await onPaymentSuccess(selectedPlayerId);
    } catch (error) {
      console.error("Error during payment:", error);
      setPaymentError("An error occurred during payment processing");
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex flex-col">
        <div>
          <Field
            label="Pick player 2"
            name="player"
            type="select"
            disabled={isProcessing}
            required
            value=""
            defaultValue=""
            options={[
              { value: "", label: "Pick player 2" },
              ...players
                .filter((player) => player?.id && player.id !== userId)
                .map((player) => ({
                  value: player.id!,
                  label: player.name!,
                })),
            ]}
          />
          <div className="mt-4 p-4 border border-gray-200 rounded">
            <h4 className="font-medium mb-2">Payment Details:</h4>
            <PaymentElement
              options={{
                business: { name: "Court Booking System" },
              }}
            />
          </div>

          {paymentError && (
            <div className="alert alert-error mt-2">
              <span>{paymentError}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-4">
          <button
            type="submit"
            className={classNames("btn btn-success flex-1", {
              loading: isProcessing,
            })}
            disabled={!stripe || !elements || isProcessing}
          >
            {isProcessing
              ? "Processing..."
              : "Complete Reservation & Pay $20.00"}
          </button>
          <button
            type="button"
            className="btn"
            onClick={onCancel}
            disabled={isProcessing}
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
};
