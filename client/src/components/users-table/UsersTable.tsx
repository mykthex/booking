import { useState } from "react";
import type {
  GraphQLMembership,
  GraphQLRole,
  GraphQLUser,
} from "../../lib/graphql/.generatedTypes";
import { ProfileUpdateAdmin } from "../profile-update-admin/ProfileUpdateAdmin";

interface CourtTableProps {
  users: GraphQLUser[];
  isAdmin?: boolean;
  roles?: GraphQLRole[];
  memberships?: GraphQLMembership[];
}

export const UsersTable: React.FC<CourtTableProps> = ({
  users,
  memberships,
  roles,
}) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<GraphQLUser | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Calculate pagination
  const totalPages = Math.ceil(users.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = users.slice(startIndex, endIndex);

  const openEditModal = (user: GraphQLUser) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setSelectedUser(null);
    setShowEditModal(false);
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const goToPrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const tableRows = [
    "userId",
    "name",
    "surname",
    "email",
    "role",
    "membership",
    "",
  ];
  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <span className="text-sm text-gray-600">
          Showing {startIndex + 1}-{Math.min(endIndex, users.length)} of {users.length} users
        </span>
        <span className="text-sm text-gray-600">
          Page {currentPage} of {totalPages}
        </span>
      </div>
      
      <div className="overflow-x-auto rounded-box border border-base-content/5 bg-base-100">
        <table className="table">
          <thead>
            <tr>
              <th></th>
              {tableRows.map((row, key) => (
                <th key={key}>{row}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentUsers.map((user, rowIndex) => {
              const globalRowIndex = startIndex + rowIndex + 1;
              return (
                <tr key={user.id || rowIndex}>
                  <th>{globalRowIndex}</th>
                  <td>
                    <span title={user.id || undefined}>
                      {user.id?.substring(0, 4)}...
                    </span>
                  </td>
                  <td>{user.name}</td>
                  <td>{user.surname}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>{user.membership}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-neutral"
                      onClick={() => openEditModal(user)}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-4 flex justify-center">
          <div className="join">
            <button 
              className="join-item btn" 
              onClick={goToPrevious}
              disabled={currentPage === 1}
            >
              «
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                className={`join-item btn ${page === currentPage ? 'btn-active' : ''}`}
                onClick={() => goToPage(page)}
              >
                {page}
              </button>
            ))}
            <button 
              className="join-item btn" 
              onClick={goToNext}
              disabled={currentPage === totalPages}
            >
              »
            </button>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <dialog className="modal modal-open">
          <div className="modal-box w-11/12">
            <ProfileUpdateAdmin
              currentUser={selectedUser}
              roles={roles}
              memberships={memberships}
            />
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
