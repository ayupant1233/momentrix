import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { locales, type Locale } from "@/i18n/config";

export async function POST(request: Request) {
  try {
    const { locale } = (await request.json()) as { locale?: string };

    if (!locale || !locales.includes(locale as Locale)) {
      return NextResponse.json({ message: "Invalid locale" }, { status: 400 });
    }

    const cookieStore = await cookies();
    cookieStore.set("NEXT_LOCALE", locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: "lax",
    });

    return NextResponse.json({ success: true, locale });
  } catch (error) {
    console.error("[SetLocale]", error);
    return NextResponse.json({ message: "Unable to set locale" }, { status: 500 });
  }
}

