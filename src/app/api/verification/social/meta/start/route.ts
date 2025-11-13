import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createState, getMetaConfig } from "@/lib/social-verification";

const COOKIE_NAME = "momentrix_meta_oauth";
const META_DIALOG_URL = "https://www.facebook.com/v18.0/dialog/oauth";

const META_SCOPES = [
  "public_profile",
  "pages_show_list",
  "instagram_basic",
  "instagram_manage_insights",
  "pages_read_engagement",
].join(",");

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", "/settings/verification");
    return NextResponse.redirect(loginUrl.toString());
  }

  const provider = request.nextUrl.searchParams.get("provider") ?? "instagram";
  if (!["instagram", "facebook"].includes(provider)) {
    const errorUrl = new URL("/settings/verification", request.url);
    errorUrl.searchParams.set("error", "meta_provider");
    return NextResponse.redirect(errorUrl.toString());
  }

  const { clientId, redirectUri } = getMetaConfig();
  if (!clientId) {
    const errorUrl = new URL("/settings/verification", request.url);
    errorUrl.searchParams.set("error", "meta_config");
    return NextResponse.redirect(errorUrl.toString());
  }

  const state = createState(provider);
  const origin = new URL(request.url).origin;
  const redirectTo = new URL("/settings/verification", origin).toString();

  const response = new NextResponse(null, { status: 302 });
  response.cookies.set({
    name: COOKIE_NAME,
    value: JSON.stringify({ state, redirectTo }),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  const authorizeUrl = new URL(META_DIALOG_URL);
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("scope", META_SCOPES);
  authorizeUrl.searchParams.set("state", state);

  response.headers.set("Location", authorizeUrl.toString());
  return response;
}

