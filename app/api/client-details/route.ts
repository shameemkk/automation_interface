import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("client_details")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching client details:", error);
    return NextResponse.json(
      { error: "Failed to fetch client details" },
      { status: 500 }
    );
  }

  return NextResponse.json({ clients: data ?? [] });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      client_tag,
      locations,
      zip_codes,
      drive_url,
      automation_mode,
      process_automations,
    } = body;

    if (!client_tag || !automation_mode) {
      return NextResponse.json(
        { error: "client_tag and automation_mode are required" },
        { status: 400 }
      );
    }

    if (!["fully_auto", "semi_auto"].includes(automation_mode)) {
      return NextResponse.json(
        { error: "automation_mode must be fully_auto or semi_auto" },
        { status: 400 }
      );
    }

    const payload = {
      client_tag: String(client_tag).trim(),
      locations: locations != null ? String(locations).trim() : null,
      zip_codes: zip_codes != null ? String(zip_codes).trim() : null,
      drive_url: drive_url != null ? String(drive_url).trim() : null,
      automation_mode,
      process_automations: Boolean(process_automations),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from("client_details")
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("Error adding client detail:", error);
      return NextResponse.json(
        { error: "Failed to add client detail" },
        { status: 500 }
      );
    }

    return NextResponse.json({ client: data });
  } catch (error) {
    console.error("Add client detail error:", error);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}
