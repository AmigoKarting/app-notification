import type { Metadata } from "next";
import { ThemeInitScript, ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/components/toast";
import { NavProgress } from "@/components/nav-progress";
import { LocaleProvider } from "@/lib/i18n/context";
import { getLocale, getServerDictionary } from "@/lib/i18n/server";
import { getAppSettings } from "@/domain/branding/repository";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getAppSettings();
  const t = getServerDictionary();
  return {
    title: settings.app_name,
    description: settings.app_tagline ?? t.meta.defaultDescription,
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = getLocale();

  return (
    <html lang={locale}>
      <head>
        <ThemeInitScript />
      </head>
      <body className="min-h-screen bg-neutral-50 text-neutral-900 antialiased">
        <NavProgress />
        <ThemeProvider>
          <ToastProvider>
            <LocaleProvider locale={locale}>{children}</LocaleProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
