import { useState } from "react";
import { Field } from "../field/Field";
import type {
  GraphQLCourt,
} from "../../lib/graphql/.generatedTypes";

interface CourtUpdateProps {
  court?: GraphQLCourt | null;
}

import styles from "./court-update.module.css";
import { createCourt, updateCourt } from "../../lib/graphql";

export const CourtUpdate = ({
  court,
}: CourtUpdateProps) => {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const isAddingNewCourt = !court;

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData(event.currentTarget);
    const courtName = formData.get("name") as string;
    const courtNumber = formData.get("number") as string;
    const courtType = formData.get("type") as string;
    const active = formData.get("active") === "on";

    // Basic validation
    if (!courtName || !courtNumber) {
      setError("Court name and court number are required");
      setIsLoading(false);
      return;
    }

    const data: any = {
      name: courtName.trim(),
      number: Number(courtNumber),
      type: courtType,
      active: active || false,
    };

    try {
      const success = isAddingNewCourt ? await createCourt(data) : await updateCourt({ id: court?.id, ...data });

      if (!success) {
        console.error("Admin updateCourt error details:", error);
        throw new Error(success.message || "Failed to update court");
      }

      setSuccess(isAddingNewCourt ? "Court created successfully!" : "Court updated successfully!");
    } catch (error) {
      console.error("Error updating court:", error);
      setError(
        "Failed to update court",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const profileUpdateFormFieldset = (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>
        Edit court information
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
        label="Court Name"
        name="name"
        defaultValue={court?.name || ""}
        required
        placeholder="Court Name"
      />

      <Field
        label="Court Number"
        name="number"
        type="number"
        defaultValue={court?.number || ""}
        required
        placeholder="Court Number"
      />

      <Field
        label="Court Type"
        name="type"
        defaultValue={court?.type || ""}
        type="select"
        options={[
          {
            label: 'indoor',
            value: 'indoor',
          },
          {
            label: 'outdoor',
            value: 'outdoor',
          },
        ]}
        required
        placeholder="Court Type"
      />
      <fieldset className="fieldset bg-base-100 border-base-300 rounded-box w-64 border p-4">
        <legend className="fieldset-legend">
          Active
        </legend>
        <label className="label">
          <input
            type="checkbox"
            defaultChecked={Boolean(court?.active)}
            className="checkbox"
            name="active"
          />
          Active
        </label>
      </fieldset>

      <button
        type="submit"
        className={`btn btn-neutral mt-4 ${isLoading ? "loading" : ""}`}
        disabled={isLoading}
      >
        {isLoading ? (isAddingNewCourt ? "Creating..." : "Updating...") : (isAddingNewCourt ? "Create court" : "Update court")}
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
