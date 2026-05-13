import type { Metadata } from "next";
import { ThemeInitScript, ThemeProvider } from "@/components/theme-provider";
import { getAppSettings } from "@/domain/branding/repository";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getAppSettings();
  return {
    title: settings.app_name,
    description: settings.app_tagline ?? "Gestion de notifications et rappels",
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <ThemeInitScript />
      </head>
      <body className="min-h-screen bg-neutral-50 text-neutral-900 antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
