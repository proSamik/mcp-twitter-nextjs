"use server";
import { cookies, headers } from "next/headers";
import { COOKIE_KEY_LOCALE } from "lib/const";
import { validateLocale, getDefaultLocale } from "./locale-utils";

/**
 * Gets the locale from cookies with error handling
 * @returns The locale from cookies or undefined if not found or error occurs
 */
async function getLocaleFromCookie(): Promise<string | undefined> {
  // Only access cookies in server-side runtime environments
  if (
    process.env.NEXT_RUNTIME !== "nodejs" &&
    process.env.NEXT_RUNTIME !== "edge"
  ) {
    return undefined;
  }

  try {
    const cookieStore = await cookies();
    const locale = cookieStore.get(COOKIE_KEY_LOCALE)?.value;
    return validateLocale(locale) ? locale : undefined;
  } catch (error) {
    // Headers/cookies not available (build time, static generation, etc.)
    console.warn("Could not access cookies:", error);
    return undefined;
  }
}

/**
 * Gets the locale from request headers with error handling
 * @returns The locale from headers or undefined if not found or error occurs
 */
async function getLocalFromHeader(): Promise<string | undefined> {
  // Only access headers in server-side runtime environments
  if (
    process.env.NEXT_RUNTIME !== "nodejs" &&
    process.env.NEXT_RUNTIME !== "edge"
  ) {
    return undefined;
  }

  try {
    const headerStore = await headers();
    const locale = headerStore
      .get("accept-language")
      ?.split(",")[0]
      ?.trim()
      .split("-")[0];

    return validateLocale(locale) ? locale : undefined;
  } catch (error) {
    // Headers not available (build time, static generation, etc.)
    console.warn("Could not access headers:", error);
    return undefined;
  }
}

/**
 * Gets the current locale with fallback to default
 * @returns The current locale or default locale if none found
 */
export async function getLocaleAction() {
  let locale: string | undefined;

  // Try to get locale from cookie first
  locale = await getLocaleFromCookie();

  // If no cookie, try headers
  if (!locale) {
    locale = await getLocalFromHeader();
  }

  // Return locale or fallback to default
  return locale || getDefaultLocale();
}

/**
 * Gets the current locale safely with comprehensive error handling
 * This function is designed to never throw and always return a valid locale
 * @returns The current locale or default locale if any error occurs
 */
export async function getLocaleSafe(): Promise<string> {
  try {
    return await getLocaleAction();
  } catch (error) {
    console.warn("Failed to get locale safely, using default:", error);
    return getDefaultLocale();
  }
}

/**
 * Sets the locale in cookies
 * @param locale - The locale to set
 * @throws Error if the locale is invalid
 */
export async function setLocaleAction(locale: string) {
  if (!validateLocale(locale)) {
    throw new Error("Invalid locale");
  }

  try {
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_KEY_LOCALE, locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
    });
  } catch (error) {
    console.warn("Could not set locale cookie:", error);
    // Don't throw error, just warn - the locale will still work for the current request
  }
}
