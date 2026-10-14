import { z } from "zod";
import { NextResponse } from "next/server";

import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  sessionCookieOptions,
  signSession,
} from "@/lib/auth";
import { verifyCredentials } from "@/lib/password";

const MAX_FAILED_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const loginAttempts = new Map<
  string,
  { count: number; firstAttemptAt: number }
>();

const loginSchema = z.object({
  username: z.string().trim().min(1).max(128),
  password: z.string().min(1).max(128),
});

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");

  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }

  const realIp = request.headers.get("x-real-ip");

  if (realIp) {
    return realIp.trim() || "unknown";
  }

  return "unknown";
}

function registerFailure(ip: string) {
  const now = Date.now();
  const current = loginAttempts.get(ip);

  if (!current || now - current.firstAttemptAt > WINDOW_MS) {
    loginAttempts.set(ip, { count: 1, firstAttemptAt: now });
    return;
  }

  loginAttempts.set(ip, {
    count: current.count + 1,
    firstAttemptAt: current.firstAttemptAt,
  });
}

function resetFailure(ip: string) {
  loginAttempts.delete(ip);
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const now = Date.now();

  for (const [storedIp, value] of Array.from(loginAttempts.entries())) {
    if (now - value.firstAttemptAt > WINDOW_MS) {
      loginAttempts.delete(storedIp);
    }
  }

  const current = loginAttempts.get(ip);

  if (
    current &&
    now - current.firstAttemptAt <= WINDOW_MS &&
    current.count >= MAX_FAILED_ATTEMPTS
  ) {
    return NextResponse.json(
      { error: "Muitas tentativas. Tente novamente em alguns minutos." },
      { status: 429 },
    );
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    registerFailure(ip);
    return NextResponse.json(
      { error: "Usuário ou senha incorretos." },
      { status: 400 },
    );
  }

  const parsed = loginSchema.safeParse(payload);

  if (!parsed.success) {
    registerFailure(ip);
    return NextResponse.json(
      { error: "Usuário ou senha incorretos." },
      { status: 400 },
    );
  }

  try {
    const valid = await verifyCredentials(
      parsed.data.username,
      parsed.data.password,
    );

    if (!valid) {
      registerFailure(ip);
      return NextResponse.json(
        { error: "Usuário ou senha incorretos." },
        { status: 401 },
      );
    }

    resetFailure(ip);
    const token = await signSession(parsed.data.username);
    const response = NextResponse.json({ ok: true }, { status: 200 });

    response.cookies.set(
      SESSION_COOKIE,
      token,
      sessionCookieOptions(SESSION_MAX_AGE),
    );
    return response;
  } catch {
    console.error("[auth] falha no login");
    return NextResponse.json(
      { error: "Erro de configuração." },
      { status: 500 },
    );
  }
}
