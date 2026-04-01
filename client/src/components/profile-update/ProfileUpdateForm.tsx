import { useState } from "react";
import { Field } from "../field/Field";

interface ProfileUpdateFormProps {
  currentUser: {
    name: string;
    surname: string;
    email: string;
    id: string;
  };
}

export const ProfileUpdateForm = ({ currentUser }: ProfileUpdateFormProps) => {
  const [name, setName] = useState(currentUser.name || "");
  const [surname, setSurname] = useState(currentUser.surname || "");
  const [email, setEmail] = useState(currentUser.email || "");
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
    if (!name || !surname || !email) {
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
      // Call better-auth update API or your own GraphQL mutation
      const updateData: any = {
        name: name.trim(),
        surname: surname.trim(),
        email: email.toLowerCase().trim(),
      };

      // Include password fields if user wants to change password
      if (newPassword) {
        updateData.currentPassword = currentPassword;
        updateData.newPassword = newPassword;
      }

      const response = await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Update failed" }));
        throw new Error(errorData.error || "Failed to update profile");
      }

      setSuccess("Profile updated successfully!");

      // Clear password fields on success
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Optionally reload the page or redirect
      setTimeout(() => {
        window.location.reload();
      }, 1500);
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
    <fieldset className="fieldset w-150">
      <legend className="fieldset-legend font-bold text-lg">
        Update Profile
      </legend>

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
        label="Email"
        name="email"
        type="email"
        value={email}
        required
        placeholder="Email"
        onChange={(event) => setEmail(event.target.value)}
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

      {success && (
        <div className="alert alert-success mt-4">
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-error mt-4">
          <span>{error}</span>
        </div>
      )}
    </fieldset>
  );

  return (
    <div className="flex items-center justify-center">
      <form onSubmit={handleFormSubmit}>{profileUpdateFormFieldset}</form>
    </div>
  );
};
