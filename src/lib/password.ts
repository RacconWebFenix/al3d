import { createHash, scrypt, timingSafeEqual } from "node:crypto";

export async function verifyPassword(
  input: string,
  stored: string,
): Promise<boolean> {
  if (!stored || !stored.startsWith("scrypt$")) {
    return false;
  }

  const match = stored.match(
    /^scrypt\$(\d+)\$(\d+)\$(\d+)\$([A-Za-z0-9+/=]+)\$([A-Za-z0-9+/=]+)$/,
  );

  if (!match) {
    return false;
  }

  const [, nRaw, rRaw, pRaw, saltBase64, hashBase64] = match;
  const N = Number(nRaw);
  const r = Number(rRaw);
  const p = Number(pRaw);

  if (
    !Number.isInteger(N) ||
    !Number.isInteger(r) ||
    !Number.isInteger(p) ||
    N <= 0 ||
    r <= 0 ||
    p <= 0
  ) {
    return false;
  }

  const salt = Buffer.from(saltBase64, "base64");
  const expectedHash = Buffer.from(hashBase64, "base64");

  try {
    const derived = await new Promise<Buffer>((resolve, reject) => {
      scrypt(input, salt, 64, { N, r, p }, (error, key) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(Buffer.from(key));
      });
    });

    if (derived.length !== expectedHash.length) {
      return false;
    }

    return timingSafeEqual(derived, expectedHash);
  } catch {
    return false;
  }
}

export async function verifyCredentials(
  username: string,
  password: string,
): Promise<boolean> {
  const expectedUsername = process.env.AUTH_USERNAME;
  const storedHash = process.env.AUTH_PASSWORD_HASH;

  if (!expectedUsername || !storedHash) {
    throw new Error("AUTH_CONFIG");
  }

  const usernameHash = createHash("sha256").update(username).digest();
  const expectedUsernameHash = createHash("sha256")
    .update(expectedUsername)
    .digest();
  const userOk = timingSafeEqual(usernameHash, expectedUsernameHash);
  const passOk = await verifyPassword(password, storedHash);

  return userOk && passOk;
}
