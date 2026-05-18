import type { MetadataRoute } from "next";
import { getAppSettings } from "@/domain/branding/repository";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  let appName = "App Notification";
  try {
    const settings = await getAppSettings();
    appName = settings.app_name;
  } catch {
    // fallback
  }

  return {
    name: appName,
    short_name: appName,
    description: "Notifications et rappels pour votre équipe",
    start_url: "/feed",
    display: "standalone",
    background_color: "#fafafa",
    theme_color: "#6366f1",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
