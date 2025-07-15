import { getRequestConfig } from "next-intl/server";
import { getLocaleSafe } from "./get-locale";
import { getDefaultLocale } from "./locale-utils";

// Import all messages statically to avoid dynamic import issues
import enMessages from "../../messages/en.json";
import koMessages from "../../messages/ko.json";
import esMessages from "../../messages/es.json";
import frMessages from "../../messages/fr.json";
import jaMessages from "../../messages/ja.json";
import zhMessages from "../../messages/zh.json";
import hiMessages from "../../messages/hi.json";

const messages: Record<string, any> = {
  en: enMessages,
  ko: koMessages,
  es: esMessages,
  fr: frMessages,
  ja: jaMessages,
  zh: zhMessages,
  hi: hiMessages,
};

/**
 * Next-intl request configuration with comprehensive error handling
 * Provides multiple fallback layers to ensure locale is always available
 */
export default getRequestConfig(async () => {
  let locale: string;

  try {
    locale = await getLocaleSafe();
  } catch (error) {
    console.warn(
      "Failed to get locale safely, falling back to default:",
      error,
    );
    locale = getDefaultLocale();
  }

  return {
    locale,
    messages: messages[locale] || messages.en,
    getMessageFallback({ key, namespace }) {
      return `${namespace}.${key}`;
    },
  };
});
