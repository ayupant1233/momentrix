import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveDigilockerConfig } from "@/lib/digilocker";
import { VerificationStatus } from "@prisma/client";

const COOKIE_NAME = "digilocker_oauth";

function parseOAuthCookie(value: string | undefined) {
  if (!value) return null;
  try {
    return JSON.parse(value) as { state: string; codeVerifier: string; redirectTo?: string };
  } catch (error) {
    console.error("Failed to parse DigiLocker cookie", error);
    return null;
  }
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const origin = new URL(request.url).origin;

  if (!session?.user?.id) {
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("callbackUrl", "/settings/verification");
    return NextResponse.redirect(loginUrl.toString());
  }

  const cookieStore = cookies();
  const stored = parseOAuthCookie(cookieStore.get(COOKIE_NAME)?.value);
  const cleanupResponse = (redirectTarget: string) => {
    const response = NextResponse.redirect(redirectTarget);
    response.cookies.delete(COOKIE_NAME);
    return response;
  };

  if (!stored) {
    return cleanupResponse(`${origin}/settings/verification?error=session_expired`);
  }

  const redirectTo = stored.redirectTo ?? `${origin}/settings/verification`;
  const params = new URL(request.url).searchParams;
  const state = params.get("state");
  const code = params.get("code");
  const oauthError = params.get("error");

  if (!state || state !== stored.state) {
    return cleanupResponse(`${redirectTo}?error=state_mismatch`);
  }

  if (oauthError || !code) {
    await prisma.verificationRequest.create({
      data: {
        userId: session.user.id,
        provider: "DIGILOCKER",
        status: VerificationStatus.REJECTED,
        requestData: { oauthError, code },
      },
    });
    return cleanupResponse(`${redirectTo}?error=digilocker_denied`);
  }

  const { mode, baseUrl, clientId, clientSecret, redirectUri } = resolveDigilockerConfig();
  let profile: Record<string, unknown> = {};
  let tokenResponse: Record<string, unknown> = {};

  if (mode === "mock") {
    profile = {
      name: "Mock User",
      idNumber: "XXXXXXXXXXXX",
      issuer: "DigiLocker Sandbox",
      issuedAt: new Date().toISOString(),
    };
    tokenResponse = {
      access_token: "mock-access-token",
      token_type: "Bearer",
    };
  } else {
    if (!clientId || !clientSecret) {
      return cleanupResponse(`${redirectTo}?error=digilocker_config`);
    }

    try {
      const tokenUrl = new URL("/public/oauth2/2/token", baseUrl);
      const tokenRes = await fetch(tokenUrl.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          code_verifier: stored.codeVerifier,
        }).toString(),
      });

      if (!tokenRes.ok) {
        console.error("DigiLocker token exchange failed", await tokenRes.text());
        await prisma.verificationRequest.create({
          data: {
            userId: session.user.id,
            provider: "DIGILOCKER",
            status: VerificationStatus.REJECTED,
            requestData: { status: tokenRes.status },
          },
        });
        return cleanupResponse(`${redirectTo}?error=digilocker_token`);
      }

      tokenResponse = await tokenRes.json();
      const accessToken = tokenResponse.access_token as string | undefined;
      if (!accessToken) {
        return cleanupResponse(`${redirectTo}?error=digilocker_token`);
      }

      const userInfoUrl = new URL("/public/oauth2/2/userinfo", baseUrl);
      const userInfoRes = await fetch(userInfoUrl.toString(), {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!userInfoRes.ok) {
        console.error("DigiLocker userinfo failed", await userInfoRes.text());
        await prisma.verificationRequest.create({
          data: {
            userId: session.user.id,
            provider: "DIGILOCKER",
            status: VerificationStatus.REJECTED,
            requestData: { status: userInfoRes.status },
          },
        });
        return cleanupResponse(`${redirectTo}?error=digilocker_profile`);
      }

      profile = await userInfoRes.json();
    } catch (error) {
      console.error("DigiLocker integration error", error);
      await prisma.verificationRequest.create({
        data: {
          userId: session.user.id,
          provider: "DIGILOCKER",
          status: VerificationStatus.REJECTED,
          requestData: { error: "integration_failure" },
        },
      });
      return cleanupResponse(`${redirectTo}?error=digilocker_unavailable`);
    }
  }

  await prisma.$transaction([
    prisma.verificationRequest.create({
      data: {
        userId: session.user.id,
        provider: "DIGILOCKER",
        status: VerificationStatus.APPROVED,
        requestData: tokenResponse,
        responseData: profile,
      },
    }),
    prisma.user.update({
      where: { id: session.user.id },
      data: {
        digilockerVerified: true,
        digilockerId: (profile.sub as string | undefined) ?? null,
      },
    }),
    prisma.photographerProfile.updateMany({
      where: { userId: session.user.id },
      data: {
        verificationStatus: VerificationStatus.APPROVED,
        verifiedAt: new Date(),
      },
    }),
  ]);

  return cleanupResponse(`${redirectTo}?status=verified`);
}
