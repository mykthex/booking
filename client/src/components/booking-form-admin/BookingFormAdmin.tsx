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
  onFormSucess: (
    selectedPlayer1Id: string,
    selectedPlayer2Id: string,
  ) => Promise<void>;
  onCancel: () => void;
}

export const BookingFormAdmin: React.FC<BookingFormAdminProps> = ({
  courtId,
  hour,
  currentDate,
  players,
  userId,
  onFormSucess,
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

    await onFormSucess(selectedPlayer1Id, selectedPlayer2Id);
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
                .filter((player) => player?.id && player.id !== userId)
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
                .filter((player) => player?.id && player.id !== userId)
                .map((player) => ({
                  value: player.id!,
                  label: player.name!,
                })),
            ]}
          />
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
