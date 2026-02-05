import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { ClientDetailsList } from "@/components/client-details-list";

export const dynamic = "force-dynamic";

export default async function ClientDetailsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="max-w-4xl">
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50 mb-2">
          Client details
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400 mb-6">
          Add, edit, and delete client details. Available to all users.
        </p>
        <ClientDetailsList />
      </div>
    </div>
  );
}
