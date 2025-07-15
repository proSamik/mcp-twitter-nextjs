"use client";

import { useTransition } from "react";
import { Globe } from "lucide-react";
import { SUPPORTED_LOCALES } from "lib/const";
import { setLocaleAction } from "@/i18n/get-locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocale } from "next-intl";

export function LanguageSelector() {
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();

  const handleLocaleChange = (newLocale: string) => {
    startTransition(() => {
      setLocaleAction(newLocale);
    });
  };

  const currentLocale = SUPPORTED_LOCALES.find((l) => l.code === locale);

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-muted-foreground" />
      <Select
        value={locale}
        onValueChange={handleLocaleChange}
        disabled={isPending}
      >
        <SelectTrigger className="w-auto border-none bg-transparent p-0 h-auto text-sm">
          <SelectValue>{currentLocale?.name || "English 🇺🇸"}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {SUPPORTED_LOCALES.map((supportedLocale) => (
            <SelectItem key={supportedLocale.code} value={supportedLocale.code}>
              {supportedLocale.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
