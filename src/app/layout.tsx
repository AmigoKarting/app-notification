import type { Metadata } from "next";
import { ThemeInitScript, ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/components/toast";
import { NavProgress } from "@/components/nav-progress";
import { ServiceWorkerRegister } from "@/components/sw-register";
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
        <meta name="application-name" content="App Notification" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#6366f1" />
        <link rel="apple-touch-icon" href="/icon.svg" />
      </head>
      <body className="min-h-screen antialiased transition-colors duration-300">
        <NavProgress />
        <ServiceWorkerRegister />
        <ThemeProvider>
          <ToastProvider>
            <LocaleProvider locale={locale}>{children}</LocaleProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
