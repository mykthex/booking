import { useState } from "react";
import { Field } from "../field/Field";
import { updateUser, changePassword } from "../../lib/auth-client";

interface ProfileUpdateFormProps {
  currentUser: {
    name: string;
    surname: string;
    id: string;
  };
}

export const ProfileUpdateForm = ({ currentUser }: ProfileUpdateFormProps) => {
  const [name, setName] = useState(currentUser.name || "");
  const [surname, setSurname] = useState(currentUser.surname || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
      setError("Name, surname, and email are required");
      setIsLoading(false);
      return;
    }

    // Password validation if user wants to change password
    if (newPassword || confirmPassword) {
      if (!currentPassword) {
        setError("Current password is required to change password");
        setIsLoading(false);
        return;
      }
      if (newPassword !== confirmPassword) {
        setError("New passwords do not match");
        setIsLoading(false);
        return;
      }
      if (newPassword.length < 6) {
        setError("New password must be at least 6 characters");
        setIsLoading(false);
        return;
      }
    }

    try {
      let profileUpdated = false;
      let passwordChanged = false;

      // Update profile information (name, surname) if changed
      if (name.trim() !== currentUser.name || surname.trim() !== currentUser.surname) {
        const updateData = {
          name: name.trim(),
          surname: surname.trim(),
        };

        console.log("Updating profile with data:", updateData); // Debug log

        const { error } = await updateUser(updateData);

        if (error) {
          throw new Error(error.message || "Failed to update profile");
        }

        profileUpdated = true;
      }

      // Change password separately if new password provided
      if (newPassword) {
        console.log("Changing password..."); // Debug log

        const { data, error } = await changePassword({
          currentPassword,
          newPassword,
        });

        if (error) {
          throw new Error(error.message || "Failed to change password");
        }

        passwordChanged = true;
      }

      // Set success message based on what was updated
      let successMessage = "";
      if (profileUpdated && passwordChanged) {
        successMessage = "Profile and password updated successfully!";
      } else if (profileUpdated) {
        successMessage = "Profile updated successfully!";
      } else if (passwordChanged) {
        successMessage = "Password changed successfully!";
      } else {
        successMessage = "No changes were made.";
      }

      setSuccess(successMessage);

      // Clear password fields on success
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
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
    <fieldset className="fieldset">
      <legend className="fieldset-legend font-bold text-xl">
        Update Profile
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
      <div className="divider">Change Password (optional)</div>

      <Field
        label="Current Password"
        name="currentPassword"
        type="password"
        value={currentPassword}
        placeholder="Enter current password"
        onChange={(event) => setCurrentPassword(event.target.value)}
      />

      <Field
        label="New Password"
        name="newPassword"
        type="password"
        value={newPassword}
        placeholder="Enter new password"
        onChange={(event) => setNewPassword(event.target.value)}
      />

      <Field
        label="Confirm New Password"
        name="confirmPassword"
        type="password"
        value={confirmPassword}
        placeholder="Confirm new password"
        onChange={(event) => setConfirmPassword(event.target.value)}
      />

      <button
        type="submit"
        className={`btn btn-primary mt-4 ${isLoading ? "loading" : ""}`}
        disabled={isLoading}
      >
        {isLoading ? "Updating..." : "Update Profile"}
      </button>
    </fieldset>
  );

  return (
    <div className="flex w-150">
      <form className="w-full" onSubmit={handleFormSubmit}>{profileUpdateFormFieldset}</form>
    </div>
  );
};
