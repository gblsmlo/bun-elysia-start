import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { signUp } from "@shared/auth-client";

export function SignUpPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signUp.email({ name, email, password });
    setLoading(false);
    if (error) {
      setError(error.message ?? "Sign up failed");
      return;
    }
    navigate({ to: "/dashboard" });
  }

  return (
    <main style={{ maxWidth: 320, margin: "4rem auto", fontFamily: "system-ui" }}>
      <h1>Sign up</h1>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 8 }}>
        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password (min 8 chars)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      <p>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </main>
  );
}
