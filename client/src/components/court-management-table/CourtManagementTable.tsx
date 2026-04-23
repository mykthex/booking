import { useState } from "react";
import type {
  GraphQLCourt,
} from "../../lib/graphql/.generatedTypes";
import { CourtUpdate } from "../court-update/CourtUpdate";

interface CourtTableProps {
  courts: GraphQLCourt[]
}

export const CourtManagementTable: React.FC<CourtTableProps> = ({
  courts,
}) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCourt, setSelectedCourt] = useState<GraphQLCourt | null>(null);
  const openEditModal = (court?: GraphQLCourt) => {
    setSelectedCourt(court || null);
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setSelectedCourt(null);
    setShowEditModal(false);
  };

  const tableRows = [
    "courtID",
    "name",
    "number",
    "type",
    "active",
    "",
  ];
  return (
    <div>
      <div className="overflow-x-auto rounded-box border border-base-content/5 bg-base-100">
        <table className="table">
          <thead>
            <tr>
              {tableRows.map((row, key) => (
                <th key={key}>{row}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {courts.map((court, rowIndex) => {
              return (
                <tr key={rowIndex}>
                  <td>
                    <span>
                      {court.id}
                    </span>
                  </td>
                  <td>{court.name}</td>
                  <td>{court.number}</td>
                  <td>{court.type}</td>
                  <td>{court.active ? "Yes" : "No"}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-neutral"
                      onClick={() => openEditModal(court)}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="p-4">
          <button
            className="btn btn-neutral"
            onClick={() => openEditModal()}
          >
            Add new court
          </button>
        </div>
      </div>

      {/* Edit Court Modal */}
      {showEditModal && (
        <dialog className="modal modal-open">
          <div className="modal-box w-11/12">
            <CourtUpdate court={selectedCourt} />
            <div className="modal-action">
              <button className="btn" onClick={closeEditModal}>
                Close
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={closeEditModal}>close</button>
          </form>
        </dialog>
      )}
    </div>
  );
};
