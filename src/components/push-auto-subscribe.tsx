"use client";

import { useEffect } from "react";

function urlBase64ToArrayBuffer(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const buf = new ArrayBuffer(raw.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < raw.length; i++) view[i] = raw.charCodeAt(i);
  return buf;
}

export function PushAutoSubscribe() {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    if (Notification.permission === "denied") return;

    // Retry every session until subscription succeeds
    const KEY = "push-subscribed-ok";
    if (sessionStorage.getItem(KEY)) return;

    (async () => {
      try {
        console.log("[push] waiting for service worker...");
        const reg = await navigator.serviceWorker.ready;
        console.log("[push] SW ready");
        const existing = await reg.pushManager.getSubscription();
        if (existing) { console.log("[push] already subscribed"); return; }

        console.log("[push] requesting permission...");
        const permission = await Notification.requestPermission();
        console.log("[push] permission:", permission);
        if (permission !== "granted") return;

        const res = await fetch("/api/push/vapid-key");
        console.log("[push] vapid-key status:", res.status);
        if (!res.ok) return;
        const { publicKey } = await res.json();

        console.log("[push] subscribing to push manager...");
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToArrayBuffer(publicKey),
        });
        console.log("[push] subscribed, sending to server...");

        const subJson = sub.toJSON();
        const saveRes = await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            endpoint: subJson.endpoint,
            keys: subJson.keys,
          }),
        });
        console.log("[push] server save status:", saveRes.status);
        if (saveRes.ok) sessionStorage.setItem(KEY, "1");
      } catch (err) {
        console.error("[push] error:", err);
      }
    })();
  }, []);

  return null;
}
