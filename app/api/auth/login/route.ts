import { NextResponse } from "next/server";
import {
  verifyAdminCredentials,
  verifyUserCredentials,
  createSession,
} from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Try admin first (env credentials)
    const isAdmin = await verifyAdminCredentials(email, password);
    if (isAdmin) {
      await createSession(email, "admin");
      return NextResponse.json({ success: true, role: "admin" });
    }

    // Then try user (database)
    const isUser = await verifyUserCredentials(email, password);
    if (isUser) {
      await createSession(email, "user");
      return NextResponse.json({ success: true, role: "user" });
    }

    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "An error occurred during login" },
      { status: 500 }
    );
  }
}
