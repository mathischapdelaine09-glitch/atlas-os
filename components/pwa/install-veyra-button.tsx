"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;

  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

function isRunningAsInstalledApp(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const isStandalone = window.matchMedia(
    "(display-mode: standalone)"
  ).matches;

  const isIOSStandalone =
    "standalone" in window.navigator &&
    Boolean(
      (
        window.navigator as Navigator & {
          standalone?: boolean;
        }
      ).standalone
    );

  return isStandalone || isIOSStandalone;
}

export function InstallAtlasButton() {
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);

  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    setIsInstalled(isRunningAsInstalledApp());

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();

      setInstallEvent(
        event as BeforeInstallPromptEvent
      );
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallEvent(null);
    };

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt
    );

    window.addEventListener(
      "appinstalled",
      handleAppInstalled
    );

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );

      window.removeEventListener(
        "appinstalled",
        handleAppInstalled
      );
    };
  }, []);

  const handleInstall = async () => {
    if (!installEvent) {
      return;
    }

    try {
      await installEvent.prompt();

      const choice = await installEvent.userChoice;

      if (choice.outcome === "accepted") {
        setIsInstalled(true);
      }
    } catch (error) {
      console.error(
        "Impossible d’ouvrir l’installation VeyraOS :",
        error
      );
    } finally {
      setInstallEvent(null);
    }
  };

  if (isInstalled || !installEvent) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={handleInstall}
      className="
        group flex w-full items-center gap-3 rounded-xl
        px-3 py-2.5 text-left text-sm font-medium
        text-slate-400 transition
        hover:bg-slate-800 hover:text-white
        focus-visible:outline-none
        focus-visible:ring-2
        focus-visible:ring-indigo-500/60
      "
    >
      <span
        className="
          flex h-7 w-7 shrink-0 items-center justify-center
          rounded-lg bg-slate-900 text-slate-500 transition
          group-hover:bg-indigo-500/10
          group-hover:text-indigo-400
        "
      >
        <Download className="h-4 w-4" />
      </span>

      <span>Installer VeyraOS</span>
    </button>
  );
}