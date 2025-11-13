import { randomBytes, createHash } from "crypto";

function base64UrlEncode(buffer: Buffer) {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function generateRandomString(length = 64) {
  return base64UrlEncode(randomBytes(length));
}

export function createPkcePair() {
  const codeVerifier = base64UrlEncode(randomBytes(32));
  const hash = createHash("sha256").update(codeVerifier).digest();
  const codeChallenge = base64UrlEncode(hash);
  return { codeVerifier, codeChallenge };
}

export function resolveDigilockerConfig() {
  const mode = process.env.DIGILOCKER_MODE ?? "mock";
  const baseUrl = process.env.DIGILOCKER_BASE_URL ?? "https://api.digitallocker.gov.in";
  const clientId = process.env.DIGILOCKER_CLIENT_ID;
  const clientSecret = process.env.DIGILOCKER_CLIENT_SECRET;
  const scope = process.env.DIGILOCKER_SCOPE ?? "openid profile";
  const fallbackRedirect = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/api/verification/digilocker/callback`;
  const redirectUri = process.env.DIGILOCKER_REDIRECT_URI ?? fallbackRedirect;

  return {
    mode,
    baseUrl,
    clientId,
    clientSecret,
    scope,
    redirectUri,
  };
}
