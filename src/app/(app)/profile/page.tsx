import { redirect } from "next/navigation";

// Renommé en /settings — on garde un redirect pour les anciens liens.
export default function ProfileRedirect() {
  redirect("/settings");
}
