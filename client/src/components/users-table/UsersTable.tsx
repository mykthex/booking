import { useState } from "react";
import type { GraphQLUser } from "../../lib/graphql/.generatedTypes";
interface CourtTableProps {
  users: GraphQLUser[];
  isAdmin?: boolean;
}

export const UsersTable: React.FC<CourtTableProps> = ({ users }) => {
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
                    <button className="btn btn-sm btn-primary">Edit</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
