"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LockScreenPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    // Tu peux mettre le mot de passe de ton choix ici (ex: "admin" ou ce que tu veux)
    if (username.trim() !== "" && password === "43140") {
      // Stocke le nom en session locale
      localStorage.setItem("atlas_user", username);
      router.push("/dashboard");
    } else {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Effets de lumière néon en arrière-plan */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md text-center space-y-8">
        
        {/* Branding AtlasOS */}
        <div className="space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-emerald-400 shadow-lg shadow-indigo-500/30 text-2xl font-black mb-2">
            A
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400">
            AtlasOS
          </h1>
          <p className="text-sm text-slate-400">
            Système d'exploitation personnel & Hub de gestion
          </p>
        </div>

        {/* Card Formulaire de Connexion */}
        <div className="bg-slate-900/80 border border-slate-800 p-8 rounded-3xl backdrop-blur-xl shadow-2xl space-y-6">
          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                Utilisateur
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError(false);
                }}
                placeholder="Ex: Jean Triboutain"
                required
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(false);
                }}
                placeholder="••••••••"
                required
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            {error && (
              <p className="text-xs text-rose-400 text-center font-medium pt-1">
                Mot de passe incorrect
              </p>
            )}

            <button
              type="submit"
              className="w-full mt-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-sm py-3.5 rounded-xl shadow-lg shadow-indigo-500/25 transition active:scale-[0.98]"
            >
              Lancer AtlasOS 🚀
            </button>
          </form>
        </div>

        <p className="text-xs text-slate-600">
          AtlasOS v1.0 • Session locale sécurisée
        </p>

      </div>
    </div>
  );
}