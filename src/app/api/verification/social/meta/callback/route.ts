import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMetaConfig, parseState } from "@/lib/social-verification";
import { prisma } from "@/lib/prisma";
import { Prisma, SocialProvider } from "@prisma/client";
import { recalculatePhotographerVerificationStatus, getSocialThreshold } from "@/lib/verification-status";

const COOKIE_NAME = "momentrix_meta_oauth";

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
    fallbackRedirect.searchParams.set("error", "meta_callback");
    return NextResponse.redirect(fallbackRedirect.toString());
  }

  const cookieValue = request.cookies.get(COOKIE_NAME)?.value;
  request.cookies.delete(COOKIE_NAME);

  if (!cookieValue) {
    fallbackRedirect.searchParams.set("error", "meta_state_missing");
    return NextResponse.redirect(fallbackRedirect.toString());
  }

  let parsedCookie: { state: string; redirectTo: string } | null = null;
  try {
    parsedCookie = JSON.parse(cookieValue);
  } catch {
    parsedCookie = null;
  }

  if (!parsedCookie) {
    fallbackRedirect.searchParams.set("error", "meta_state_invalid");
    return NextResponse.redirect(fallbackRedirect.toString());
  }

  const stateInfo = parseState(stateParam);
  if (!stateInfo || parsedCookie.state !== stateParam) {
    fallbackRedirect.searchParams.set("error", "meta_state_mismatch");
    return NextResponse.redirect(fallbackRedirect.toString());
  }

  const providerParam = stateInfo.prefix;
  const provider =
    providerParam === "facebook"
      ? SocialProvider.FACEBOOK
      : providerParam === "instagram"
        ? SocialProvider.INSTAGRAM
        : null;

  if (!provider) {
    fallbackRedirect.searchParams.set("error", "meta_provider_unknown");
    return NextResponse.redirect(fallbackRedirect.toString());
  }

  const { clientId, clientSecret, redirectUri } = getMetaConfig();
  if (!clientId || !clientSecret) {
    fallbackRedirect.searchParams.set("error", "meta_config");
    return NextResponse.redirect(fallbackRedirect.toString());
  }

  const tokenUrl = new URL("https://graph.facebook.com/v18.0/oauth/access_token");
  tokenUrl.searchParams.set("client_id", clientId);
  tokenUrl.searchParams.set("client_secret", clientSecret);
  tokenUrl.searchParams.set("redirect_uri", redirectUri);
  tokenUrl.searchParams.set("code", code);

  const tokenResponse = await fetch(tokenUrl, { method: "GET", headers: { Accept: "application/json" } });
  const tokenJson = await tokenResponse.json();

  if (!tokenResponse.ok || !tokenJson.access_token) {
    fallbackRedirect.searchParams.set("error", "meta_token");
    return NextResponse.redirect(fallbackRedirect.toString());
  }

  const accessToken: string = tokenJson.access_token;
  let followerCount = 0;
  let handle = "";
  let displayName = "";
  let profileUrl = "";
  let rawProfile: Prisma.JsonValue | Prisma.NullTypes.JsonNull = Prisma.JsonNull;

  if (provider === SocialProvider.INSTAGRAM) {
    const accountsUrl = new URL("https://graph.facebook.com/v18.0/me/accounts");
    accountsUrl.searchParams.set("fields", "instagram_business_account{id,username,followers_count,profile_pic}");
    accountsUrl.searchParams.set("access_token", accessToken);

    const accountResponse = await fetch(accountsUrl, { method: "GET", headers: { Accept: "application/json" } });
    const accountJson = await accountResponse.json();
    rawProfile = accountJson as Prisma.JsonValue;

    const instagramAccount = accountJson?.data?.find(
      (item: any) => item.instagram_business_account?.id,
    )?.instagram_business_account;

    followerCount = instagramAccount?.followers_count ?? 0;
    handle = instagramAccount?.username ?? "";
    displayName = instagramAccount?.username ?? "";
    profileUrl = handle ? `https://instagram.com/${handle}` : "";
  } else {
    const profileUrlRequest = new URL("https://graph.facebook.com/v18.0/me");
    profileUrlRequest.searchParams.set("fields", "id,name,link,followers_count");
    profileUrlRequest.searchParams.set("access_token", accessToken);
    const profileResponse = await fetch(profileUrlRequest, { method: "GET", headers: { Accept: "application/json" } });
    const profileJson = await profileResponse.json();
    rawProfile = profileJson as Prisma.JsonValue;

    followerCount = profileJson?.followers_count ?? 0;
    displayName = profileJson?.name ?? "";
    handle = profileJson?.name ?? "";
    profileUrl = profileJson?.link ?? (profileJson?.id ? `https://facebook.com/${profileJson.id}` : "");
  }

  if (!handle) {
    fallbackRedirect.searchParams.set("error", "meta_profile");
    return NextResponse.redirect(fallbackRedirect.toString());
  }

  const meetsThreshold = followerCount >= getSocialThreshold(provider);

  const profilePayload = (rawProfile ?? Prisma.JsonNull) as Prisma.NullableJsonNullValueInput;

  await prisma.socialAccount.upsert({
    where: {
      userId_provider: {
        userId: session.user.id,
        provider,
      },
    },
    create: {
      userId: session.user.id,
      provider,
      handle,
      displayName,
      followerCount,
      profileUrl,
      accessToken,
      rawProfile: profilePayload,
      verifiedAt: meetsThreshold ? new Date() : null,
    },
    update: {
      handle,
      displayName,
      followerCount,
      profileUrl,
      accessToken,
      rawProfile: profilePayload,
      verifiedAt: meetsThreshold ? new Date() : null,
      updatedAt: new Date(),
    },
  });

  await recalculatePhotographerVerificationStatus(session.user.id);

  const successRedirect = parsedCookie.redirectTo ?? fallbackRedirect.toString();
  const redirectUrl = new URL(successRedirect);
  redirectUrl.searchParams.set("connected", provider === SocialProvider.INSTAGRAM ? "instagram" : "facebook");
  if (!meetsThreshold) {
    redirectUrl.searchParams.set("warning", "followers_threshold");
  }

  const response = NextResponse.redirect(redirectUrl.toString());
  response.cookies.delete(COOKIE_NAME);
  return response;
}

