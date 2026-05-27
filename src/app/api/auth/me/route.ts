import { NextRequest, NextResponse } from "next/server";
import { isUserRole, SESSION_COOKIE } from "@/lib/auth-role";

export async function GET(request: NextRequest) {
  const role = request.cookies.get(SESSION_COOKIE)?.value;

  if (!isUserRole(role)) {
    return NextResponse.json({ authenticated: false, role: null }, { status: 401 });
  }

  return NextResponse.json({ authenticated: true, role });
}
