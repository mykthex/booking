import { useState } from "react";
import type {
  GraphQLBooking,
  GraphQLCourt,
  GraphQLUser,
} from "../../lib/graphql/.generatedTypes";
import classNames from "classnames";
import { createBooking } from "../../lib/graphql";

interface CourtReserveProps {
  courts: GraphQLCourt[];
  bookings: GraphQLBooking[];
  players: GraphQLUser[];
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

  const handleSubmit = async (
    event: any,
    courtId: number,
    hour: number,
    currentDate: Date,
  ) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const selectedPlayerId = formData.get("player") as string;

    try {
      const result = await createBooking({
        date: currentDate.toISOString(),
        courtId,
        hour,
        userId: selectedPlayerId,
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

      console.log("Booking result:", result);
    } catch (error) {
      console.error("Booking failed:", error);
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
                . Please confirm your action.
              </p>
              <div>
                <form
                  method="post"
                  onSubmit={(event) =>
                    handleSubmit(event, courtId, hour, currentDate)
                  }
                >
                  <div className="flex flex-col">
                    <select
                      name="player"
                      defaultValue="Pick player 2"
                      className="select"
                    >
                      <option disabled={true}>Pick player 2</option>
                      {players.map((player) => {
                        if (!player?.id) return null;
                        return (
                          <option key={player.id} value={player.id}>
                            {player.name}
                          </option>
                        );
                      })}
                    </select>
                    <div className="flex gap-2 mt-4">
                      <button type="submit" className="btn btn-success">
                        Reserve
                      </button>
                      <button
                        type="button"
                        className="btn"
                        onClick={() => closeModal(courtId, hour)}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </form>
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

  return (
    <div>
      <div className="mb-4 p-4">
        <h2 className="text-lg font-semibold">
          Court Booking -{" "}
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
            {hours.map((hour, rowIndex) => (
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
