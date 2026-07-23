"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

        console.info(
          "Service worker VeyraOS enregistré :",
          registration.scope
        );
      } catch (error) {
        console.error(
          "Échec de l’enregistrement du service worker VeyraOS :",
          error
        );
      }
    };

    registerServiceWorker();
  }, []);

  return null;
}