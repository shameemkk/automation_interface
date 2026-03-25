import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";
import { BUSINESS_CATEGORIES } from "@/lib/business-categories";

const BATCH_SIZE = 200_000;

function toNumericOrNull(value: unknown): string | null {
  if (value == null || value === "") return null;
  const num = Number(value);
  return isNaN(num) ? null : String(num);
}

function buildAllQueries(
  locations: unknown[],
  businessCategories: string[]
): { query: string; latitude: string | null; longitude: string | null }[] {
  const queries: { query: string; latitude: string | null; longitude: string | null }[] = [];
  for (const category of businessCategories) {
    for (const location of locations) {
      const locationStr = Array.isArray(location) ? location[0] : location;
      const latitude = Array.isArray(location) ? toNumericOrNull(location[1]) : null;
      const longitude = Array.isArray(location) ? toNumericOrNull(location[2]) : null;
      queries.push({ query: `${category}, ${locationStr}`, latitude, longitude });
    }
  }
  return queries;
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { client_tag, region, batch } = body;

    if (!client_tag || typeof client_tag !== "string" || !client_tag.trim()) {
      return NextResponse.json(
        { error: "client_tag is required" },
        { status: 400 }
      );
    }

    if (!region || typeof region !== "string" || !region.trim()) {
      return NextResponse.json(
        { error: "region is required" },
        { status: 400 }
      );
    }

    const clientTag = String(client_tag).trim();
    const regionVal = String(region).trim();

    const { data, error } = await supabaseAdmin
      .from("client_details")
      .select("locations")
      .eq("client_tag", clientTag)
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Client tag not found", details: error.message },
        { status: 404 }
      );
    }

    if (!data || !data.locations || data.locations.length === 0) {
      return NextResponse.json(
        { error: "No locations found for this client tag" },
        { status: 404 }
      );
    }

    const locations = data.locations;
    const businessCategories = BUSINESS_CATEGORIES;
    const allQueries = buildAllQueries(locations, businessCategories);
    const totalQueries = allQueries.length;
    const totalBatches = Math.ceil(totalQueries / BATCH_SIZE);

    if (batch == null) {
      return NextResponse.json({
        mode: "info",
        client_tag: clientTag,
        region: regionVal,
        locations_count: locations.length,
        categories_count: businessCategories.length,
        total_queries: totalQueries,
        batch_size: BATCH_SIZE,
        total_batches: totalBatches,
      });
    }

    const batchIndex = Number(batch);
    if (isNaN(batchIndex) || batchIndex < 0 || batchIndex >= totalBatches) {
      return NextResponse.json(
        { error: `Invalid batch index. Must be 0–${totalBatches - 1}` },
        { status: 400 }
      );
    }

    const start = batchIndex * BATCH_SIZE;
    const end = Math.min(start + BATCH_SIZE, totalQueries);
    const batchQueries = allQueries.slice(start, end);

    const queryStrings = batchQueries.map((q) => q.query);
    const latitudes = batchQueries.map((q) => q.latitude);
    const longitudes = batchQueries.map((q) => q.longitude);

    const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc(
      "bulk_insert_client_queries",
      {
        p_client_tag: clientTag,
        p_region: regionVal,
        p_queries: queryStrings,
        p_latitudes: latitudes,
        p_longitudes: longitudes,
      }
    );

    if (rpcError) {
      console.error("Error inserting queries:", rpcError);
      return NextResponse.json(
        {
          error: "Failed to insert queries into database",
          details: rpcError.message,
        },
        { status: 500 }
      );
    }

    if (rpcData && typeof rpcData === "object" && !(rpcData as { success?: boolean }).success) {
      const errData = rpcData as { error?: string };
      return NextResponse.json(
        { error: "Failed to insert queries", details: errData.error },
        { status: 500 }
      );
    }

    const inserted = (rpcData as { inserted_count?: number })?.inserted_count ?? batchQueries.length;

    return NextResponse.json({
      mode: "batch",
      success: true,
      client_tag: clientTag,
      region: regionVal,
      batch: batchIndex,
      total_batches: totalBatches,
      batch_queries: batchQueries.length,
      inserted_count: inserted,
      total_queries: totalQueries,
      locations_count: locations.length,
      categories_count: businessCategories.length,
    });
  } catch (err) {
    console.error("Error:", err);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
