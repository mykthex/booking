import { useState } from "react";
import { Field } from "../field/Field";
import { admin } from "../../lib/auth-client";
import type {
  GraphQLMembership,
  GraphQLRole,
  GraphQLUser,
} from "../../lib/graphql/.generatedTypes";

interface ProfileUpdateAdminProps {
  currentUser: GraphQLUser;
  roles?: GraphQLRole[];
  memberships?: GraphQLMembership[];
}

import styles from "./profile-update-admin.module.css";

export const ProfileUpdateAdmin = ({
  currentUser,
  roles,
  memberships,
}: ProfileUpdateAdminProps) => {
  const [name, setName] = useState(currentUser.name || "");
  const [surname, setSurname] = useState(currentUser.surname || "");
  const [role, setRole] = useState(currentUser.role || "user");
  const [membershipId, setMembershipId] = useState(
    currentUser.membershipId || 1,
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    // Basic validation
    if (!name || !surname) {
      setError("Name, surname, role, and membership are required");
      setIsLoading(false);
      return;
    }

    try {
      // Prepare update data for better-auth updateUser
      const updateData: any = {
        name: name.trim(),
        surname: surname.trim(),
        role: role, // Use string role directly
        membershipId: membershipId,
      };

      if (!currentUser.id) return;

      // Use better-auth updateUser function
      const { data, error } = await admin.updateUser({
        userId: currentUser.id,
        data: updateData,
      });

      if (error) {
        console.error("Admin updateUser error details:", error);
        throw new Error(error.message || "Failed to update profile");
      }

      setSuccess("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      setError(
        error instanceof Error ? error.message : "Failed to update profile",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const profileUpdateFormFieldset = (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>
        Edit user profile
      </legend>

      {success && (
        <div className="alert alert-success mb-4">
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-error mb-4">
          <span>{error}</span>
        </div>
      )}

      <Field
        label="Name"
        name="name"
        value={name}
        required
        placeholder="Full name"
        onChange={(event) => setName(event.target.value)}
      />

      <Field
        label="Surname"
        name="surname"
        value={surname}
        required
        placeholder="Surname"
        onChange={(event) => setSurname(event.target.value)}
      />

      <Field
        label="Role"
        name="role"
        defaultValue={role}
        value={role}
        type="select"
        options={
          roles?.map((r) => ({
            label: r.name || "",
            value: r.name || "user",
          })) || []
        }
        required
        placeholder="Role"
        onChange={(event) => setRole(event.target.value)}
      />

      <Field
        label="Membership"
        name="membership"
        type="select"
        defaultValue={membershipId}
        value={membershipId}
        options={
          memberships?.map((m) => ({
            label: m.name || "",
            value: m.id || 1,
          })) || []
        }
        required
        placeholder="Membership"
        onChange={(event) => setMembershipId(Number(event.target.value))}
      />

      <button
        type="submit"
        className={`btn btn-neutral mt-4 ${isLoading ? "loading" : ""}`}
        disabled={isLoading}
      >
        {isLoading ? "Updating..." : "Update Profile"}
      </button>
    </fieldset>
  );

  return (
    <div className={styles.container}>
      <form className={styles.form} onSubmit={handleFormSubmit}>
        {profileUpdateFormFieldset}
      </form>
    </div>
  );
};
