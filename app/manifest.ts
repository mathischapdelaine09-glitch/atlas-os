import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "VeyraOS",
    short_name: "VeyraOS",
    description:
      "VeyraOS centralise votre organisation, vos études, vos projets, vos finances, vos documents et vos notes.",

    start_url: "/",
    scope: "/",

    display: "standalone",
    orientation: "any",

    background_color: "#09090b",
    theme_color: "#09090b",

    categories: [
      "productivity",
      "education",
      "utilities",
    ],

    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}