import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getXConfig, parseState } from "@/lib/social-verification";
import { prisma } from "@/lib/prisma";
import { Prisma, SocialProvider } from "@prisma/client";
import { recalculatePhotographerVerificationStatus, getSocialThreshold } from "@/lib/verification-status";

const COOKIE_NAME = "momentrix_x_oauth";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const origin = new URL(request.url).origin;
  const fallbackRedirect = new URL("/settings/verification", origin);

  if (!session?.user?.id) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", "/settings/verification");
    return NextResponse.redirect(loginUrl.toString());
  }

  const code = request.nextUrl.searchParams.get("code");
  const stateParam = request.nextUrl.searchParams.get("state");

  if (!code || !stateParam) {
    fallbackRedirect.searchParams.set("error", "x_callback");
    return NextResponse.redirect(fallbackRedirect.toString());
  }

  const cookieValue = request.cookies.get(COOKIE_NAME)?.value;
  request.cookies.delete(COOKIE_NAME);

  if (!cookieValue) {
    fallbackRedirect.searchParams.set("error", "x_state_missing");
    return NextResponse.redirect(fallbackRedirect.toString());
  }

  let parsedCookie: { state: string; codeVerifier: string; redirectTo: string } | null = null;
  try {
    parsedCookie = JSON.parse(cookieValue);
  } catch {
    parsedCookie = null;
  }

  if (!parsedCookie) {
    fallbackRedirect.searchParams.set("error", "x_state_invalid");
    return NextResponse.redirect(fallbackRedirect.toString());
  }

  const parsedState = parseState(stateParam);
  if (!parsedState || parsedState.prefix !== "x" || parsedCookie.state !== stateParam) {
    fallbackRedirect.searchParams.set("error", "x_state_mismatch");
    return NextResponse.redirect(fallbackRedirect.toString());
  }

  const { clientId, clientSecret, redirectUri } = getXConfig();
  if (!clientId || !clientSecret) {
    fallbackRedirect.searchParams.set("error", "x_config");
    return NextResponse.redirect(fallbackRedirect.toString());
  }

  const tokenResponse = await fetch("https://api.twitter.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      code_verifier: parsedCookie.codeVerifier,
    }),
  });

  const tokenJson = await tokenResponse.json();

  if (!tokenResponse.ok || !tokenJson.access_token) {
    fallbackRedirect.searchParams.set("error", "x_token");
    return NextResponse.redirect(fallbackRedirect.toString());
  }

  const accessToken: string = tokenJson.access_token;
  const refreshToken: string | undefined = tokenJson.refresh_token;
  const expiresIn: number | undefined = tokenJson.expires_in;

  const userResponse = await fetch(
    "https://api.twitter.com/2/users/me?user.fields=public_metrics,name,username,profile_image_url,url",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  const userJson = await userResponse.json();
  if (!userResponse.ok || !userJson?.data) {
    fallbackRedirect.searchParams.set("error", "x_profile");
    return NextResponse.redirect(fallbackRedirect.toString());
  }

  const followerCount: number = userJson.data.public_metrics?.followers_count ?? 0;
  const handle: string = userJson.data.username ?? "";
  const displayName: string = userJson.data.name ?? handle;
  const profileUrl: string = userJson.data.url ?? (handle ? `https://twitter.com/${handle}` : "");

  const meetsThreshold = followerCount >= getSocialThreshold(SocialProvider.X);

  const profilePayload = userJson as Prisma.InputJsonValue;

  await prisma.socialAccount.upsert({
    where: {
      userId_provider: {
        userId: session.user.id,
        provider: SocialProvider.X,
      },
    },
    create: {
      userId: session.user.id,
      provider: SocialProvider.X,
      handle,
      displayName,
      followerCount,
      profileUrl,
      accessToken,
      refreshToken,
      expiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000) : null,
      rawProfile: profilePayload,
      verifiedAt: meetsThreshold ? new Date() : null,
    },
    update: {
      handle,
      displayName,
      followerCount,
      profileUrl,
      accessToken,
      refreshToken,
      expiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000) : null,
      rawProfile: profilePayload,
      verifiedAt: meetsThreshold ? new Date() : null,
      updatedAt: new Date(),
    },
  });

  await recalculatePhotographerVerificationStatus(session.user.id);

  const successUrl = parsedCookie.redirectTo ?? fallbackRedirect.toString();
  const redirectUrl = new URL(successUrl);
  redirectUrl.searchParams.set("connected", "x");
  if (!meetsThreshold) {
    redirectUrl.searchParams.set("warning", "followers_threshold");
  }

  const response = NextResponse.redirect(redirectUrl.toString());
  response.cookies.delete(COOKIE_NAME);
  return response;
}

