import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createPkcePair, generateRandomString, resolveDigilockerConfig } from "@/lib/digilocker";

const COOKIE_NAME = "digilocker_oauth";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", "/settings/verification");
    return NextResponse.redirect(loginUrl.toString());
  }

  const { mode, baseUrl, clientId, scope, redirectUri } = resolveDigilockerConfig();
  const origin = new URL(request.url).origin;
  const redirectTo = new URL("/settings/verification", origin).toString();

  const state = generateRandomString(16);
  const { codeVerifier, codeChallenge } = createPkcePair();

  const response = new NextResponse(null, { status: 302 });
  response.cookies.set({
    name: COOKIE_NAME,
    value: JSON.stringify({ state, codeVerifier, redirectTo }),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  if (mode === "mock") {
    const callbackUrl = new URL("/api/verification/digilocker/callback", origin);
    callbackUrl.searchParams.set("code", "mock-code");
    callbackUrl.searchParams.set("state", state);
    response.headers.set("Location", callbackUrl.toString());
    return response;
  }

  if (!clientId) {
    const errorUrl = new URL("/settings/verification", origin);
    errorUrl.searchParams.set("error", "digilocker_config");
    response.cookies.delete(COOKIE_NAME);
    response.headers.set("Location", errorUrl.toString());
    return response;
  }

  const authorizeUrl = new URL("/public/oauth2/2/authorize", baseUrl);
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("scope", scope);
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("code_challenge", codeChallenge);
  authorizeUrl.searchParams.set("code_challenge_method", "S256");

  response.headers.set("Location", authorizeUrl.toString());
  return response;
}
