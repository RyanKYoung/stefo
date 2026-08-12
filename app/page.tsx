import { redirect } from "next/navigation";

export default function Home() {
  // The middleware bounces signed-out visitors to /login before they get here.
  redirect("/calendar");
}
