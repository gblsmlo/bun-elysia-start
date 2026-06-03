import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { signOut, useSession } from "../shared/auth-client";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const { data: session, isPending } = useSession();

  // Client-side guard: redirect to /login once we know there is no session.
  useEffect(() => {
    if (!isPending && !session) {
      navigate({ to: "/login" });
    }
  }, [isPending, session, navigate]);

  if (isPending) return <main style={page}>Loading…</main>;
  if (!session) return null;

  return (
    <main style={page}>
      <h1>Dashboard</h1>
      <p>
        Signed in as <strong>{session.user.email}</strong>
      </p>
      <button
        onClick={() =>
          signOut({ fetchOptions: { onSuccess: () => navigate({ to: "/login" }) } })
        }
      >
        Sign out
      </button>
    </main>
  );
}

const page: React.CSSProperties = {
  maxWidth: 400,
  margin: "4rem auto",
  fontFamily: "system-ui",
};
