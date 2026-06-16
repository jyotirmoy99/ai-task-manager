import { redirect } from "next/navigation";

// The proxy gates auth: authenticated users reach the dashboard, everyone
// else is bounced to /login before this page renders.
export default function Home() {
  redirect("/dashboard");
}
