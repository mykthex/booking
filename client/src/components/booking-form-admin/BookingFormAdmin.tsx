import { useState } from "react";
import type { GraphQLUser } from "../../lib/graphql/.generatedTypes";
import classNames from "classnames";
import { Field } from "../field/Field";

interface BookingFormAdminProps {
  courtId: number;
  hour: number;
  currentDate: Date;
  players: GraphQLUser[];
  userId: string;
  onFormSuccess: (
    selectedPlayer1Id: string,
    selectedPlayer2Id: string,
    isPaid: boolean,
  ) => Promise<void>;
  onCancel: () => void;
}

export const BookingFormAdmin: React.FC<BookingFormAdminProps> = ({
  players,
  userId,
  onFormSuccess,
  onCancel,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setIsProcessing(true);

    const formData = new FormData(event.currentTarget);
    const selectedPlayer1Id = formData.get("player") as string;

    if (!selectedPlayer1Id) {
      setIsProcessing(false);
      return;
    }

    const selectedPlayer2Id = formData.get("player2") as string;

    if (!selectedPlayer2Id) {
      setIsProcessing(false);
      return;
    }

    await onFormSuccess(
      selectedPlayer1Id,
      selectedPlayer2Id,
      formData.get("paid") === "on",
    );
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex flex-col">
        <div>
          <Field
            label="Pick player 1"
            name="player"
            type="select"
            disabled={isProcessing}
            required
            value=""
            defaultValue=""
            options={[
              { value: "", label: "Pick player 1" },
              ...players
                .map((player) => ({
                  value: player.id!,
                  label: player.name!,
                })),
            ]}
          />
          <Field
            label="Pick player 2"
            name="player2"
            type="select"
            disabled={isProcessing}
            required
            value=""
            defaultValue=""
            options={[
              { value: "", label: "Pick player 2" },
              ...players
                .map((player) => ({
                  value: player.id!,
                  label: player.name!,
                })),
            ]}
          />
          <fieldset className="fieldset bg-base-100 border-base-300 rounded-box w-64 border p-4">
            <legend className="fieldset-legend">
              Is the court booking paid?
            </legend>
            <label className="label">
              <input
                type="checkbox"
                defaultChecked
                className="checkbox"
                name="paid"
              />
              Paid
            </label>
          </fieldset>
        </div>
        <div className="flex gap-2 mt-4">
          <button
            type="submit"
            className={classNames("btn btn-success flex-1", {
              loading: isProcessing,
            })}
            disabled={isProcessing}
          >
            {isProcessing ? "Processing..." : "Complete Reservation"}
          </button>
          <button
            type="button"
            className="btn"
            onClick={onCancel}
            disabled={isProcessing}
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
};
