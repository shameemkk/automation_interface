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
    .select("id, client_tag, zip_codes, zip_codes_format, drive_url, automation_mode, process_automations, query_created, created_at")
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
      zip_codes_format,
      drive_url,
      process_automations,
    } = body;

    if (!client_tag) {
      return NextResponse.json(
        { error: "client_tag is required" },
        { status: 400 }
      );
    }

    if (!locations || !Array.isArray(locations) || locations.length === 0) {
      return NextResponse.json(
        { error: "locations is required. Please upload a CSV file." },
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

    // zip_codes_format is text[] in DB: comma-separated input → array
    const zipCodesFormatArray =
      zip_codes_format == null
        ? null
        : Array.isArray(zip_codes_format)
          ? zip_codes_format.map((z: unknown) => String(z).trim()).filter(Boolean)
          : String(zip_codes_format)
              .trim()
              .split(",")
              .map((z) => z.trim())
              .filter(Boolean);

    const payload: Record<string, unknown> = {
      client_tag: String(client_tag).trim(),
      zip_codes: zipCodesArray?.length ? zipCodesArray : null,
      zip_codes_format: zipCodesFormatArray?.length ? zipCodesFormatArray : null,
      drive_url: drive_url != null ? String(drive_url).trim() : null,
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
      .select("id, client_tag, zip_codes, zip_codes_format, drive_url, automation_mode, process_automations, query_created, created_at")
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
