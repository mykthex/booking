import { useState } from "react";
import type {
  GraphQLBooking,
  GraphQLCourt,
  GraphQLUser,
} from "../../lib/graphql/.generatedTypes";
import classNames from "classnames";
import { deleteBooking, updateBooking } from "../../lib/graphql";
import { Field } from "../field/Field";
import { DayPicker } from "react-day-picker";

interface CourtTableProps {
  courts: GraphQLCourt[];
  bookings: GraphQLBooking[];
  players: GraphQLUser[];
  isAdmin?: boolean;
  userId: string;
  renderDialogContent: (
    courtId: number,
    hour: number,
    players: GraphQLUser[],
    currentDate: Date,
    closeFunction: () => void,
  ) => React.ReactNode;
  onBookingUpdate?: (updatedBooking: GraphQLBooking) => void;
  onBookingDelete?: (deletedBookingId: string) => void;
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
  renderDialogContent,
  onBookingUpdate,
  onBookingDelete,
}) => {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(today);
  const [selectedBooking, setSelectedBooking] = useState<GraphQLBooking | null>(
    null,
  );
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [editPlayer1Id, setEditPlayer1Id] = useState("");
  const [editPlayer2Id, setEditPlayer2Id] = useState("");
  const [editPaidStatus, setEditPaidStatus] = useState(false);
  
  // New booking modal state
  const [showNewBookingModal, setShowNewBookingModal] = useState(false);
  const [selectedCourtId, setSelectedCourtId] = useState<number | null>(null);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);

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
    setEditPlayer1Id(booking.player1Id || "");
    setEditPlayer2Id(booking.player2Id || "");
    setEditPaidStatus(Boolean(booking.paid));
    setShowBookingModal(true);
  };

  const openNewBookingModal = (courtId: number, hour: number) => {
    setSelectedCourtId(courtId);
    setSelectedHour(hour);
    setShowNewBookingModal(true);
  };

  const renderBookedButton = (hour: number, court: GraphQLCourt) => {
    const booking = getBookingForSlot(currentDate, hour, court?.id);

    if (isAdmin) {
      return (
        <button
          className={classNames("btn", {
            "btn-error": booking && !booking.paid,
            "btn-warning": booking && booking.paid,
          })}
          onClick={() => {
            if (booking) {
              showBookingDetails(booking);
            }
          }}
        >
          Booked ({booking?.paid ? "Paid" : "Unpaid"})
        </button>
      );
    } else {
      return (
        <button className="btn btn-error" disabled>
          Booked
        </button>
      );
    }
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
      <div className="mb-4 flex justify-between gap-2">
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
          popoverTarget="rdp-popover"
          className="input input-border"
          style={{ anchorName: "--rdp" } as React.CSSProperties}
        >
          {currentDate ? currentDate.toLocaleDateString("en-CA") : "Pick a date"}
        </button>
        <div
          popover="auto"
          id="rdp-popover"
          className="dropdown"
          style={{ positionAnchor: "--rdp" } as React.CSSProperties}
        >
          <DayPicker
            className="react-day-picker"
            mode="single"
            disabled={
              !isAdmin
                ? {
                    before: today,
                    after: new Date(
                      today.getFullYear(),
                      today.getMonth(),
                      today.getDate() + 7,
                    ),
                  }
                : undefined
            }
            required
            selected={currentDate}
            onSelect={setCurrentDate}
          />
        </div>
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
                        renderBookedButton(hour, court)
                      ) : (
                        <button
                          className="btn btn-success"
                          onClick={() => openNewBookingModal(court.id!, hour)}
                        >
                          Réserver
                        </button>
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
                <Field
                  label="Player 1"
                  name="player1"
                  type="select"
                  required
                  defaultValue={selectedBooking.player1Id || editPlayer1Id}
                  onChange={(e) => setEditPlayer1Id(e.target.value)}
                  options={[
                    ...players.map((player) => ({
                      value: player.id!,
                      label: player.name!,
                    })),
                  ]}
                />
              </div>
              <div>
                <Field
                  label="Player 2"
                  name="player2"
                  type="select"
                  required
                  defaultValue={selectedBooking.player2Id || editPlayer2Id}
                  onChange={(e) => setEditPlayer2Id(e.target.value)}
                  options={[
                    ...players.map((player) => ({
                      value: player.id!,
                      label: player.name!,
                    })),
                  ]}
                />
              </div>
              <div>
                <strong>Payment Status:</strong>
                <fieldset className="fieldset bg-base-100 border-base-300 rounded-box w-64 border p-4">
                  <legend className="fieldset-legend">
                    Is the court booking paid?
                  </legend>
                  <label className="label">
                    <input
                      type="checkbox"
                      checked={editPaidStatus}
                      onChange={(e) => setEditPaidStatus(e.target.checked)}
                      className="checkbox"
                      name="paid"
                    />
                    Paid
                  </label>
                </fieldset>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                className="btn btn-warning"
                onClick={async () => {
                  if (selectedBooking) {
                    const success = await updateBooking({
                      id: selectedBooking.id!,
                      player1Id: editPlayer1Id,
                      player2Id: editPlayer2Id,
                      paid: editPaidStatus,
                    } as any);
                    if (success) {
                      // Find updated player names
                      const updatedPlayer1 = players.find(
                        (p) => p.id === editPlayer1Id,
                      );
                      const updatedPlayer2 = players.find(
                        (p) => p.id === editPlayer2Id,
                      );

                      // Create updated booking object
                      const updatedBooking: GraphQLBooking = {
                        ...selectedBooking,
                        player1Id: editPlayer1Id,
                        player2Id: editPlayer2Id,
                        player1: updatedPlayer1?.name || "Unknown Player",
                        player2: updatedPlayer2?.name || "Unknown Player",
                        paid: editPaidStatus,
                      };

                      // Call update callback if provided
                      onBookingUpdate?.(updatedBooking);

                      setShowBookingModal(false);
                      setEditPlayer1Id("");
                      setEditPlayer2Id("");
                      setEditPaidStatus(false);
                    }
                  }
                }}
              >
                Update booking
              </button>
              <button
                className="btn btn-error"
                onClick={async () => {
                  if (selectedBooking) {
                    const success = await deleteBooking(selectedBooking.id);
                    if (success && selectedBooking.id) {
                      // Call delete callback if provided
                      onBookingDelete?.(selectedBooking.id);

                      setShowBookingModal(false);
                      setEditPlayer1Id("");
                      setEditPlayer2Id("");
                      setEditPaidStatus(false);
                    }
                  }
                }}
              >
                Delete booking
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setShowBookingModal(false);
                  setEditPlayer1Id("");
                  setEditPlayer2Id("");
                  setEditPaidStatus(false);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Booking Modal */}
      {showNewBookingModal && selectedCourtId && selectedHour && (
        <div className="modal modal-open">
          <div className="modal-box">
            {renderDialogContent(selectedCourtId, selectedHour, players, currentDate, () => {
              setShowNewBookingModal(false);
              setSelectedCourtId(null);
              setSelectedHour(null);
            })}
          </div>
        </div>
      )}
    </div>
  );
};
