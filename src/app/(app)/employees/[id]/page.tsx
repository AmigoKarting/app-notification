import { redirect } from "next/navigation";

export default function EmployeeDetailRedirect({ params }: { params: { id: string } }) {
  redirect(`/admin/employees/${params.id}`);
}
