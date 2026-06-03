import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { signIn } from "@shared/auth-client";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signIn.email({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message ?? "Sign in failed");
      return;
    }
    navigate({ to: "/dashboard" });
  }

  return (
    <main style={{ maxWidth: 320, margin: "4rem auto", fontFamily: "system-ui" }}>
      <h1>Log in</h1>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 8 }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      <p>
        No account? <Link to="/signup">Sign up</Link>
      </p>
    </main>
  );
}
