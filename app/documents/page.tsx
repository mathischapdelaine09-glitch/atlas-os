"use client";



import { useState, useEffect } from "react";

export interface DocumentItem {
  id: string;
  title: string;
  category: "Finance" | "Identité" | "Contrats" | "Projets" | "Procédures" | "Autre";
  fileUrl: string;
  fileName?: string;
  fileType: "pdf" | "doc" | "image" | "link" | "other";
  size?: string;
  createdAt: string;
  tags?: string[];
}

// Stock initial par défaut si le localStorage est vide
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

export default function DocumentsPage() {
  // Initialisation sécurisée avec localStorage
  const [documents, setDocuments] = useState<DocumentItem[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("atlas_documents");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Erreur parsing localStorage documents", e);
        }
      }
    }
    return initialDocuments;
  });

  const [filterCategory, setFilterCategory] = useState<string>("");

  // Formulaire state
  const [mode, setMode] = useState<"file" | "url">("file");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<DocumentItem["category"]>("Autre");
  const [fileUrl, setFileUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState<DocumentItem["fileType"]>("other");
  const [size, setSize] = useState("N/A");
  const [tagsInput, setTagsInput] = useState("");

  const categories: DocumentItem["category"][] = ["Finance", "Identité", "Contrats", "Projets", "Procédures", "Autre"];

  // Sauvegarde automatique dans le localStorage à chaque modification des documents
  useEffect(() => {
    localStorage.setItem("atlas_documents", JSON.stringify(documents));
  }, [documents]);

  // Gestion de l'upload local (FileReader -> Base64)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    const sizeStr = file.size > 1024 * 1024 ? `${sizeInMB} MB` : `${Math.round(file.size / 1024)} KB`;

    let detectedType: DocumentItem["fileType"] = "other";
    if (file.type.includes("pdf")) detectedType = "pdf";
    else if (file.type.includes("image")) detectedType = "image";
    else if (file.type.includes("word") || file.name.endsWith(".doc") || file.name.endsWith(".docx")) detectedType = "doc";

    const reader = new FileReader();
    reader.onload = () => {
      setFileUrl(reader.result as string);
      setFileName(file.name);
      setFileType(detectedType);
      setSize(sizeStr);
    };
    reader.readAsDataURL(file);
  };

  // Ajout d'un document
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !fileUrl) return;

    const tags = tagsInput
      ? tagsInput.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

    const newDoc: DocumentItem = {
      id: Date.now().toString(),
      title,
      category,
      fileUrl,
      fileName,
      fileType,
      size,
      createdAt: new Date().toLocaleDateString("fr-FR"),
      tags,
    };

    setDocuments([newDoc, ...documents]);

    // Reset formulaire
    setTitle("");
    setFileUrl("");
    setFileName("");
    setTagsInput("");
    setCategory("Autre");
  };

  // Suppression
  const handleDelete = (id: string) => {
    setDocuments(documents.filter((d) => d.id !== id));
  };

  const filteredDocuments = filterCategory
    ? documents.filter((d) => d.category === filterCategory)
    : documents;

  const getFileIcon = (type: DocumentItem["fileType"]) => {
    switch (type) {
      case "pdf": return "📄";
      case "doc": return "📝";
      case "image": return "🖼️";
      case "link": return "🔗";
      default: return "📁";
    }
  };

  return (
    <div className="space-y-8 text-white max-w-6xl mx-auto p-4">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            📂 Gestionnaire de Documents
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Centralise tes fichiers locaux, contrats et liens importants.
          </p>
        </div>
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl px-4 py-2 text-xs text-slate-300">
          Total : <span className="font-bold text-indigo-400">{documents.length}</span> documents
        </div>
      </div>

      {/* Formulaire d'ajout */}
      <form
        onSubmit={handleAddSubmit}
        className="bg-slate-800/60 border border-slate-700/60 p-5 rounded-2xl space-y-4"
      >
        <div className="flex justify-between items-center">
          <h2 className="font-bold text-sm text-slate-300">➕ Ajouter un Document</h2>
          
          <div className="bg-slate-900 p-1 rounded-xl border border-slate-700 flex gap-1">
            <button
              type="button"
              onClick={() => setMode("file")}
              className={`text-xs px-3 py-1 rounded-lg transition cursor-pointer ${
                mode === "file" ? "bg-indigo-600 text-white font-medium" : "text-slate-400 hover:text-white"
              }`}
            >
              💻 Fichier Ordinateur
            </button>
            <button
              type="button"
              onClick={() => setMode("url")}
              className={`text-xs px-3 py-1 rounded-lg transition cursor-pointer ${
                mode === "url" ? "bg-indigo-600 text-white font-medium" : "text-slate-400 hover:text-white"
              }`}
            >
              🔗 Lien Web / Cloud
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titre du document..."
            required
            className="md:col-span-2 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as DocumentItem["category"])}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {mode === "file" ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <input
              type="file"
              onChange={handleFileChange}
              required={!fileUrl}
              className="md:col-span-2 text-xs text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-600/20 file:text-indigo-400 hover:file:bg-indigo-600/30 cursor-pointer"
            />
            <span className="text-xs text-slate-400">
              {fileName ? `Fichier : ${fileName} (${size})` : "Sélectionne un fichier"}
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              placeholder="URL du document (Google Drive, Notion...)"
              required
              className="md:col-span-2 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
            <select
              value={fileType}
              onChange={(e) => setFileType(e.target.value as DocumentItem["fileType"])}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
            >
              <option value="pdf">📄 PDF</option>
              <option value="link">🔗 Lien Web</option>
              <option value="doc">📝 Document</option>
              <option value="image">🖼️ Image</option>
              <option value="other">📁 Autre</option>
            </select>
            <input
              type="text"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              placeholder="Taille (ex: 2.4 MB)"
              className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="Tags séparés par des virgules (ex: Client, Offres)"
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-6 py-2.5 rounded-xl transition cursor-pointer"
          >
            Enregistrer le document
          </button>
        </div>
      </form>

      {/* Filtres par catégories */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-slate-400 mr-2">Filtrer par :</span>
        <button
          onClick={() => setFilterCategory("")}
          className={`text-xs px-3 py-1.5 rounded-xl border transition cursor-pointer ${
            !filterCategory
              ? "bg-indigo-600 text-white border-indigo-500"
              : "bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-white"
          }`}
        >
          Tous ({documents.length})
        </button>
        {categories.map((cat) => {
          const count = documents.filter((d) => d.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`text-xs px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                filterCategory === cat
                  ? "bg-indigo-600 text-white border-indigo-500"
                  : "bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-white"
              }`}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* Grille des documents */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocuments.length > 0 ? (
          filteredDocuments.map((doc) => (
            <div
              key={doc.id}
              className="bg-slate-800/40 border border-slate-700/50 p-5 rounded-2xl flex flex-col justify-between space-y-4 hover:border-slate-600/80 transition"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getFileIcon(doc.fileType)}</span>
                    <div>
                      <h3 className="font-bold text-sm text-white line-clamp-1">{doc.title}</h3>
                      <span className="text-[10px] text-slate-400">
                        {doc.fileName ? `${doc.fileName} • ` : ""}{doc.createdAt} • {doc.size || "N/A"}
                      </span>
                    </div>
                  </div>
                  <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] px-2 py-0.5 rounded-full font-semibold">
                    {doc.category}
                  </span>
                </div>

                {doc.tags && doc.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {doc.tags.map((tag, i) => (
                      <span key={i} className="bg-slate-700/50 text-slate-300 text-[10px] px-2 py-0.5 rounded-md">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-slate-700/40">
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={doc.fileName || true}
                  className="bg-indigo-600/80 hover:bg-indigo-600 text-white text-[11px] font-medium px-3 py-1.5 rounded-lg transition flex items-center gap-1"
                >
                  <span>Ouvrir / Télécharger</span> ↗
                </a>

                <button
                  onClick={() => handleDelete(doc.id)}
                  className="text-[11px] text-rose-400 hover:underline cursor-pointer"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500 col-span-full py-8 text-center">
            Aucun document dans cette catégorie pour le moment.
          </p>
        )}
      </div>
    </div>
  );
}