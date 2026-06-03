import { Link } from "@tanstack/react-router";
import { useSession } from "@shared/auth-client";

export function HomePage() {
  const { data: session, isPending } = useSession();

  return (
    <main style={{ maxWidth: 400, margin: "4rem auto", fontFamily: "system-ui" }}>
      <h1>Better Auth + TanStack Start</h1>
      {isPending ? (
        <p>Loading session...</p>
      ) : session ? (
        <p>
          Welcome back, <strong>{session.user.name}</strong>.{" "}
          <Link to="/dashboard">Go to dashboard</Link>
        </p>
      ) : (
        <p>
          You are not signed in. <Link to="/login">Log in</Link> or{" "}
          <Link to="/signup">sign up</Link>.
        </p>
      )}
    </main>
  );
}
