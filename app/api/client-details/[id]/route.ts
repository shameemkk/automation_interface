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
  const numId = Number(id);
  if (!Number.isInteger(numId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("client_details")
    .select("*")
    .eq("id", numId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ client: data });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const numId = Number(id);
  if (!Number.isInteger(numId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const {
      client_tag,
      locations,
      zip_codes,
      zip_codes_format,
      drive_url,
      automation_mode,
      process_automations,
    } = body;

    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (client_tag !== undefined) payload.client_tag = String(client_tag).trim();
    if (locations !== undefined) payload.locations = locations == null ? null : String(locations).trim();
    if (zip_codes !== undefined) {
      payload.zip_codes =
        zip_codes == null
          ? null
          : Array.isArray(zip_codes)
            ? zip_codes.map((z: unknown) => String(z).trim()).filter(Boolean)
            : String(zip_codes)
                .trim()
                .split(",")
                .map((z) => z.trim())
                .filter(Boolean);
      if (Array.isArray(payload.zip_codes) && (payload.zip_codes as unknown[]).length === 0)
        payload.zip_codes = null;
    }
    if (zip_codes_format !== undefined) {
      payload.zip_codes_format =
        zip_codes_format == null
          ? null
          : Array.isArray(zip_codes_format)
            ? zip_codes_format.map((z: unknown) => String(z).trim()).filter(Boolean)
            : String(zip_codes_format)
                .trim()
                .split(",")
                .map((z) => z.trim())
                .filter(Boolean);
      if (Array.isArray(payload.zip_codes_format) && (payload.zip_codes_format as unknown[]).length === 0)
        payload.zip_codes_format = null;
    }
    if (drive_url !== undefined) payload.drive_url = drive_url == null ? null : String(drive_url).trim();
    if (automation_mode !== undefined) {
      if (!["fully_auto", "semi_auto"].includes(automation_mode)) {
        return NextResponse.json(
          { error: "automation_mode must be fully_auto or semi_auto" },
          { status: 400 }
        );
      }
      payload.automation_mode = automation_mode;
    }
    if (process_automations !== undefined) payload.process_automations = Boolean(process_automations);

    const { data, error } = await supabaseAdmin
      .from("client_details")
      .update(payload)
      .eq("id", numId)
      .select()
      .single();

    if (error) {
      console.error("Error updating client detail:", error);
      return NextResponse.json(
        { error: "Failed to update client detail" },
        { status: 500 }
      );
    }

    return NextResponse.json({ client: data });
  } catch (error) {
    console.error("Update client detail error:", error);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const numId = Number(id);
  if (!Number.isInteger(numId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("client_details")
    .delete()
    .eq("id", numId);

  if (error) {
    console.error("Error deleting client detail:", error);
    return NextResponse.json(
      { error: "Failed to delete client detail" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
