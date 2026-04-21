import type { GraphQLBooking, GraphQLUser } from "../../lib/graphql/.generatedTypes";
import { deleteBooking, updateBooking } from "../../lib/graphql";
import { Field } from "../field/Field";

interface AdminBookingModalProps {
  selectedBooking: GraphQLBooking | null;
  showBookingModal: boolean;
  players: GraphQLUser[];
  editPlayer1Id: string;
  editPlayer2Id: string;
  editPaidStatus: boolean;
  setEditPlayer1Id: (value: string) => void;
  setEditPlayer2Id: (value: string) => void;
  setEditPaidStatus: (value: boolean) => void;
  setShowBookingModal: (value: boolean) => void;
  onBookingUpdate?: (updatedBooking: GraphQLBooking) => void;
  onBookingDelete?: (deletedBookingId: string) => void;
}

export const AdminBookingModal: React.FC<AdminBookingModalProps> = ({
  selectedBooking,
  showBookingModal,
  players,
  editPlayer1Id,
  editPlayer2Id,
  editPaidStatus,
  setEditPlayer1Id,
  setEditPlayer2Id,
  setEditPaidStatus,
  setShowBookingModal,
  onBookingUpdate,
  onBookingDelete,
}) => {
  const closeModal = () => {
    setShowBookingModal(false);
    setEditPlayer1Id("");
    setEditPlayer2Id("");
    setEditPaidStatus(false);
  };

  const handleUpdate = async () => {
    if (!selectedBooking) return;

    const success = await updateBooking({
      id: selectedBooking.id!,
      player1Id: editPlayer1Id,
      player2Id: editPlayer2Id,
      paid: editPaidStatus,
    } as any);

    if (success) {
      // Find updated player names
      const updatedPlayer1 = players.find((p) => p.id === editPlayer1Id);
      const updatedPlayer2 = players.find((p) => p.id === editPlayer2Id);

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
      closeModal();
    }
  };

  const handleDelete = async () => {
    if (!selectedBooking?.id) return;

    const success = await deleteBooking(selectedBooking.id);
    if (success) {
      // Call delete callback if provided
      onBookingDelete?.(selectedBooking.id);
      closeModal();
    }
  };

  if (!showBookingModal || !selectedBooking) {
    return null;
  }

  return (
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
          <button className="btn btn-warning" onClick={handleUpdate}>
            Update booking
          </button>
          <button className="btn btn-error" onClick={handleDelete}>
            Delete booking
          </button>
          <button className="btn btn-primary" onClick={closeModal}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
