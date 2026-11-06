"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { addEvent, addVenue, type AddState } from "./actions";

type Opt = { slug: string; name: string; city?: string };
type L = { fr: boolean };

const v = (s: AddState, k: string) => (typeof s.values?.[k] === "string" ? (s.values[k] as string) : undefined);
const has = (s: AddState, k: string, val: string, dflt = false) => {
  const x = s.values?.[k];
  if (x === undefined) return dflt;
  return Array.isArray(x) ? x.includes(val) : x === val;
};

export function EventForm({
  fr,
  venues,
  colls,
  categories,
  genres,
  access,
  preVenue,
  preColl,
  today,
}: L & {
  venues: Opt[];
  colls: Opt[];
  categories: { key: string; label: string }[];
  genres: { key: string; label: string }[];
  access: { key: string; label: string }[];
  preVenue?: string;
  preColl?: string;
  today: string;
}) {
  const [state, action, pending] = useActionState<AddState, FormData>(addEvent, {});
  const [priceType, setPriceType] = useState(v(state, "priceType") ?? "payant");
  return (
    <form action={action} className="form" noValidate>
      {state.error && (
        <p className="notice err" role="alert">
          {state.error}{" "}
          {state.error.includes("charte") && <Link href="/charte">{fr ? "Lire la charte" : "Read the charter"}</Link>}
          {state.error.includes("Connecte") && <Link href="/connexion?next=/ajouter/evenement">{fr ? "Connexion" : "Log in"}</Link>}
        </p>
      )}
      <div>
        <label htmlFor="title">{fr ? "Titre" : "Title"} *</label>
        <input id="title" name="title" required maxLength={120} className="sunk field" defaultValue={v(state, "title")} />
        <p className="help">{fr ? "Nom de la soirée, du spectacle, du film ou de l'expo." : "Name of the night, show, film or exhibition."}</p>
      </div>
      <div>
        <label htmlFor="lineup">{fr ? "Avec (artistes, cie, réal.)" : "With (artists, company, director)"}</label>
        <input id="lineup" name="lineup" maxLength={200} className="sunk field" defaultValue={v(state, "lineup")} />
      </div>
      <div className="grid2">
        <div>
          <label htmlFor="category">{fr ? "Type" : "Type"} *</label>
          <select id="category" name="category" required className="sunk field" defaultValue={v(state, "category") ?? ""}>
            <option value="" disabled>{fr ? "Choisir" : "Choose"}</option>
            {categories.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="venue">{fr ? "Lieu" : "Venue"} *</label>
          <select id="venue" name="venue" required className="sunk field" defaultValue={v(state, "venue") ?? preVenue ?? ""}>
            <option value="" disabled>{fr ? "Choisir" : "Choose"}</option>
            {venues.map((o) => <option key={o.slug} value={o.slug}>{o.name}{o.city && o.city !== "Lausanne" ? ` (${o.city})` : ""}</option>)}
          </select>
          <p className="help"><Link href="/ajouter/lieu">{fr ? "Le lieu n'est pas dans la liste ? Ajoute-le." : "Venue missing? Add it."}</Link></p>
        </div>
      </div>
      <div className="grid2">
        <div>
          <label htmlFor="date">Date *</label>
          <input id="date" name="date" type="date" required min={today} className="sunk field" defaultValue={v(state, "date")} />
          <p className="help">{fr ? "Une soirée qui commence après minuit : mets la date du lendemain." : "Starting after midnight: use the next day's date."}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}>
            <label htmlFor="time">{fr ? "Début" : "Start"} *</label>
            <input id="time" name="time" type="time" required className="sunk field" defaultValue={v(state, "time")} />
          </div>
          <div style={{ flex: 1 }}>
            <label htmlFor="endTime">{fr ? "Fin" : "End"}</label>
            <input id="endTime" name="endTime" type="time" className="sunk field" defaultValue={v(state, "endTime")} />
          </div>
        </div>
      </div>
      <fieldset className="g">
        <legend>{fr ? "Genre musical (4 max)" : "Music genre (4 max)"}</legend>
        <div className="choices">
          {genres.map((g) => (
            <label key={g.key} className="opt" style={{ marginRight: 12 }}>
              <input type="checkbox" name="genres" value={g.key} defaultChecked={has(state, "genres", g.key)} /> {g.label}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="g">
        <legend>{fr ? "Prix" : "Price"} *</legend>
        <div className="choices">
          {(["gratuit", "libre", "payant"] as const).map((k) => (
            <label key={k} className="opt" style={{ marginRight: 12 }}>
              <input type="radio" name="priceType" value={k} checked={priceType === k} onChange={() => setPriceType(k)} />
              {k === "gratuit" ? (fr ? "Gratuit" : "Free") : k === "libre" ? (fr ? "Prix libre" : "Pay what you want") : fr ? "Payant" : "Paid"}
            </label>
          ))}
        </div>
        {priceType === "payant" && (
          <div className="grid2" style={{ marginTop: 8 }}>
            <div>
              <label htmlFor="priceMax">{fr ? "Prix plein (CHF)" : "Full price (CHF)"}</label>
              <input id="priceMax" name="priceMax" type="number" min={0} max={1000} inputMode="numeric" className="sunk field" defaultValue={v(state, "priceMax")} />
            </div>
            <div>
              <label htmlFor="priceLabel">{fr ? "Détail (optionnel)" : "Details (optional)"}</label>
              <input id="priceLabel" name="priceLabel" maxLength={40} placeholder="25.- / 15.-" className="sunk field" defaultValue={v(state, "priceLabel")} />
            </div>
          </div>
        )}
      </fieldset>
      <div>
        <label htmlFor="ticketUrl">{fr ? "Lien billetterie" : "Ticket link"}</label>
        <input id="ticketUrl" name="ticketUrl" type="url" placeholder="https://" className="sunk field" defaultValue={v(state, "ticketUrl")} />
      </div>
      <fieldset className="g">
        <legend>{fr ? "Accès" : "Access"}</legend>
        <div className="choices">
          {access.map((a) => (
            <label key={a.key} className="opt" style={{ marginRight: 12 }}>
              <input type="checkbox" name="accessibility" value={a.key} defaultChecked={has(state, "accessibility", a.key)} /> {a.label}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="g">
        <legend>{fr ? "Organisé par (collectifs)" : "Organised by (collectives)"}</legend>
        <div className="sunk scrolllist">
          {colls.map((c) => (
            <label key={c.slug} className="opt">
              <input type="checkbox" name="collectives" value={c.slug} defaultChecked={has(state, "collectives", c.slug, c.slug === preColl)} /> {c.name}
            </label>
          ))}
        </div>
        <label htmlFor="newCollective" style={{ marginTop: 8 }}>{fr ? "Collectif pas dans la liste" : "Collective not listed"}</label>
        <input id="newCollective" name="newCollective" maxLength={80} className="sunk field" defaultValue={v(state, "newCollective")} />
      </fieldset>
      <div>
        <label htmlFor="image">{fr ? "Photo ou flyer" : "Photo or flyer"}</label>
        <input id="image" name="image" type="file" accept="image/jpeg,image/png,image/webp" className="sunk field" style={{ paddingTop: 8 }} aria-describedby="image-help" />
        <p className="help" id="image-help">
          {fr
            ? "JPG, PNG ou WebP, 5 Mo maximum. Les infos cachées de la photo (position GPS, appareil) sont supprimées. Utilise seulement une image que tu as le droit de publier."
            : "JPG, PNG or WebP, 5 MB max. Hidden photo data (GPS location, camera) is removed. Only use an image you are allowed to publish."}
        </p>
      </div>
      <div>
        <label htmlFor="description">Description</label>
        <textarea id="description" name="description" maxLength={3000} className="sunk field" defaultValue={v(state, "description")} />
      </div>
      <label className="opt" style={{ fontFamily: "var(--fb)", fontWeight: 400 }}>
        <input type="checkbox" name="charte" required defaultChecked={has(state, "charte", "on")} />
        <span>{fr ? "Cet événement respecte la " : "This event follows the "}<Link href="/charte" target="_blank">{fr ? "charte" : "charter"}</Link></span>
      </label>
      <div>
        <button className="b strong" type="submit" disabled={pending}>{pending ? "..." : fr ? "Publier l'événement" : "Publish event"}</button>
      </div>
    </form>
  );
}

export function VenueForm({ fr }: L) {
  const [state, action, pending] = useActionState<AddState, FormData>(addVenue, {});
  return (
    <form action={action} className="form" noValidate>
      {state.error && (
        <p className="notice err" role="alert">
          {state.error}{" "}
          {state.error.includes("Décadanse") && <a href="https://www.ladecadanse.ch" target="_blank" rel="noopener noreferrer">ladecadanse.ch</a>}
          {state.error.includes("Connecte") && <Link href="/connexion?next=/ajouter/lieu">{fr ? "Connexion" : "Log in"}</Link>}
        </p>
      )}
      <div>
        <label htmlFor="name">{fr ? "Nom du lieu" : "Venue name"} *</label>
        <input id="name" name="name" required maxLength={100} className="sunk field" defaultValue={v(state, "name")} />
      </div>
      <div>
        <label htmlFor="address">{fr ? "Rue et numéro" : "Street and number"} *</label>
        <input id="address" name="address" required maxLength={150} className="sunk field" autoComplete="street-address" defaultValue={v(state, "address")} />
      </div>
      <div className="grid2">
        <div>
          <label htmlFor="postcode">{fr ? "Code postal" : "Postcode"} *</label>
          <input id="postcode" name="postcode" required inputMode="numeric" pattern="\d{4}" maxLength={4} className="sunk field" autoComplete="postal-code" defaultValue={v(state, "postcode")} />
        </div>
        <div>
          <label htmlFor="city">{fr ? "Commune" : "Town"} *</label>
          <input id="city" name="city" required maxLength={60} className="sunk field" defaultValue={v(state, "city") ?? "Lausanne"} />
        </div>
      </div>
      <p className="help" style={{ margin: 0 }}>
        {fr
          ? "La Décadente couvre surtout Lausanne, et le canton de Vaud jusqu'à Morges. À l'ouest de Morges, c'est le territoire de La Décadanse."
          : "La Décadente covers mainly Lausanne, and the canton of Vaud up to Morges. West of Morges is La Décadanse's territory."}
      </p>
      <div>
        <label htmlFor="website">{fr ? "Site web" : "Website"}</label>
        <input id="website" name="website" type="url" placeholder="https://" className="sunk field" defaultValue={v(state, "website")} />
      </div>
      <div>
        <label htmlFor="description">Description</label>
        <textarea id="description" name="description" maxLength={1000} className="sunk field" defaultValue={v(state, "description")} />
      </div>
      <label className="opt" style={{ fontFamily: "var(--fb)", fontWeight: 400 }}>
        <input type="checkbox" name="charte" required />
        <span>{fr ? "Ce lieu respecte la " : "This venue follows the "}<Link href="/charte" target="_blank">{fr ? "charte" : "charter"}</Link></span>
      </label>
      <div>
        <button className="b strong" type="submit" disabled={pending}>{pending ? "..." : fr ? "Ajouter le lieu" : "Add venue"}</button>
      </div>
    </form>
  );
}
