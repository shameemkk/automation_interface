import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const client_tag = searchParams.get("client_tag");
  if (!client_tag || !client_tag.trim()) {
    return NextResponse.json(
      { error: "client_tag is required" },
      { status: 400 }
    );
  }

  const tag = client_tag.trim();

  const [totalRes, remainingRes] = await Promise.all([
    supabaseAdmin
      .from("client_queries")
      .select("*", { count: "exact", head: true })
      .eq("client_tag", tag),
    supabaseAdmin
      .from("client_queries")
      .select("*", { count: "exact", head: true })
      .eq("client_tag", tag)
      .eq("status", "not_used"),
  ]);

  return NextResponse.json({
    total_queries: totalRes.count ?? 0,
    remaining_queries: remainingRes.count ?? 0,
  });
}
