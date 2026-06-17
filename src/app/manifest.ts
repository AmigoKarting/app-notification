import type { MetadataRoute } from "next";
import { getAppSettings } from "@/domain/branding/repository";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  let appName = "Amigo Karting";
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
    // "/" redirige selon le rôle (dev → /admin, caissiere → /checklist,
    // sinon → /feed). Important pour que les caissières atterrissent
    // directement sur leur checklist en ouvrant la PWA.
    start_url: "/",
    display: "standalone",
    background_color: "#fafafa",
    theme_color: "#F5B731",
    icons: [
      {
        src: "/icon-pwa-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-pwa-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
