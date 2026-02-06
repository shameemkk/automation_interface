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

    // zip_codes is text[] in DB: send as string array (comma-separated input → array)
    const zipCodesArray =
      zip_codes == null
        ? null
        : Array.isArray(zip_codes)
          ? zip_codes.map((z: unknown) => String(z).trim()).filter(Boolean)
          : String(zip_codes)
              .trim()
              .split(",")
              .map((z) => z.trim())
              .filter(Boolean);

    const payload: Record<string, unknown> = {
      client_tag: String(client_tag).trim(),
      zip_codes: zipCodesArray?.length ? zipCodesArray : null,
      drive_url: drive_url != null ? String(drive_url).trim() : null,
      automation_mode,
      process_automations: Boolean(process_automations),
    };

    // Locations: add-only, from CSV. Store as [[format, latitude, longitude], ...] to match DB jsonb[]
    if (locations != null && Array.isArray(locations) && locations.length > 0) {
      payload.locations = locations.map((loc: unknown) => {
        if (Array.isArray(loc) && loc.length >= 3) {
          return [String(loc[0]), String(loc[1]), String(loc[2])];
        }
        if (loc && typeof loc === "object" && "format" in loc && "latitude" in loc && "longitude" in loc) {
          return [
            String((loc as { format: unknown }).format),
            String((loc as { latitude: unknown }).latitude),
            String((loc as { longitude: unknown }).longitude),
          ];
        }
        return null;
      }).filter(Boolean);
    }

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
