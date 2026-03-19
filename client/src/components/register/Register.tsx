import { useState } from "react";
import { signUp } from "../../lib/auth-client";

export const RegisterBox = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(false);

    try {
      const result = await signUp.email({
        email,
        password,
        name,
      });

      if (result.error) {
        setError(true);
        console.error("Registration failed:", result.error);
      } else {
        console.log("Registration successful:", result);
        // Redirect on successful registration
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Registration error:", error);
      setError(true);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center justify-center min-h-screen"
    >
      <fieldset className="fieldset bg-base-200 border-base-300 rounded-box w-xs border p-4">
        <legend className="fieldset-legend">Register</legend>

        <label className="label">Name</label>
        <input
          type="text"
          className="input"
          placeholder="Full Name"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
        />

        <label className="label">Email</label>
        <input
          type="email"
          className="input"
          placeholder="Email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <label className="label">Password</label>
        <input
          type="password"
          className="input"
          placeholder="Password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
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
    </form>
  );
};
