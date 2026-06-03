import { createFileRoute } from "@tanstack/react-router";
import { SignUpPage } from "@features/auth/components/signup-page";

export const Route = createFileRoute("/signup")({
  component: SignUpPage,
});
