import { useState } from "react";
import { signUp } from "../../lib/auth-client";
import { StripeWrapper } from "../stripe/StripeWrapper";
import { RegistrationPaymentForm } from "../registration-payment-form/RegistrationPaymentForm";
import { Field } from "../field/Field";

export const RegisterBox = () => {
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [membershipType, setMembershipType] = useState("");
  const [error, setError] = useState(false);
  const [paymentSession, setPaymentSession] = useState<{
    client_secret: string;
    payment_intent_id: string;
  } | null>(null);

  const handleRegistrationSubmit = async () => {
    try {
      const result = await signUp.email({
        email,
        password,
        name,
        surname,
        membershipId: Number(membershipType),
      });

      if (result.error) {
        setError(true);
        console.error("Registration failed:", result.error);
        throw new Error("Registration failed");
      } else {
        console.log("Registration successful:", result);
        // Redirect on successful registration
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Registration error:", error);
      setError(true);
      throw error;
    }
  };

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

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
      return;
    }

    if (password !== confirmPassword) {
      setError(true);
      return;
    }

    // Form is valid, proceed with payment
    await createCheckoutSession();
  };

  const createCheckoutSession = async () => {
    try {
      const response = await fetch(
        "http://localhost:9000/create-checkout-session-for-subscription",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            subscriptionId: membershipType,
            amount: membershipType === "1" ? 8000 : 16000, // Amount in cents for $80.00 or $160.00
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to create payment intent");
      }

      const paymentData = await response.json();

      setPaymentSession({
        client_secret: paymentData.client_secret,
        payment_intent_id: paymentData.payment_intent_id,
      });

      return paymentData;
    } catch (error) {
      console.error("Error creating payment intent:", error);
      throw error;
    }
  };

  const registrationFormFieldset = (
    <fieldset className="fieldset w-150">
      <legend className="fieldset-legend font-bold text-lg">Register</legend>
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
        options={[
          { label: "Standard - $80/month", value: "1" },
          { label: "Premium - $160/month", value: "2" },
        ]}
        onChange={(event) => setMembershipType(event.target.value)}
      />
      <button type="submit" className="btn btn-neutral mt-4">
        Register
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
      {paymentSession?.client_secret ? (
        <StripeWrapper clientSecret={paymentSession.client_secret}>
          <RegistrationPaymentForm
            name={name}
            email={email}
            password={password}
            membershipType={membershipType}
            onPaymentSuccess={handleRegistrationSubmit}
            onCancel={() => setPaymentSession(null)}
          />
        </StripeWrapper>
      ) : (
        <form onSubmit={handleFormSubmit}>{registrationFormFieldset}</form>
      )}
    </div>
  );
};
