export const SESSION_COOKIE = "al3d_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

type SessionPayload = {
  sub: string;
  exp: number;
};

function getSessionSecret(): string | null {
  const secret = process.env.AUTH_SECRET;

  if (!secret || secret.length < 32) {
    return null;
  }

  return secret;
}

function base64UrlEncode(value: ArrayBuffer | Uint8Array): string {
  const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
  let binary = "";

  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

async function getSigningKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function signSession(sub: string): Promise<string> {
  const secret = getSessionSecret();

  if (!secret) {
    throw new Error("AUTH_CONFIG");
  }

  const payload: SessionPayload = {
    sub,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE,
  };

  const payloadSegment = base64UrlEncode(
    new TextEncoder().encode(JSON.stringify(payload)),
  );
  const key = await getSigningKey(secret);
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payloadSegment),
  );

  return `${payloadSegment}.${base64UrlEncode(new Uint8Array(signature))}`;
}

export async function verifySession(
  token: string | undefined,
): Promise<SessionPayload | null> {
  if (!token) {
    return null;
  }

  const secret = getSessionSecret();

  if (!secret) {
    return null;
  }

  const parts = token.split(".");

  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return null;
  }

  const [payloadSegment, signatureSegment] = parts;

  try {
    const key = await getSigningKey(secret);
    const signatureBytes = base64UrlDecode(signatureSegment);
    const signatureBuffer = new Uint8Array(signatureBytes.length);
    signatureBuffer.set(signatureBytes);
    const payloadBytes = new TextEncoder().encode(payloadSegment);
    const validSignature = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBuffer,
      payloadBytes,
    );

    if (!validSignature) {
      return null;
    }

    const payloadJson = JSON.parse(
      new TextDecoder().decode(base64UrlDecode(payloadSegment)),
    );

    if (
      !payloadJson ||
      typeof payloadJson.sub !== "string" ||
      typeof payloadJson.exp !== "number" ||
      payloadJson.exp <= Math.floor(Date.now() / 1000) ||
      payloadJson.sub !== process.env.AUTH_USERNAME
    ) {
      return null;
    }

    return {
      sub: payloadJson.sub,
      exp: payloadJson.exp,
    };
  } catch {
    return null;
  }
}

export async function requireSession(
  request: Request,
): Promise<Response | null> {
  const cookieHeader = request.headers.get("Cookie") ?? "";
  const cookiePair = cookieHeader
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${SESSION_COOKIE}=`));

  if (!cookiePair) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const token = decodeURIComponent(
      cookiePair.slice(SESSION_COOKIE.length + 1),
    );
    const session = await verifySession(token);

    if (!session) {
      return Response.json({ error: "Não autenticado" }, { status: 401 });
    }

    return null;
  } catch {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }
}

export function sessionCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}
