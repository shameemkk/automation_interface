import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin
    .from("automation_users")
    .select("id, email, name, role, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }

  return NextResponse.json({ users: data });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { email, name, password } = await request.json();

    if (!email || !name || !password) {
      return NextResponse.json(
        { error: "Email, name, and password are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("automation_users")
      .insert({ email, name, password, role: "user" })
      .select("id, email, name, role, created_at")
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "A user with this email already exists" },
          { status: 409 }
        );
      }
      console.error("Error adding user:", error);
      return NextResponse.json(
        { error: "Failed to add user" },
        { status: 500 }
      );
    }

    return NextResponse.json({ user: data });
  } catch (error) {
    console.error("Add user error:", error);
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    );
  }
}
