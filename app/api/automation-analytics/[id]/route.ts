import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const automationId = parseInt(id, 10);
  if (isNaN(automationId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin.rpc("get_automation_analytics", {
    p_automation_id: automationId,
  });

  if (error) {
    console.error("Error fetching automation analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}
