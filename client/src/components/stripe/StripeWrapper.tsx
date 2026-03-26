import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(
  "pk_test_51TCq1AATY03GEKJ6M3Ixo8SsTEbKEqdwtalwQHsYYrKhkG7R5LpMB8drcVskhWQAyA8tdrDmLGgIEM3Hy3VdHoXO00Y14kkuhE",
);

interface StripeWrapperProps {
  children: React.ReactNode;
  clientSecret?: string; // Payment intent client secret from your backend
}

export const StripeWrapper = ({
  children,
  clientSecret,
}: StripeWrapperProps) => {
  return (
    <Elements
      stripe={stripePromise}
      options={{
        appearance: {
          theme: "stripe" as const,
        },
        clientSecret,
      }}
    >
      {children}
    </Elements>
  );
};
