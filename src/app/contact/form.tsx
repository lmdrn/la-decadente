"use client";

import { useActionState } from "react";
import { sendContact, type ContactState } from "./actions";

export function ContactForm({ fr }: { fr: boolean }) {
  const [state, action, pending] = useActionState<ContactState, FormData>(sendContact, {});
  if (state.ok)
    return (
      <p className="notice" role="status" style={{ margin: "16px 20px 24px" }}>
        {fr ? "Message envoyé. Merci !" : "Message sent. Thanks!"}
      </p>
    );
  return (
    <form action={action} className="form" noValidate>
      {state.error && <p className="notice err" role="alert">{state.error}</p>}
      {/* Champ piège pour les robots : invisible pour les humain·es */}
      <div aria-hidden="true" style={{ position: "absolute", left: -9999 }}>
        <label htmlFor="website">Site</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="grid2">
        <div>
          <label htmlFor="name">{fr ? "Nom ou pseudo" : "Name"} *</label>
          <input id="name" name="name" required maxLength={80} className="sunk field" autoComplete="name" />
        </div>
        <div>
          <label htmlFor="email">Email *</label>
          <input id="email" name="email" type="email" required maxLength={200} className="sunk field" autoComplete="email" />
        </div>
      </div>
      <div>
        <label htmlFor="message">Message *</label>
        <textarea id="message" name="message" required minLength={10} maxLength={4000} className="sunk field" style={{ minHeight: 180 }} />
      </div>
      <div>
        <button className="b strong" type="submit" disabled={pending}>{pending ? "..." : fr ? "Envoyer" : "Send"}</button>
      </div>
    </form>
  );
}
