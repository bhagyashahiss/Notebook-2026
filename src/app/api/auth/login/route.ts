import { NextRequest, NextResponse } from "next/server";
import { getRolePassword, isUserRole, SESSION_COOKIE } from "@/lib/auth-role";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const json = await request.json().catch(() => ({}));
  const role = typeof json?.role === "string" ? json.role : "";
  const password = typeof json?.password === "string" ? json.password : "";

  if (!isUserRole(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const configuredPassword = getRolePassword(role);
  if (!configuredPassword) {
    return NextResponse.json(
      { error: `Server missing password for role: ${role}` },
      { status: 500 },
    );
  }

  if (password !== configuredPassword) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true, role });
  response.cookies.set(SESSION_COOKIE, role, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
