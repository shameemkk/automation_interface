import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { QueryCreationPanel } from "@/components/query-creation-panel";

export const dynamic = "force-dynamic";

export default async function QueryCreationPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="max-w-4xl">
      <QueryCreationPanel />
    </div>
  );
}
