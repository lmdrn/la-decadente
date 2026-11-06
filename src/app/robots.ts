import type { MetadataRoute } from "next";

// Moteurs de recherche ET robots des IA sont les bienvenus sur l'agenda public.
export default function robots(): MetadataRoute.Robots {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/compte", "/connexion", "/inscription", "/ajouter/", "/favoris", "/merci"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
