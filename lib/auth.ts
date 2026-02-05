import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-server";

const SESSION_COOKIE = "auth-session";
const SESSION_MAX_AGE = 60 * 60 * 24; // 24 hours

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
}

export async function createSession(email: string, role: "admin" | "user") {
  const token = await new SignJWT({ email, role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as { email: string; role: string };
  } catch {
    return null;
  }
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function verifyAdminCredentials(
  email: string,
  password: string
): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.error("ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env");
    return false;
  }

  return email === adminEmail && password === adminPassword;
}

export async function verifyUserCredentials(
  email: string,
  password: string
): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("automation_users")
    .select("password")
    .eq("email", email)
    .eq("role", "user")
    .single();

  if (error || !data) return false;
  return data.password === password;
}
