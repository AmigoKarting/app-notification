import { redirect } from "next/navigation";

export default function ReminderDetailRedirect({ params }: { params: { id: string } }) {
  redirect(`/admin/reminders/${params.id}`);
}
