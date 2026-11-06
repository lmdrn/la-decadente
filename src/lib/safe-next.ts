/** N'accepte que les redirections internes ("/x"), jamais "//site", "/\site" ni "https://". */
export function safeNext(v: unknown, fallback = "/"): string {
  return typeof v === "string" && v.startsWith("/") && !v.startsWith("//") && !v.includes("\\") ? v : fallback;
}
