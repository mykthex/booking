import { useState } from "react";
import type {
  GraphQLBooking,
  GraphQLCourt,
  GraphQLUser,
} from "../../lib/graphql/.generatedTypes";
import classNames from "classnames";
import { deleteBooking } from "../../lib/graphql";

interface CourtTableProps {
  courts: GraphQLCourt[];
  bookings: GraphQLBooking[];
  players: GraphQLUser[];
  isAdmin?: boolean;
  userId: string;
  renderDialog: (
    courtId: number,
    hour: number,
    players: GraphQLUser[],
    currentDate: Date,
  ) => React.ReactNode;
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

export const CourtTable: React.FC<CourtTableProps> = ({
  courts,
  bookings,
  players,
  isAdmin,
  userId,
  renderDialog,
}) => {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(today);
  const [selectedBooking, setSelectedBooking] = useState<GraphQLBooking | null>(
    null,
  );
  const [showBookingModal, setShowBookingModal] = useState(false);

  const getBookingForSlot = (
    currentDate: Date,
    hour: number,
    courtId?: number | null,
  ): GraphQLBooking | null => {
    if (!courtId || !bookings) return null;

    const todayString = currentDate.toISOString().split("T")[0];

    return (
      bookings.find((slot) => {
        if (!slot.date || !slot.hour) return false;
        const slotDate = slot.date.split("T")[0];

        return (
          slotDate === todayString &&
          parseInt(slot.hour) === hour &&
          slot.courtId === courtId
        );
      }) || null
    );
  };

  const showBookingDetails = (booking: GraphQLBooking) => {
    setSelectedBooking(booking);
    setShowBookingModal(true);
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
                        isAdmin ? (
                          <button
                            className="btn btn-warning"
                            onClick={() => {
                              const booking = getBookingForSlot(
                                currentDate,
                                hour,
                                court?.id,
                              );
                              if (booking) {
                                showBookingDetails(booking);
                              }
                            }}
                          >
                            Booked
                          </button>
                        ) : (
                          <span className="text-red-500 font-medium">
                            Booked
                          </span>
                        )
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

      {/* Booking Details Modal */}
      {showBookingModal && selectedBooking && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">
              Booking Details
            </h3>
            <div className="space-y-3 text-gray-700">
              <div>
                <strong>Booking ID:</strong> {selectedBooking.id || "N/A"}
              </div>
              <div>
                <strong>Date:</strong>{" "}
                {selectedBooking.date
                  ? new Date(selectedBooking.date).toLocaleDateString()
                  : "N/A"}
              </div>
              <div>
                <strong>Time:</strong> {selectedBooking.hour}:00
              </div>
              <div>
                <strong>Court:</strong> {selectedBooking.courtName || "N/A"}
              </div>
              <div>
                <strong>Player 1:</strong> {selectedBooking.player1 || "N/A"}
              </div>
              <div>
                <strong>Player 2:</strong> {selectedBooking.player2 || "N/A"}
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                className="btn btn-error"
                onClick={async () => {
                  if (selectedBooking) {
                    const success = await deleteBooking(selectedBooking.id);
                    if (success) {
                      setShowBookingModal(false);
                      // Optionally, refresh bookings or update state here
                      window.location.reload();
                    }
                  }
                }}
              >
                Delete booking
              </button>
              <button
                className="btn btn-primary"
                onClick={() => setShowBookingModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
