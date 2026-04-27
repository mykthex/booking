import { useState } from "react";
import type {
  GraphQLBooking,
  GraphQLCourt,
  GraphQLUser,
} from "../../lib/graphql/.generatedTypes";
import classNames from "classnames";
import { DayPicker } from "react-day-picker";
import { AdminBookingModal } from "./AdminBookingModal";

interface CourtTableProps {
  courts: GraphQLCourt[];
  bookings: GraphQLBooking[];
  players: GraphQLUser[];
  isAdmin?: boolean;
  user: GraphQLUser;
  renderDialogContent: (
    courtId: string,
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
  courtId?: string | null,
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
  user,
  renderDialogContent,
  onBookingUpdate,
  onBookingDelete,
}) => {
  const today = new Date();
  const maxBookingDayNumber = user.membershipId === 1 ? 6 : 7;
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
  const [selectedCourtId, setSelectedCourtId] = useState<string | null>(null);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);

  const getBookingForSlot = (
    currentDate: Date,
    hour: number,
    courtId?: string | null,
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

  const openNewBookingModal = (courtId: string, hour: number) => {
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
  const canPrev = isAdmin || currentDate > today;
  const canNext =
    isAdmin || currentDate < new Date(today.getTime() + (maxBookingDayNumber - 1) * 24 * 60 * 60 * 1000);
  const isCurrentDay = currentDate.toDateString() === today.toDateString();

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
                      today.getDate() + maxBookingDayNumber,
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
              {courts.filter(court => court.active).map((court, key) => (
                <th key={key}>{court.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hours.map((hour, rowIndex) => {
              if (!isAdmin && isCurrentDay && hour <= today.getHours()) {
                return (
                  <tr key={rowIndex} className="opacity-50">
                    <td>{hour}h</td>
                    {courts.filter(court => court.active).map((court, key) => (
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
                  {courts.filter(court => court.active).map((court, key) => (
                    <td key={key}>
                      {isSlotBooked(currentDate, hour, court?.id, bookings) ? (
                        renderBookedButton(hour, court)
                      ) : (
                        <button
                          className={classNames("btn btn-success", {
                            "btn-outline": court.type === "outdoor",
                          })}
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

      {/* Admin booking details modal */}
      <AdminBookingModal
        selectedBooking={selectedBooking}
        showBookingModal={showBookingModal}
        players={players}
        editPlayer1Id={editPlayer1Id}
        editPlayer2Id={editPlayer2Id}
        editPaidStatus={editPaidStatus}
        setEditPlayer1Id={setEditPlayer1Id}
        setEditPlayer2Id={setEditPlayer2Id}
        setEditPaidStatus={setEditPaidStatus}
        setShowBookingModal={setShowBookingModal}
        onBookingUpdate={onBookingUpdate}
        onBookingDelete={onBookingDelete}
      />

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
