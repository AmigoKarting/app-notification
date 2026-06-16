import { headers } from "next/headers";
import { requireDev } from "@/domain/auth/role";
import { AdminMobileNav, AdminSidebar } from "./admin-nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireDev();

  const pathname = headers().get("x-pathname") ?? "";
  if (pathname.startsWith("/admin/aide")) {
    return <>{children}</>;
  }

  return (
    <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-8">
      <AdminSidebar />
      <AdminMobileNav />
      <div className="space-y-6">{children}</div>
    </div>
  );
}
