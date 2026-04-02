import { useState } from "react";
import type {
  GraphQLBooking,
  GraphQLCourt,
  GraphQLUser,
} from "../../lib/graphql/.generatedTypes";
import { createBooking } from "../../lib/graphql";
import { CourtTable } from "../court-table/CourtTable";
import { BookingFormAdmin } from "../booking-form-admin/BookingFormAdmin";

interface CourtReserveAdminProps {
  courts: GraphQLCourt[];
  bookings: GraphQLBooking[];
  players: GraphQLUser[];
  userId: string;
}

export const CourtReserveAdmin: React.FC<CourtReserveAdminProps> = ({
  courts,
  bookings,
  players,
  userId,
}) => {
  const [bookingConfirmations, setBookingConfirmations] = useState<{
    [key: string]: {
      player1: string;
      player2: string;
      courtId: number;
      hour: number;
      date: Date;
    } | null;
  }>({});

  const handleBookingSuccess = async (
    selectedPlayer1Id: string,
    selectedPlayer2Id: string,
    courtId: number,
    hour: number,
    currentDate: Date,
    isPaid: boolean,
  ) => {
    try {
      const result = await createBooking({
        date: currentDate.toISOString(),
        courtId,
        hour,
        userId: selectedPlayer2Id,
        player2Id: selectedPlayer1Id,
        paid: isPaid,
      });

      // Find player name for confirmation
      const selectedPlayer1 = players.find((p) => p.id === selectedPlayer1Id);
      const selectedPlayer2 = players.find((p) => p.id === selectedPlayer2Id);

      // Set confirmation for this specific modal
      const modalKey = `${courtId}_${hour}`;
      setBookingConfirmations((prev) => ({
        ...prev,
        [modalKey]: {
          player1: selectedPlayer1?.name || "Unknown Player",
          player2: selectedPlayer2?.name || "Unknown Player",
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
                  <strong>Player 1:</strong> {confirmation.player1}
                </p>
                <p>
                  <strong>Player 2:</strong> {confirmation.player2}
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
                .
              </p>
              <BookingFormAdmin
                players={players}
                userId={userId}
                courtId={courtId}
                hour={hour}
                currentDate={currentDate}
                onFormSuccess={(selectedPlayer1Id, selectedPlayer2Id, isPaid) =>
                  handleBookingSuccess(
                    selectedPlayer1Id,
                    selectedPlayer2Id,
                    courtId,
                    hour,
                    currentDate,
                    isPaid,
                  )
                }
                onCancel={() => closeModal(courtId, hour)}
              />
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
