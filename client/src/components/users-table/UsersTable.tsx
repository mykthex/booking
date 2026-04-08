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
  const openEditModal = (user: GraphQLUser) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setSelectedUser(null);
    setShowEditModal(false);
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
            {users.map((user, rowIndex) => {
              return (
                <tr key={rowIndex}>
                  <th>{rowIndex + 1}</th>
                  <td>{user.id}</td>
                  <td>{user.name}</td>
                  <td>{user.surname}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>{user.membership}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-primary"
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
