import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "ATLAS OS",
  description: "Mon système personnel",
};

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: "" },
  { name: "Finance", href: "/finance", icon: "" },
  { name: "Documents", href: "/documents", icon: "" },
  { name: "Projets", href: "/projects", icon: "" },
  { name: "Notes", href: "/notes", icon: "" },
  { name: "Agenda", href: "/agenda", icon: "" },
   { name: "Études", href: "/etudes", icon: "" },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="bg-slate-900 text-slate-100 min-h-screen flex">
        {/* --- SIDEBAR BARRE DE GAUCHE --- */}
        <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between p-4 flex-shrink-0">
          <div>
            {/* Titre Atlas OS */}
            <div className="px-3 py-4 mb-6 border-b border-slate-800">
              <h1 className="text-xl font-bold tracking-wider text-indigo-400">
                ATLAS OS
              </h1>
            </div>

            {/* Liens de navigation */}
            <nav className="space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  <span>{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>
          </div>

          {/* Footer de la sidebar */}
          <div className="px-3 py-2 text-xs text-slate-500 border-t border-slate-800">
            Local Host • v1.0
          </div>
        </aside>

        {/* --- CONTENU DE LA PAGE --- */}
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
