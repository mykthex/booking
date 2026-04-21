import { useState } from "react";
import { Field } from "../field/Field";
import { signUp } from "../../lib/auth-client";

export const RegisterBox = () => {
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [membershipType, setMembershipType] = useState("1");
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(false);

    // Basic validation check
    if (
      !name ||
      !surname ||
      !email ||
      !password ||
      !confirmPassword ||
      !membershipType
    ) {
      setError(true);
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError(true);
      setIsLoading(false);
      return;
    }

    // Map membership type to lookup key
    const lookupKey =
      membershipType === "1" ? "standard-membership" : "privilege-membership";

    try {
      const { data, error } = await signUp.email({
        email: email,
        password: password,
        name: name,
        surname: surname,
        membershipId: Number(membershipType),
      });

      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      console.error("Error signing up:", error);
      setError(true);
      setIsLoading(false);
      return;
    }

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
          name,
          surname,
          email,
          password,
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
    <fieldset className="fieldset w-150">
      <legend className="fieldset-legend font-bold text-lg">Register to book a court</legend>
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
      <Field
        label="Password"
        name="password"
        type="password"
        value={password}
        required
        placeholder="Password"
        onChange={(event) => setPassword(event.target.value)}
      />
      <Field
        label="Confirm Password"
        name="confirmPassword"
        type="password"
        value={confirmPassword}
        required
        placeholder="Confirm Password"
        onChange={(event) => setConfirmPassword(event.target.value)}
      />
      <Field
        label="Membership Type"
        name="membershipType"
        type="select"
        value={membershipType}
        required
        defaultValue="1"
        options={[
          { label: "Standard - $80/month", value: "1" },
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
      {error && (
        <div className="message is-danger">
          <p className="message-body">Registration failed</p>
        </div>
      )}
    </fieldset>
  );

  return (
    <div className="flex items-center justify-center">
      <form onSubmit={handleFormSubmit}>{registrationFormFieldset}</form>
    </div>
  );
};
