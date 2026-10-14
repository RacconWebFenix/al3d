import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE, verifySession } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const { pathname } = new URL(request.url);
  const sessionToken = request.cookies.get(SESSION_COOKIE)?.value;
  const session = sessionToken ? await verifySession(sessionToken) : null;

  if (pathname.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  if (pathname === "/login") {
    if (session) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    if (!session) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    return NextResponse.next();
  }

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|file.svg|globe.svg|next.svg|vercel.svg|window.svg).*)",
  ],
};
