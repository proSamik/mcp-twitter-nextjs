import { SUPPORTED_LOCALES } from "lib/const";

/**
 * Gets the default locale without accessing request APIs
 * Safe to use during build time or static generation
 * @returns The default locale code
 */
export function getDefaultLocale(): string {
  return SUPPORTED_LOCALES[0].code;
}

/**
 * Validates if the provided locale is supported
 * @param locale - The locale string to validate
 * @returns True if the locale is supported, false otherwise
 */
export function validateLocale(locale?: string): boolean {
  return SUPPORTED_LOCALES.some((v) => v.code === locale);
}

/**
 * Gets all supported locale codes
 * @returns Array of supported locale codes
 */
export function getSupportedLocaleCodes(): string[] {
  return SUPPORTED_LOCALES.map((locale) => locale.code);
}

/**
 * Gets the locale name by code
 * @param code - The locale code
 * @returns The locale name or undefined if not found
 */
export function getLocaleName(code: string): string | undefined {
  return SUPPORTED_LOCALES.find((locale) => locale.code === code)?.name;
}
