"use client";

import { useEffect, useMemo, useState } from "react";

export interface DocumentItem {
  id: string;
  title: string;
  category:
    | "Finance"
    | "Identité"
    | "Contrats"
    | "Projets"
    | "Procédures"
    | "Autre";
  fileUrl: string;
  fileName?: string;
  fileType: "pdf" | "doc" | "image" | "link" | "other";
  size?: string;
  createdAt: string;
  tags?: string[];
}

const STORAGE_KEY = "veyra_documents";

const initialDocuments: DocumentItem[] = [
  {
    id: "1",
    title: "Pièce d'identité (CNI / Passeport)",
    category: "Identité",
    fileUrl: "https://example.com/cni.pdf",
    fileName: "cni.pdf",
    fileType: "pdf",
    size: "1.2 MB",
    createdAt: "15/01/2026",
    tags: ["Important", "Officiel"],
  },
];

const categories: DocumentItem["category"][] = [
  "Finance",
  "Identité",
  "Contrats",
  "Projets",
  "Procédures",
  "Autre",
];

export default function DocumentsPage() {
  const [documents, setDocuments] =
    useState<DocumentItem[]>(initialDocuments);
  const [hydrated, setHydrated] = useState(false);

  const [filterCategory, setFilterCategory] = useState("");
  const [search, setSearch] = useState("");

  const [mode, setMode] = useState<"file" | "url">("file");
  const [title, setTitle] = useState("");
  const [category, setCategory] =
    useState<DocumentItem["category"]>("Autre");
  const [fileUrl, setFileUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] =
    useState<DocumentItem["fileType"]>("other");
  const [size, setSize] = useState("N/A");
  const [tagsInput, setTagsInput] = useState("");

  useEffect(() => {
    const savedDocuments =
      window.localStorage.getItem(STORAGE_KEY);

    if (savedDocuments) {
      try {
        setDocuments(
          JSON.parse(savedDocuments) as DocumentItem[]
        );
      } catch (error) {
        console.error(
          "Erreur parsing localStorage documents",
          error
        );
      }
    }

    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(documents)
    );
  }, [documents, hydrated]);

  const filteredDocuments = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLocaleLowerCase("fr");

    return documents.filter((document) => {
      const matchesCategory =
        !filterCategory ||
        document.category === filterCategory;

      const searchableValues = [
        document.title,
        document.fileName || "",
        document.category,
        ...(document.tags || []),
      ]
        .join(" ")
        .toLocaleLowerCase("fr");

      const matchesSearch =
        !normalizedSearch ||
        searchableValues.includes(normalizedSearch);

      return matchesCategory && matchesSearch;
    });
  }, [documents, filterCategory, search]);

  const categoryCounts = useMemo(() => {
    return categories.reduce<
      Record<DocumentItem["category"], number>
    >(
      (counts, currentCategory) => {
        counts[currentCategory] = documents.filter(
          (document) =>
            document.category === currentCategory
        ).length;

        return counts;
      },
      {
        Finance: 0,
        Identité: 0,
        Contrats: 0,
        Projets: 0,
        Procédures: 0,
        Autre: 0,
      }
    );
  }, [documents]);

  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    const sizeInMegabytes = file.size / (1024 * 1024);
    const formattedSize =
      file.size >= 1024 * 1024
        ? `${sizeInMegabytes.toFixed(2)} MB`
        : `${Math.max(
            1,
            Math.round(file.size / 1024)
          )} KB`;

    let detectedType: DocumentItem["fileType"] =
      "other";

    const lowerCaseName = file.name.toLowerCase();

    if (file.type.includes("pdf")) {
      detectedType = "pdf";
    } else if (file.type.includes("image")) {
      detectedType = "image";
    } else if (
      file.type.includes("word") ||
      lowerCaseName.endsWith(".doc") ||
      lowerCaseName.endsWith(".docx")
    ) {
      detectedType = "doc";
    }

    const reader = new FileReader();

    reader.onload = () => {
      setFileUrl(String(reader.result));
      setFileName(file.name);
      setFileType(detectedType);
      setSize(formattedSize);
    };

    reader.readAsDataURL(file);
  }

  function handleAddSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const cleanTitle = title.trim();
    const cleanUrl = fileUrl.trim();

    if (!cleanTitle || !cleanUrl) return;

    const tags = tagsInput
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const documentType =
      mode === "url" && fileType === "other"
        ? "link"
        : fileType;

    const newDocument: DocumentItem = {
      id: crypto.randomUUID(),
      title: cleanTitle,
      category,
      fileUrl: cleanUrl,
      fileName: fileName || undefined,
      fileType: documentType,
      size: size || "N/A",
      createdAt: new Date().toLocaleDateString(
        "fr-FR"
      ),
      tags,
    };

    setDocuments((currentDocuments) => [
      newDocument,
      ...currentDocuments,
    ]);

    resetForm();
  }

  function resetForm() {
    setTitle("");
    setFileUrl("");
    setFileName("");
    setFileType(mode === "url" ? "link" : "other");
    setSize("N/A");
    setTagsInput("");
    setCategory("Autre");
  }

  function changeMode(nextMode: "file" | "url") {
    setMode(nextMode);
    setFileUrl("");
    setFileName("");
    setFileType(nextMode === "url" ? "link" : "other");
    setSize("N/A");
  }

  function deleteDocument(id: string) {
    setDocuments((currentDocuments) =>
      currentDocuments.filter(
        (document) => document.id !== id
      )
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4 text-white md:p-6">
      <section className="relative overflow-hidden rounded-3xl border border-slate-700/60 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 p-7 md:p-9">
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">
              Veyra Documents
            </p>

            <h1 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">
              Gestionnaire de documents
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Centralise tes fichiers, contrats et liens
              importants dans une bibliothèque simple à
              rechercher et à filtrer.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Documents"
              value={String(documents.length)}
              tone="indigo"
            />

            <StatCard
              label="Catégories"
              value={String(
                categories.filter(
                  (currentCategory) =>
                    categoryCounts[currentCategory] > 0
                ).length
              )}
              tone="violet"
            />
          </div>
        </div>

        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />
      </section>

      <section className="rounded-3xl border border-slate-700/60 bg-slate-900/60 p-5 md:p-6">
        <div className="flex flex-col gap-4 border-b border-slate-800 pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-400">
              Nouveau document
            </p>

            <h2 className="mt-2 text-xl font-bold">
              Ajouter un fichier ou un lien
            </h2>
          </div>

          <div className="flex rounded-xl border border-slate-700 bg-slate-950 p-1">
            <ModeButton
              active={mode === "file"}
              onClick={() => changeMode("file")}
            >
              💻 Fichier
            </ModeButton>

            <ModeButton
              active={mode === "url"}
              onClick={() => changeMode("url")}
            >
              🔗 Lien
            </ModeButton>
          </div>
        </div>

        <form
          onSubmit={handleAddSubmit}
          className="mt-5 space-y-4"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="Titre" className="md:col-span-2">
              <input
                type="text"
                value={title}
                onChange={(event) =>
                  setTitle(event.target.value)
                }
                placeholder="Titre du document..."
                required
                className={inputClasses}
              />
            </Field>

            <Field label="Catégorie">
              <select
                value={category}
                onChange={(event) =>
                  setCategory(
                    event.target
                      .value as DocumentItem["category"]
                  )
                }
                className={inputClasses}
              >
                {categories.map((currentCategory) => (
                  <option
                    key={currentCategory}
                    value={currentCategory}
                  >
                    {currentCategory}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {mode === "file" ? (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 p-5">
              <label className="block cursor-pointer">
                <span className="text-sm font-semibold text-white">
                  Sélectionner un fichier
                </span>

                <span className="mt-1 block text-xs text-slate-500">
                  PDF, image, document Word ou autre format.
                </span>

                <input
                  type="file"
                  onChange={handleFileChange}
                  required={!fileUrl}
                  className="mt-4 block w-full text-xs text-slate-300 file:mr-4 file:rounded-xl file:border-0 file:bg-indigo-600/20 file:px-4 file:py-2.5 file:text-xs file:font-semibold file:text-indigo-300 hover:file:bg-indigo-600/30"
                />
              </label>

              {fileName && (
                <div className="mt-4 flex flex-col gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold text-emerald-300">
                      {fileName}
                    </p>

                    <p className="mt-1 text-[10px] text-emerald-400/70">
                      {size} ·{" "}
                      {getFileTypeLabel(fileType)}
                    </p>
                  </div>

                  <span className="text-xl">
                    {getFileIcon(fileType)}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <Field label="URL" className="md:col-span-2">
                <input
                  type="url"
                  value={fileUrl}
                  onChange={(event) =>
                    setFileUrl(event.target.value)
                  }
                  placeholder="https://..."
                  required
                  className={inputClasses}
                />
              </Field>

              <Field label="Type">
                <select
                  value={fileType}
                  onChange={(event) =>
                    setFileType(
                      event.target
                        .value as DocumentItem["fileType"]
                    )
                  }
                  className={inputClasses}
                >
                  <option value="link">🔗 Lien web</option>
                  <option value="pdf">📄 PDF</option>
                  <option value="doc">
                    📝 Document
                  </option>
                  <option value="image">🖼️ Image</option>
                  <option value="other">📁 Autre</option>
                </select>
              </Field>

              <Field label="Taille facultative">
                <input
                  type="text"
                  value={size}
                  onChange={(event) =>
                    setSize(event.target.value)
                  }
                  placeholder="Ex. 2.4 MB"
                  className={inputClasses}
                />
              </Field>
            </div>
          )}

          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <Field
              label="Tags séparés par des virgules"
              className="flex-1"
            >
              <input
                type="text"
                value={tagsInput}
                onChange={(event) =>
                  setTagsInput(event.target.value)
                }
                placeholder="Important, Client, Administratif..."
                className={inputClasses}
              />
            </Field>

            <button
              type="submit"
              className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              Enregistrer le document
            </button>
          </div>
        </form>
      </section>

      <section className="space-y-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Bibliothèque
            </p>

            <h2 className="mt-2 text-xl font-bold">
              Tes documents
            </h2>
          </div>

          <div className="relative w-full xl:max-w-md">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-600">
              🔎
            </span>

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Rechercher un titre, un fichier ou un tag..."
              className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2.5 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <FilterButton
            active={!filterCategory}
            onClick={() => setFilterCategory("")}
          >
            Tous ({documents.length})
          </FilterButton>

          {categories.map((currentCategory) => (
            <FilterButton
              key={currentCategory}
              active={
                filterCategory === currentCategory
              }
              onClick={() =>
                setFilterCategory(currentCategory)
              }
            >
              {currentCategory} (
              {categoryCounts[currentCategory]})
            </FilterButton>
          ))}
        </div>

        {filteredDocuments.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredDocuments.map((document) => (
              <DocumentCard
                key={document.id}
                document={document}
                onDelete={deleteDocument}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/30 px-6 py-16 text-center">
            <p className="font-semibold text-white">
              Aucun document trouvé
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Modifie les filtres ou ajoute un nouveau
              document.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function DocumentCard({
  document,
  onDelete,
}: {
  document: DocumentItem;
  onDelete: (id: string) => void;
}) {
  return (
    <article className="flex min-h-64 flex-col justify-between rounded-3xl border border-slate-700/60 bg-slate-900/60 p-5 transition hover:-translate-y-0.5 hover:border-slate-600">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-950 text-xl">
              {getFileIcon(document.fileType)}
            </div>

            <div className="min-w-0">
              <h3 className="line-clamp-2 font-bold text-white">
                {document.title}
              </h3>

              <p className="mt-1 truncate text-[10px] text-slate-500">
                {document.fileName ||
                  getFileTypeLabel(document.fileType)}
              </p>
            </div>
          </div>

          <span className="shrink-0 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2 py-1 text-[10px] font-semibold text-indigo-300">
            {document.category}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <Metadata
            label="Ajouté le"
            value={document.createdAt}
          />

          <Metadata
            label="Taille"
            value={document.size || "N/A"}
          />
        </div>

        {document.tags &&
          document.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {document.tags.map((tag, index) => (
                <span
                  key={`${tag}-${index}`}
                  className="rounded-md bg-slate-800 px-2 py-1 text-[10px] text-slate-300"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
      </div>

      <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-800 pt-4">
        <a
          href={document.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          download={
            document.fileName
              ? document.fileName
              : undefined
          }
          className="rounded-xl bg-indigo-600/90 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500"
        >
          {document.fileName
            ? "Ouvrir / télécharger"
            : "Ouvrir le lien"}{" "}
          ↗
        </a>

        <button
          type="button"
          onClick={() => onDelete(document.id)}
          className="text-xs font-semibold text-rose-400 transition hover:text-rose-300"
        >
          Supprimer
        </button>
      </div>
    </article>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "indigo" | "violet";
}) {
  const toneClasses = {
    indigo: "text-indigo-400",
    violet: "text-violet-400",
  };

  return (
    <div className="min-w-28 rounded-2xl border border-slate-700 bg-slate-950/50 px-4 py-3">
      <p className="text-[10px] uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <p
        className={`mt-1 text-xl font-black ${toneClasses[tone]}`}
      >
        {value}
      </p>
    </div>
  );
}

function Field({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={className}>
      <span className="mb-1.5 block text-xs font-medium text-slate-400">
        {label}
      </span>

      {children}
    </label>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
        active
          ? "bg-indigo-600 text-white"
          : "text-slate-400 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
        active
          ? "border-indigo-500/40 bg-indigo-500/15 text-indigo-300"
          : "border-slate-700 bg-slate-900/60 text-slate-400 hover:border-slate-600 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function Metadata({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
      <p className="text-[10px] uppercase tracking-wider text-slate-600">
        {label}
      </p>

      <p className="mt-1 truncate text-xs font-semibold text-slate-300">
        {value}
      </p>
    </div>
  );
}

function getFileIcon(
  type: DocumentItem["fileType"]
) {
  return {
    pdf: "📄",
    doc: "📝",
    image: "🖼️",
    link: "🔗",
    other: "📁",
  }[type];
}

function getFileTypeLabel(
  type: DocumentItem["fileType"]
) {
  return {
    pdf: "Document PDF",
    doc: "Document texte",
    image: "Image",
    link: "Lien externe",
    other: "Autre fichier",
  }[type];
}

const inputClasses =
  "w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500";