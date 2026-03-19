import { useState } from "react";
import { login } from "../../lib/auth";

export const LoginBox = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(false);
    const user = await login(email, password);
    if (user) {
      console.log("Login successful:", user);

      // Redirect or handle successful login
      window.location.href = "/";
    } else {
      setError(true);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center justify-center min-h-screen"
    >
      <fieldset className="fieldset bg-base-200 border-base-300 rounded-box w-xs border p-4">
        <legend className="fieldset-legend">Login</legend>

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
          Login
        </button>
        {error && (
          <div className="message is-danger">
            <p className="message-body">Login failed</p>
          </div>
        )}
      </fieldset>
    </form>
  );
};
