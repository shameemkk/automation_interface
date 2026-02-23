import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const automationId = parseInt(id, 10);
  if (isNaN(automationId)) {
    return NextResponse.json({ error: "Invalid automation ID" }, { status: 400 });
  }

  try {
    const [
      { count: gMapTotal },
      { count: gMapPending },
      { count: queryResultsTotal },
      { count: queryResultsPending },
      { count: emailScraperTotal },
      { count: emailScraperPending },
    ] = await Promise.all([
      supabaseAdmin.from("client_queries").select("*", { count: "exact", head: true }).eq("automation_id", automationId),
      supabaseAdmin.from("client_queries").select("*", { count: "exact", head: true }).eq("automation_id", automationId).neq("status", "auto_completed"),
      supabaseAdmin.from("client_query_results").select("*", { count: "exact", head: true }).eq("automation_id", automationId),
      supabaseAdmin.from("client_query_results").select("*", { count: "exact", head: true }).eq("automation_id", automationId).neq("gpt_process", "auto_completed"),
      supabaseAdmin.from("email_scraper_node").select("*", { count: "exact", head: true }).eq("automation_id", automationId),
      supabaseAdmin.from("email_scraper_node").select("*", { count: "exact", head: true }).eq("automation_id", automationId).neq("status", "auto_final_completed"),
    ]);

    return NextResponse.json({
      g_map: { total: gMapTotal ?? 0, pending: gMapPending ?? 0 },
      query_results: { total: queryResultsTotal ?? 0, pending: queryResultsPending ?? 0 },
      email_scraper: { total: emailScraperTotal ?? 0, pending: emailScraperPending ?? 0 },
    });
  } catch (error) {
    console.error("Error fetching automation status:", error);
    return NextResponse.json(
      { error: "Failed to fetch automation status" },
      { status: 500 }
    );
  }
}
