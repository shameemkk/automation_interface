import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("automation_logs")
    .select("id, client_tag, processing_ids, pending_ids, status, created_at, drive_file")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching automation logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch automation logs" },
      { status: 500 }
    );
  }

  return NextResponse.json({ logs: data ?? [] });
}
