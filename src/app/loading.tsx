import { Devil } from "@/components/Devil";

export default function Loading() {
  return (
    <section className="win" aria-busy="true" aria-label="Chargement">
      <div className="tbar">
        <Devil px={2} />
        <span className="ttxt">La Décadente</span>
      </div>
      <div className="body" style={{ minHeight: 320, alignItems: "center", justifyContent: "center" }}>
        <p className="fd" style={{ fontSize: 22 }}>chargement en cours</p>
      </div>
    </section>
  );
}
