import { useState } from "react";
import type {
  GraphQLBooking,
  GraphQLCourt,
  GraphQLUser,
} from "../../lib/graphql/.generatedTypes";
import classNames from "classnames";
import { createBooking } from "../../lib/graphql";
import { StripeWrapper } from "../stripe/StripeWrapper";
import { PaymentForm } from "../payment-form/PaymentForm";

interface CourtReserveProps {
  courts: GraphQLCourt[];
  bookings: GraphQLBooking[];
  players: GraphQLUser[];
  userId: string;
}

const isSlotBooked = (
  currentDate: Date,
  hour: number,
  courtId?: number | null,
  bookings?: GraphQLBooking[],
) => {
  if (!courtId || !bookings) return false;

  const todayString = currentDate.toISOString().split("T")[0];

  return bookings.some((slot) => {
    if (!slot.date || !slot.hour) return false;
    const slotDate = slot.date.split("T")[0];

    return (
      slotDate === todayString &&
      parseInt(slot.hour) === hour &&
      slot.courtId === courtId
    );
  });
};

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
  const [paymentSessions, setPaymentSessions] = useState<{
    [key: string]: { client_secret: string; payment_intent_id: string } | null;
  }>({});

  const createCheckoutSession = async (
    courtId: number,
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
    setPaymentSessions((prev) => ({
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
    const paymentSession = paymentSessions[modalKey];
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
                {paymentSession?.client_secret ? (
                  <StripeWrapper clientSecret={paymentSession.client_secret}>
                    <PaymentForm
                      courtId={courtId}
                      hour={hour}
                      currentDate={currentDate}
                      players={players}
                      userId={userId}
                      onPaymentSuccess={(selectedPlayerId) =>
                        handlePaymentSuccess(
                          selectedPlayerId,
                          courtId,
                          hour,
                          currentDate,
                        )
                      }
                      onCancel={() => closeModal(courtId, hour)}
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
                        type="button"
                        className="btn"
                        onClick={() => closeModal(courtId, hour)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </dialog>
    );
  };

  const hours = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
  const canPrev = currentDate > today;
  const canNext =
    currentDate < new Date(today.getTime() + 6 * 24 * 60 * 60 * 1000);
  const isToday = currentDate.toDateString() === today.toDateString();

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-semibold">
          {currentDate.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </h2>
      </div>
      <div className="mb-4 flex justify-between">
        <button
          className={classNames("btn btn-soft", { "btn-disabled": !canPrev })}
          onClick={() => {
            if (canPrev) {
              setCurrentDate(
                new Date(currentDate.setDate(currentDate.getDate() - 1)),
              );
            }
          }}
        >
          Prev day
        </button>
        <button
          className={classNames("btn btn-soft", { "btn-disabled": !canNext })}
          onClick={() => {
            if (canNext) {
              setCurrentDate(
                new Date(currentDate.setDate(currentDate.getDate() + 1)),
              );
            }
          }}
        >
          Next day
        </button>
      </div>
      <div className="overflow-x-auto rounded-box border border-base-content/5 bg-base-100">
        <table className="table">
          <thead>
            <tr>
              <th></th>
              {courts.map((court, key) => (
                <th key={key}>{court.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hours.map((hour, rowIndex) => {
              if (isToday && hour <= today.getHours()) {
                return (
                  <tr key={rowIndex} className="opacity-50">
                    <td>{hour}h</td>
                    {courts.map((court, key) => (
                      <td key={key}>
                        <span className="text-gray-500">-</span>
                      </td>
                    ))}
                  </tr>
                );
              }

              return (
                <tr key={rowIndex}>
                  <td>{hour}h</td>
                  {courts.map((court, key) => (
                    <td key={key}>
                      {isSlotBooked(currentDate, hour, court?.id, bookings) ? (
                        <span className="text-red-500 font-medium">Booked</span>
                      ) : (
                        <>
                          <button
                            className="btn btn-success"
                            onClick={() =>
                              (
                                document.getElementById(
                                  `modal_${court.id}_${hour}`,
                                ) as any
                              )?.showModal()
                            }
                          >
                            Réserver
                          </button>
                          {court.id &&
                            hour &&
                            renderDialog(court.id, hour, players, currentDate)}
                        </>
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
