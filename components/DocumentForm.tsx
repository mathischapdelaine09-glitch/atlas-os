"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface DocumentFormProps {
  categories: string[];
  onAddDocument: (doc: {
    title: string;
    category: any;
    fileUrl: string;
    fileName: string;
    fileType: any;
    size: string;
    tags: string[];
  }) => void;
}

export default function DocumentForm({ categories, onAddDocument }: DocumentFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"file" | "url">("file");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(categories[0] || "Autre");
  const [fileUrl, setFileUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState<any>("other");
  const [size, setSize] = useState("N/A");
  const [tagsInput, setTagsInput] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    const sizeStr = file.size > 1024 * 1024 ? `${sizeInMB} MB` : `${Math.round(file.size / 1024)} KB`;

    let detectedType = "other";
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !fileUrl) return;

    const tags = tagsInput
      ? tagsInput.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

    onAddDocument({
      title,
      category,
      fileUrl,
      fileName,
      fileType,
      size,
      tags,
    });

    // Reset du formulaire
    setTitle("");
    setFileUrl("");
    setFileName("");
    setTagsInput("");
    router.refresh();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-slate-800/60 border border-slate-700/60 p-5 rounded-2xl space-y-4"
    >
      <div className="flex justify-between items-center">
        <h2 className="font-bold text-sm text-slate-300">➕ Ajouter un Document</h2>
        
        <div className="bg-slate-900 p-1 rounded-xl border border-slate-700 flex gap-1">
          <button
            type="button"
            onClick={() => setMode("file")}
            className={`text-xs px-3 py-1 rounded-lg transition ${
              mode === "file" ? "bg-indigo-600 text-white font-medium" : "text-slate-400 hover:text-white"
            }`}
          >
            💻 Fichier Ordinateur
          </button>
          <button
            type="button"
            onClick={() => setMode("url")}
            className={`text-xs px-3 py-1 rounded-lg transition ${
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
          onChange={(e) => setCategory(e.target.value)}
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
            onChange={(e) => setFileType(e.target.value)}
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
  );
}