import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { client_tag, batch_size } = body;

    if (!client_tag || batch_size == null) {
      return NextResponse.json(
        { error: "client_tag and batch_size are required" },
        { status: 400 }
      );
    }

    const pBatchSize = Number(batch_size);
    if (!Number.isInteger(pBatchSize) || pBatchSize < 1) {
      return NextResponse.json(
        { error: "batch_size must be a positive integer" },
        { status: 400 }
      );
    }

    // 1. Create automation_logs row
    const { data: logRow, error: insertError } = await supabaseAdmin
      .from("automation_logs")
      .insert({
        client_tag: String(client_tag).trim(),
        status: "processing",
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Error creating automation log:", insertError);
      return NextResponse.json(
        { error: "Failed to create automation log" },
        { status: 500 }
      );
    }

    const automationId = logRow.id;

    // 2. Call RPC change_not_used_to_auto_queued(p_batch_size, p_client_tag, p_automation_id)
    const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc(
      "change_not_used_to_auto_queued",
      {
        p_batch_size: pBatchSize,
        p_client_tag: String(client_tag).trim(),
        p_automation_id: automationId,
      }
    );

    if (rpcError) {
      console.error("RPC change_not_used_to_auto_queued error:", rpcError);
      return NextResponse.json(
        { error: rpcError.message || "RPC call failed" },
        { status: 500 }
      );
    }

    // 3. Update automation_logs with processing_ids returned from RPC
    const processingIds = Array.isArray(rpcData)
      ? rpcData
      : (rpcData as { processing_ids?: number[] } | null)?.processing_ids;
    if (processingIds != null && Array.isArray(processingIds)) {
      await supabaseAdmin
        .from("automation_logs")
        .update({ processing_ids: processingIds })
        .eq("id", automationId);
    }

    return NextResponse.json({
      success: true,
      automation_id: automationId,
    });
  } catch (error) {
    console.error("Automation trigger error:", error);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}
