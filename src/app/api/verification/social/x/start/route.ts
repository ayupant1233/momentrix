import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createPkcePair } from "@/lib/digilocker";
import { createState, getXConfig } from "@/lib/social-verification";

const COOKIE_NAME = "momentrix_x_oauth";
const X_AUTHORIZE_URL = "https://twitter.com/i/oauth2/authorize";
const X_SCOPES = ["users.read", "tweet.read", "offline.access"].join(" ");

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", "/settings/verification");
    return NextResponse.redirect(loginUrl.toString());
  }

  const { clientId, redirectUri } = getXConfig();
  if (!clientId) {
    const errorUrl = new URL("/settings/verification", request.url);
    errorUrl.searchParams.set("error", "x_config");
    return NextResponse.redirect(errorUrl.toString());
  }

  const state = createState("x");
  const { codeVerifier, codeChallenge } = createPkcePair();
  const origin = new URL(request.url).origin;
  const redirectTo = new URL("/settings/verification", origin).toString();

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

  const authorizeUrl = new URL(X_AUTHORIZE_URL);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("scope", X_SCOPES);
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("code_challenge", codeChallenge);
  authorizeUrl.searchParams.set("code_challenge_method", "S256");

  response.headers.set("Location", authorizeUrl.toString());
  return response;
}

