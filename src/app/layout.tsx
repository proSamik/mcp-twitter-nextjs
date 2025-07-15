import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/layouts/theme-provider";
import { Toaster } from "ui/sonner";
import { BASE_THEMES } from "lib/const";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { getDefaultLocale } from "@/i18n/locale-utils";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tweet from Cursor",
  description:
    "The simplest way to share files. Drag, drop, and get a shareable link instantly. Secure, fast, and easy to use.",
};

const themes = BASE_THEMES.flatMap((t) => [t, `${t}-dark`]);

/**
 * Root layout component with error handling for locale detection
 * @param children - The child components to render
 * @returns The root layout JSX
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let locale: string;
  let messages: any;

  try {
    locale = await getLocale();
    messages = await getMessages();
  } catch (error) {
    console.warn("Failed to get locale/messages, using defaults:", error);
    // Fallback to default locale and messages
    locale = getDefaultLocale();
    try {
      // Try to import default messages
      const defaultMessages = await import("../../messages/en.json");
      messages = defaultMessages.default;
    } catch (importError) {
      console.error("Failed to import default messages:", importError);
      messages = {};
    }
  }

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="default-dark"
          themes={themes}
          disableTransitionOnChange
        >
          <NextIntlClientProvider messages={messages}>
            <div id="root">
              {children}
              <Toaster richColors />
            </div>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
