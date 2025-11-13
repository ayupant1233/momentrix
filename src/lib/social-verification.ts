import { randomBytes } from "crypto";

function base64UrlEncode(buffer: Buffer) {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function createState(prefix: string) {
  return `${prefix}:${base64UrlEncode(randomBytes(16))}`;
}

export function getMetaConfig() {
  const clientId = process.env.META_CLIENT_ID;
  const clientSecret = process.env.META_CLIENT_SECRET;
  const fallbackRedirect = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/api/verification/social/meta/callback`;
  const redirectUri = process.env.META_REDIRECT_URI ?? fallbackRedirect;

  return {
    clientId,
    clientSecret,
    redirectUri,
  };
}

export function getXConfig() {
  const clientId = process.env.X_CLIENT_ID;
  const clientSecret = process.env.X_CLIENT_SECRET;
  const fallbackRedirect = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/api/verification/social/x/callback`;
  const redirectUri = process.env.X_REDIRECT_URI ?? fallbackRedirect;

  return {
    clientId,
    clientSecret,
    redirectUri,
  };
}

export function parseState(value: string | undefined | null) {
  if (!value) return null;
  const [prefix, random] = value.split(":");
  if (!prefix || !random) return null;
  return { prefix, random };
}

