export interface DocumentItem {
  id: string;
  title: string;
  category: "Finance" | "Identité" | "Contrats" | "Projets" | "Procédures" | "Autre";
  fileUrl: string; // Accepte les URLs web ou les données Base64 (data:application/pdf;base64,...)
  fileName?: string; // Nom d'origine du fichier importé
  fileType: "pdf" | "doc" | "image" | "link" | "other";
  size?: string;
  createdAt: string;
  tags?: string[];
}

export const documentsStore: DocumentItem[] = [
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