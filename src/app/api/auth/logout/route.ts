import { NextResponse } from "next/server";

import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ ok: true }, { status: 200 });

  response.cookies.set(SESSION_COOKIE, "", {
    ...sessionCookieOptions(0),
    expires: new Date(0),
  });

  return response;
}
