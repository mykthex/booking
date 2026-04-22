import { useState } from "react";
import { Field } from "../field/Field";

import styles from "./subscribe-form.module.css";

export const SubscribeForm = ({ email }: { email: string }) => {
  const [membershipType, setMembershipType] = useState("1");
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(false);

    // Basic validation check
    if (!membershipType) {
      setError(true);
      setIsLoading(false);
      return;
    }

    // Map membership type to lookup key
    const lookupKey =
      membershipType === "1" ? "standard-membership" : "privilege-membership";

    try {
      // Create Stripe checkout session
      const response = await fetch(
        "http://localhost:9000/create-checkout-session-for-subscription",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            lookup_key: lookupKey,
            customer_email: email,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const { url } = await response.json();

      // Store registration data in sessionStorage for after payment
      sessionStorage.setItem(
        "registrationData",
        JSON.stringify({
          email,
          membershipId: Number(membershipType),
        }),
      );

      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error) {
      console.error("Error creating checkout session:", error);
      setError(true);
      setIsLoading(false);
    }
  };

  const registrationFormFieldset = (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>
        Choose a subscription plan
      </legend>
      {error && (
        <div className="message is-danger">
          <p className="message-body">Registration failed</p>
        </div>
      )}
      <Field
        label="Membership Type"
        name="membershipType"
        type="select"
        value={membershipType}
        required
        defaultValue="1"
        options={[
          { label: "Standard - $120/month", value: "1" },
          { label: "Premium - $160/month", value: "2" },
        ]}
        onChange={(event) => setMembershipType(event.target.value)}
      />
      <button
        type="submit"
        className={`btn btn-neutral mt-4 ${isLoading ? "loading" : ""}`}
        disabled={isLoading}
      >
        {isLoading ? "Creating checkout..." : "Register & Pay"}
      </button>
    </fieldset>
  );

  return (
    <div className={styles.container}>
      <form className={styles.form} onSubmit={handleFormSubmit}>{registrationFormFieldset}</form>
    </div>
  );
};
