import { useState } from "react";
import type {
  GraphQLBooking,
  GraphQLCourt,
  GraphQLUser,
} from "../../lib/graphql/.generatedTypes";
import classNames from "classnames";

interface CourtTableProps {
  courts: GraphQLCourt[];
  bookings: GraphQLBooking[];
  players: GraphQLUser[];
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
  userId,
  renderDialog,
}) => {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(today);

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
