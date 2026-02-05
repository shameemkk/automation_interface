import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "auth-session";

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const isLoginPage = request.nextUrl.pathname === "/login";
  const isApiAuth = request.nextUrl.pathname.startsWith("/api/auth");

  if (isApiAuth) {
    return NextResponse.next();
  }

  if (!token) {
    if (isLoginPage) return NextResponse.next();
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const secret = getSecret();
    if (!secret) return NextResponse.next();

    await jwtVerify(token, secret);

    if (isLoginPage) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  } catch {
    const response = isLoginPage
      ? NextResponse.next()
      : NextResponse.redirect(new URL("/login", request.url));

    response.cookies.delete(SESSION_COOKIE);
    return response;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
