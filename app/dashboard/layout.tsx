import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { DashboardSidebar } from "@/components/dashboard-sidebar";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const role = session.role === "admin" ? "admin" : "user";

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <DashboardSidebar role={role} email={session.email} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="shrink-0 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              {role === "admin" ? "Admin" : "Dashboard"}
            </h1>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
