"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleRegister(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanUsername.length < 2) {
      setErrorMessage(
        "Le nom d’utilisateur doit contenir au moins 2 caractères."
      );
      return;
    }

    if (cleanUsername.length > 40) {
      setErrorMessage(
        "Le nom d’utilisateur ne peut pas dépasser 40 caractères."
      );
      return;
    }

    if (password.length < 6) {
      setErrorMessage(
        "Le mot de passe doit contenir au moins 6 caractères."
      );
      return;
    }

    setIsLoading(true);

    const supabase = createClient();

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          username: cleanUsername,
        },
      },
    });

    if (error) {
      setErrorMessage(error.message);
      setIsLoading(false);
      return;
    }

    /*
     * Si la confirmation par e-mail est désactivée,
     * Supabase connecte directement l’utilisateur.
     */
    if (data.session) {
      router.replace("/dashboard");
      router.refresh();
      return;
    }

    /*
     * Si la confirmation par e-mail est activée,
     * l’utilisateur doit d’abord confirmer son adresse.
     */
    setSuccessMessage(
      "Compte créé ! Vérifie maintenant ta boîte mail pour confirmer ton adresse."
    );

    setPassword("");
    setIsLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-white">
      <div className="w-full max-w-[420px]">
        <form
          onSubmit={handleRegister}
          className="space-y-5 rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl"
        >
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-emerald-400 text-xl font-black shadow-lg shadow-indigo-500/20">
              A
            </div>

            <h1 className="text-3xl font-bold text-white">
              Créer un compte
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Crée ton espace personnel VeyraOS.
            </p>
          </div>

          <div>
            <label
              htmlFor="username"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400"
            >
              Nom d’utilisateur
            </label>

            <input
              id="username"
              name="username"
              type="text"
              value={username}
              onChange={(event) => {
                setUsername(event.target.value);
                setErrorMessage("");
              }}
              required
              minLength={2}
              maxLength={40}
              autoComplete="name"
              placeholder="Ex : Mathis Chapdelaine"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400"
            >
              Adresse e-mail
            </label>

            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setErrorMessage("");
              }}
              required
              autoComplete="email"
              placeholder="exemple@email.com"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400"
            >
              Mot de passe
            </label>

            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setErrorMessage("");
              }}
              required
              minLength={6}
              autoComplete="new-password"
              placeholder="6 caractères minimum"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
            />
          </div>

          {errorMessage && (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3">
              <p className="text-center text-sm text-rose-300">
                {errorMessage}
              </p>
            </div>
          )}

          {successMessage && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
              <p className="text-center text-sm text-emerald-300">
                {successMessage}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-indigo-600 p-3 font-bold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading
              ? "Création du compte..."
              : "Créer le compte"}
          </button>

          <p className="text-center text-sm text-slate-400">
            Tu possèdes déjà un compte ?{" "}
            <Link
              href="/login"
              className="font-semibold text-indigo-400 transition hover:text-indigo-300"
            >
              Se connecter
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}