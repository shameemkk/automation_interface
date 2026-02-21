import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";

const LIMIT = 10;

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const from = (page - 1) * LIMIT;
  const to = from + LIMIT - 1;

  const { data, error, count } = await supabaseAdmin
    .from("automation_logs")
    .select("id, client_tag, status, created_at, drive_file", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("Error fetching automation logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch automation logs" },
      { status: 500 }
    );
  }

  const total = count ?? 0;
  const totalPages = Math.ceil(total / LIMIT) || 1;

  return NextResponse.json({
    logs: data ?? [],
    pagination: {
      page,
      limit: LIMIT,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  });
}
