import { useState } from "react";
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
  userId: string;
}

export const CourtReserve: React.FC<CourtReserveProps> = ({
  courts,
  bookings,
  players,
  userId,
}) => {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(today);
  const [bookingConfirmations, setBookingConfirmations] = useState<{
    [key: string]: {
      playerName: string;
      courtId: number;
      hour: number;
      date: Date;
    } | null;
  }>({});

  const handleBookingSuccess = async (
    selectedPlayerId: string,
    courtId: number,
    hour: number,
    currentDate: Date,
  ) => {
    try {
      const result = await createBooking({
        date: currentDate.toISOString(),
        courtId,
        hour,
        userId,
        player2Id: selectedPlayerId,
      });

      // Find player name for confirmation
      const selectedPlayer = players.find((p) => p.id === selectedPlayerId);

      // Set confirmation for this specific modal
      const modalKey = `${courtId}_${hour}`;
      setBookingConfirmations((prev) => ({
        ...prev,
        [modalKey]: {
          playerName: selectedPlayer?.name || "Unknown Player",
          courtId,
          hour,
          date: currentDate,
        },
      }));

      console.log("Booking created successfully:", result);
    } catch (error) {
      console.error("Booking failed:", error);
      throw error; // Re-throw to handle in PaymentForm
    }
  };

  const closeModal = (courtId: number, hour: number) => {
    const modalKey = `${courtId}_${hour}`;
    setBookingConfirmations((prev) => ({
      ...prev,
      [modalKey]: null,
    }));
    (document.getElementById(`modal_${courtId}_${hour}`) as any)?.close();
  };

  const renderDialog = (
    courtId: number,
    hour: number,
    players: GraphQLUser[],
    currentDate: Date,
  ) => {
    const modalKey = `${courtId}_${hour}`;
    const confirmation = bookingConfirmations[modalKey];
    const courtName =
      courts.find((c) => c.id === courtId)?.name || `Court ${courtId}`;

    return (
      <dialog id={`modal_${courtId}_${hour}`} className="modal">
        <div className="modal-box">
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
                  {confirmation.date.toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                <p>
                  <strong>Player 2:</strong> {confirmation.playerName}
                </p>
              </div>
              <div className="flex justify-end">
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    closeModal(courtId, hour);
                    // Refresh the page to update the booking table
                    window.location.reload();
                  }}
                >
                  Close
                </button>
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
                <div className="text-center py-6">
                  <p className="mb-4 text-gray-600">
                    Click to start your reservation and proceed to payment.
                  </p>
                  <div className="flex gap-2 justify-center">
                    <button className="btn btn-primary" onClick={() => {}}>
                      Book court
                    </button>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => closeModal(courtId, hour)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </dialog>
    );
  };

  return (
    <CourtTable
      courts={courts}
      bookings={bookings}
      players={players}
      userId={userId}
      renderDialog={renderDialog}
    />
  );
};
