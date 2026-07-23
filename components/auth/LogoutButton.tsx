"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleLogout() {
    setIsLoading(true);
    setErrorMessage("");

    const supabase = createClient();

    const { error } = await supabase.auth.signOut({
      scope: "local",
    });

    if (error) {
      setErrorMessage(
        "La déconnexion a échoué. Réessaie dans quelques secondes."
      );

      setIsLoading(false);
      return;
    }

    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleLogout}
        disabled={isLoading}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2.5 text-sm font-semibold text-rose-300 transition hover:border-rose-500/40 hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span aria-hidden="true">↪</span>

        <span>
          {isLoading
            ? "Déconnexion..."
            : "Se déconnecter"}
        </span>
      </button>

      {errorMessage && (
        <p className="text-center text-xs text-rose-400">
          {errorMessage}
        </p>
      )}
    </div>
  );
}