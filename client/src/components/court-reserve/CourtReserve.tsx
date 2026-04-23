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
  } | null>(null);
  const [paymentSessions, setPaymentSessions] = useState<{
    [key: string]: { client_secret: string; payment_intent_id: string } | null;
  }>({});

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
            date: currentDate.toISOString(),
            amount: 2000, // $20.00 in cents
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to create payment intent");
      }

      const paymentData = await response.json();
      const modalKey = `${courtId}_${hour}`;

      setPaymentSessions((prev) => ({
        ...prev,
        [modalKey]: {
          client_secret: paymentData.client_secret,
          payment_intent_id: paymentData.payment_intent_id,
        },
      }));

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
        player1: currentUser?.name || "You",
        player1Id: user.id,
        player2: selectedPlayer?.name || "Unknown Player",
        player2Id: selectedPlayerId,
        paid: true,
      };

      // Set confirmation for the modal
      setBookingConfirmation({
        playerName: selectedPlayer?.name || "Unknown Player",
        courtId,
        hour,
        date: currentDate.toISOString(), // Store as ISO string to prevent hydration issues
      });

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
    const modalKey = `${courtId}_${hour}`;
    // Check if confirmation exists and matches this court/hour
    const confirmation = bookingConfirmation && 
      bookingConfirmation.courtId === courtId && 
      bookingConfirmation.hour === hour 
      ? bookingConfirmation 
      : null;
    const paymentSession = paymentSessions[modalKey];
    const courtName =
      courts.find((c) => c.id === courtId)?.name || `Court ${courtId}`;

    return (
      <>
        {confirmation ? (
          <div>
            <h3 className="font-bold text-lg text-green-600">
              Booking Confirmed!
            </h3>
            <div className="py-4 space-y-2">
              <p>
                <strong>Court:</strong> {courtName}
              </p>
              <p>
                <strong>Time:</strong> {confirmation.hour}:00
              </p>
              <p>
                <strong>Date:</strong>{" "}
                {new Date(confirmation.date).toLocaleDateString("en-CA")} {/* Use consistent ISO format YYYY-MM-DD */}
              </p>
              <p>
                <strong>Player 2:</strong> {confirmation.playerName}
              </p>
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
              Reserve {courtName} at {hour}:00
            </h3>
            <p className="py-4">
              You are about to reserve {courtName} at {hour}:00 on{" "}
              {currentDate.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
              . Price: <strong>$20.00 CAD</strong>
            </p>
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
                    onCancel={closeFunction}
                  />
                </StripeWrapper>
              ) : (
                <div className="text-center py-6">
                  <p className="mb-4 text-gray-600">
                    Click to start your reservation and proceed to payment.
                  </p>
                  <div className="flex gap-2 justify-center">
                    <button
                      className="btn btn-primary"
                      onClick={() =>
                        createCheckoutSession(courtId, hour, currentDate)
                      }
                    >
                      Start Reservation - $20.00
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
