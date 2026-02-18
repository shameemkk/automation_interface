import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";
import { BUSINESS_CATEGORIES } from "@/lib/business-categories";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { client_tag, region } = body;

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

    const queries: { query: string; latitude: string | null; longitude: string | null }[] = [];

    for (const category of businessCategories) {
      for (const location of locations) {
        const locationStr = Array.isArray(location) ? location[0] : location;
        const latitude =
          Array.isArray(location) && location[1] ? location[1] : null;
        const longitude =
          Array.isArray(location) && location[2] ? location[2] : null;

        const query = `${category}, ${locationStr}`;
        queries.push({
          query,
          latitude,
          longitude,
        });
      }
    }

    const queryStrings = queries.map((q) => q.query);
    const latitudes = queries.map((q) => q.latitude);
    const longitudes = queries.map((q) => q.longitude);

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

    const inserted = (rpcData as { inserted_count?: number })?.inserted_count ?? queries.length;

    return NextResponse.json({
      success: true,
      client_tag: clientTag,
      region: regionVal,
      locations_count: locations.length,
      categories_count: businessCategories.length,
      total_queries: queries.length,
      inserted_count: inserted,
      message: "All queries have been inserted into client_queries table",
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
