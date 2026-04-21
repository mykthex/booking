import { useState } from "react";
import { signIn } from "../../lib/auth-client";
import { Field } from "../field/Field";

import styles from "./login.module.css";

export const LoginBox = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(false);

    try {
      const result = await signIn.email({
        email,
        password,
      });

      if (result.error) {
        setError(true);
        console.error("Login failed:", result.error);
      } else {
        console.log("Login successful:", result);
        // Redirect on successful login
        window.location.href = "/account";
      }
    } catch (error) {
      console.error("Login error:", error);
      setError(true);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.box}>
        <form className={styles.form} onSubmit={handleSubmit}>
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Login to book a court</legend>
            {error && (
              <div className="message is-danger">
                <p className="message-body">Login failed</p>
              </div>
            )}
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

            <button type="submit" className="btn btn-neutral mt-2">
              Login
            </button>
          </fieldset>
        </form>
        <div className={styles.footer}>
          <p className="text">No account yet? <a className="text-link" href="/register">Register now</a></p>
        </div>
      </div>
    </div>
  );
};
