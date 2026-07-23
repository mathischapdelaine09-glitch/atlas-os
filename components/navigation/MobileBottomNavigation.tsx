"use client";

import { useState } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import LogoutButton from "@/components/auth/LogoutButton";

const mainNavigation = [
  {
    name: "Accueil",
    href: "/dashboard",
    icon: "⌂",
  },
  {
    name: "To-do",
    href: "/todo",
    icon: "✓",
  },
  {
    name: "Agenda",
    href: "/agenda",
    icon: "◫",
  },
  {
    name: "Notes",
    href: "/notes",
    icon: "✎",
  },
];

const secondaryNavigation = [
  {
    name: "Finance",
    description: "Budget, transactions et objectifs",
    href: "/finance",
    icon: "€",
  },
  {
    name: "Documents",
    description: "Fichiers et liens importants",
    href: "/documents",
    icon: "▤",
  },
  {
    name: "Projets",
    description: "Organisation de tes projets",
    href: "/projects",
    icon: "◆",
  },

  {
    name: "Habitudes",
    description: "Gère tes habitudes et routines",
    href: "/habits",
    icon: "☑",
  },
  {
    name: "Études",
    description: "Cours, révisions et ressources",
    href: "/etudes",
    icon: "◇",
  },
];

export default function MobileBottomNavigation() {
  const pathname = usePathname();

  const [isMenuOpen, setIsMenuOpen] =
    useState(false);

  const isSecondaryPage =
    secondaryNavigation.some(
      (item) =>
        pathname === item.href ||
        pathname.startsWith(`${item.href}/`)
    );

  function closeMenu() {
    setIsMenuOpen(false);
  }

  return (
    <>
      {/* Fond sombre derrière le menu */}
      {isMenuOpen && (
        <button
          type="button"
          aria-label="Fermer le menu"
          onClick={closeMenu}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Menu Plus */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 transition-transform duration-300 lg:hidden ${
          isMenuOpen
            ? "translate-y-0"
            : "pointer-events-none translate-y-full"
        }`}
      >
        <div className="rounded-t-3xl border border-b-0 border-slate-700 bg-slate-950 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 shadow-2xl">
          <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-slate-700" />

          <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">
                VeyraOS
              </p>

              <h2 className="mt-1 text-lg font-bold text-white">
                Plus d’outils
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Accède aux autres espaces de ton
                système.
              </p>
            </div>

            <button
              type="button"
              onClick={closeMenu}
              aria-label="Fermer"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-lg text-slate-400 transition hover:text-white"
            >
              ×
            </button>
          </div>

          <nav className="mt-4 space-y-2">
            {secondaryNavigation.map((item) => {
              const isActive =
                pathname === item.href ||
                pathname.startsWith(
                  `${item.href}/`
                );

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMenu}
                  className={`flex items-center gap-4 rounded-2xl border p-4 transition ${
                    isActive
                      ? "border-indigo-500/30 bg-indigo-500/10"
                      : "border-slate-800 bg-slate-900/70 hover:border-slate-700"
                  }`}
                >
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-base font-bold ${
                      isActive
                        ? "bg-indigo-500/15 text-indigo-400"
                        : "bg-slate-950 text-slate-400"
                    }`}
                  >
                    {item.icon}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span
                      className={`block text-sm font-semibold ${
                        isActive
                          ? "text-indigo-300"
                          : "text-white"
                      }`}
                    >
                      {item.name}
                    </span>

                    <span className="mt-0.5 block truncate text-xs text-slate-500">
                      {item.description}
                    </span>
                  </span>

                  <span className="text-slate-600">
                    ›
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-4 border-t border-slate-800 pt-4">
            <LogoutButton />
          </div>
        </div>
      </div>

      {/* Barre de navigation inférieure */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-800 bg-slate-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        <div className="grid h-16 grid-cols-5 px-2">
          {mainNavigation.map((item) => {
            const isActive =
              pathname === item.href ||
              pathname.startsWith(
                `${item.href}/`
              );

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMenu}
                className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-semibold transition ${
                  isActive
                    ? "text-indigo-400"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <span
                  className={`flex h-7 min-w-7 items-center justify-center rounded-lg px-1 text-base leading-none transition ${
                    isActive
                      ? "bg-indigo-500/10 text-indigo-400"
                      : "text-slate-500"
                  }`}
                >
                  {item.icon}
                </span>

                <span className="max-w-full truncate">
                  {item.name}
                </span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() =>
              setIsMenuOpen(
                (currentValue) => !currentValue
              )
            }
            className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-semibold transition ${
              isMenuOpen || isSecondaryPage
                ? "text-indigo-400"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <span
              className={`flex h-7 min-w-7 items-center justify-center rounded-lg px-1 text-sm font-black leading-none transition ${
                isMenuOpen || isSecondaryPage
                  ? "bg-indigo-500/10 text-indigo-400"
                  : "text-slate-500"
              }`}
            >
              •••
            </span>

            <span>Plus</span>
          </button>
        </div>
      </nav>
    </>
  );
}