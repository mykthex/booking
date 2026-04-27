import { useState, useEffect } from "react";
import type {
  GraphQLBooking,
  GraphQLCourt,
  GraphQLUser,
} from "../../lib/graphql/.generatedTypes";
import { createBooking } from "../../lib/graphql";
import { StripeWrapper } from "../stripe/StripeWrapper";
import { PaymentForm } from "../payment-form/PaymentForm";
import { CourtTable } from "../court-table/CourtTable";
import { BookingListItem } from "../booking-list-item";
import { PaymentReceipt } from "../payment-receipt";
import { PaymentDetail } from "../payment-detail";

interface CourtReserveProps {
  courts: GraphQLCourt[];
  bookings: GraphQLBooking[];
  players: GraphQLUser[];
  user: GraphQLUser;
}

export const CourtReserve: React.FC<CourtReserveProps> = ({
  courts,
  bookings: initialBookings,
  players,
  user,
}) => {
  const [bookings, setBookings] = useState(initialBookings);

  // Sync local bookings state with prop updates
  useEffect(() => {
    setBookings(initialBookings);
  }, [initialBookings]);
  
  const [bookingConfirmation, setBookingConfirmation] = useState<{
    playerName: string;
    courtId: string;
    hour: number;
    date: string;
    amount?: number;
    currency?: string;
    paymentMethodType?: string;
    paymentMethodLast4?: string;
    paymentIntentId?: string;
  } | null>(null);
  const [paymentSession, setPaymentSession] = useState<{ 
    client_secret: string; 
    payment_intent_id: string; 
    customer_id: string | null;
    amount?: number;
    currency?: string;
  } | null>(null);

  const createCheckoutSession = async (
    courtId: string,
    hour: number,
    currentDate: Date,
  ) => {
    try {
      const response = await fetch(
        "http://localhost:9000/create-checkout-session",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            courtId,
            hour,
            customer_email: user.email,
            date: currentDate.toISOString(),
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to create payment intent");
      }

      const paymentData = await response.json();

      setPaymentSession({
        client_secret: paymentData.client_secret,
        payment_intent_id: paymentData.payment_intent_id,
        customer_id: paymentData.customer_id,
        amount: paymentData.amount,
        currency: paymentData.currency,
      });

      return paymentData;
    } catch (error) {
      console.error("Error creating payment intent:", error);
      throw error;
    }
  };

  const handlePaymentSuccess = async (
    selectedPlayerId: string,
    courtId: string,
    hour: number,
    currentDate: Date,
  ) => {
    try {
      const result = await createBooking({
        date: currentDate.toISOString(),
        courtId,
        hour,
        userId: user.id,
        player2Id: selectedPlayerId,
        paid: true,
      });

      // Find player names for the new booking
      const currentUser = players.find((p) => p.id === user.id);
      const selectedPlayer = players.find((p) => p.id === selectedPlayerId);

      // Create new booking object to add to state
      const newBooking: GraphQLBooking = {
        id: result.id,
        date: currentDate.toISOString(),
        courtId,
        hour: hour.toString(),
        player1: `${currentUser?.name} ${currentUser?.surname}` || "You",
        player1Id: user.id,
        player2: `${selectedPlayer?.name} ${selectedPlayer?.surname}` || "Unknown Player",
        player2Id: selectedPlayerId,
        paid: true,
      };

      // Fetch real payment method details
      let paymentMethodType = "card";
      let paymentMethodLast4 = "****";
      
      if (paymentSession?.payment_intent_id) {
        try {
          const paymentDetailsResponse = await fetch(
            "http://localhost:9000/get-payment-details",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                payment_intent_id: paymentSession.payment_intent_id,
              }),
            },
          );

          if (paymentDetailsResponse.ok) {
            const paymentDetails = await paymentDetailsResponse.json();
            if (paymentDetails.payment_method) {
              paymentMethodType = paymentDetails.payment_method.brand || paymentDetails.payment_method.type || "card";
              paymentMethodLast4 = paymentDetails.payment_method.last4 || "****";
            }
          }
        } catch (error) {
          console.warn("Could not fetch payment details:", error);
          // Will use fallback values
        }
      }

      // Set confirmation for the modal
      setBookingConfirmation({
        playerName: `${selectedPlayer?.name} ${selectedPlayer?.surname}` || "Unknown Player",
        courtId,
        hour,
        date: currentDate.toISOString(), // Store as ISO string to prevent hydration issues
        amount: paymentSession?.amount,
        currency: paymentSession?.currency,
        paymentIntentId: paymentSession?.payment_intent_id,
        paymentMethodType,
        paymentMethodLast4,
      });

      setPaymentSession(null); // Clear payment session after successful booking

      // Update bookings state with new booking
      setBookings((prev) => [...prev, newBooking]);
    } catch (error) {
      console.error("Booking failed:", error);
      throw error; // Re-throw to handle in PaymentForm
    }
  };

  const renderDialogContent = (
    courtId: string,
    hour: number,
    players: GraphQLUser[],
    currentDate: Date,
    closeFunction: () => void,
  ) => {
    // Check if confirmation exists and matches this court/hour
    const confirmation = bookingConfirmation && 
      bookingConfirmation.courtId === courtId && 
      bookingConfirmation.hour === hour 
      ? bookingConfirmation 
      : null;
    const courtName =
      courts.find((c) => c.id === courtId)?.name || `Court ${courtId}`;

    return (
      <>
        {confirmation ? (
          <div>
            <h3 className="font-bold text-lg">
              Booking Confirmed
            </h3>
            <div className="py-4 space-y-2">
              <BookingListItem
                date={confirmation.date}
                courtName={courtName}
                hour={String(confirmation.hour)}
                player1={`${user.name} ${user.surname}`}
                player2={confirmation.playerName}
              />
              {confirmation.amount && confirmation.currency && (
                <PaymentReceipt
                  paymentIntentId={confirmation.paymentIntentId}
                  paymentMethodLast4={confirmation.paymentMethodLast4}
                  paymentMethodType={confirmation.paymentMethodType}
                  amount={confirmation.amount}
                  currency={confirmation.currency}
                />
              )}
              <div className="flex justify-end mt-4">
                <button
                  className="btn btn-primary"
                  onClick={closeFunction}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <h3 className="font-bold text-lg">
              Book {courtName} at {hour}:00
            </h3>
            <div className="py-4">
              <BookingListItem
                date={currentDate.toISOString()}
                courtName={courtName}
                hour={String(hour)}
                player1={`${user.name} ${user.surname}`}
                player2={"TBD"}
              />
              {paymentSession?.amount && paymentSession?.currency && (
                <PaymentDetail
                  amount={paymentSession.amount}
                  currency={paymentSession.currency}
                />
              )}
            </div>
            <div>
              {(paymentSession?.client_secret && user.id) ? (
                <StripeWrapper clientSecret={paymentSession.client_secret}>
                  <PaymentForm
                    courtId={courtId}
                    hour={hour}
                    currentDate={currentDate}
                    players={players}
                    userId={user.id}
                    onPaymentSuccess={(selectedPlayerId) =>
                      handlePaymentSuccess(
                        selectedPlayerId,
                        courtId,
                        hour,
                        currentDate,
                      )
                    }
                    onCancel={() => {
                      closeFunction();
                      setPaymentSession(null);
                    }}
                  />
                </StripeWrapper>
              ) : (
                <div className="text-center pb-6">
                  <p className="mb-4 text-gray-600">
                    Click to start your reservation and proceed to payment.
                  </p>
                  <div className="flex gap-2 justify-center">
                    <button
                      className="btn btn-neutral"
                      onClick={() =>
                        createCheckoutSession(courtId, hour, currentDate)
                      }
                    >
                      Start Reservation
                    </button>
                    <button
                      className="btn"
                      onClick={closeFunction}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <CourtTable
      courts={courts}
      bookings={bookings}
      players={players}
      user={user}
      renderDialogContent={renderDialogContent}
    />
  );
};
