import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AutomationPanel } from "@/components/automation-panel";

export const dynamic = "force-dynamic";

export default async function AutomationHistoryPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="max-w-4xl">
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50 mb-4">
          Automation
        </h2>
        <AutomationPanel />
      </div>
    </div>
  );
}
