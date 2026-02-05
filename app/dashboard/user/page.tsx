import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function UserDashboard() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "user") redirect("/dashboard");

  return (
    <div className="max-w-4xl">
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50 mb-2">
          My Dashboard
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400">
          Welcome back, {session.email}. Use the sidebar to navigate.
        </p>
      </div>
    </div>
  );
}
