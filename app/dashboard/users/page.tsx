import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";
import { UsersList } from "@/components/users-list";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/dashboard/user");

  const { data } = await supabaseAdmin
    .from("automation_users")
    .select("id, email, name, role, created_at")
    .order("created_at", { ascending: false });

  const users = data ?? [];

  return (
    <div className="max-w-4xl">
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50 mb-2">
          Users
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400 mb-6">
          Manage users below.
        </p>
        <UsersList initialUsers={users} />
      </div>
    </div>
  );
}
