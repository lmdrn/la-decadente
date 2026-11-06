"use client";

import Link from "next/link";
import { useActionState } from "react";
import { changePassword, login, register, type FormState } from "./actions";

export function LoginForm({ next, fr }: { next: string; fr: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(login, {});
  return (
    <form action={action} className="form" noValidate>
      <input type="hidden" name="next" value={next} />
      {state.error && <p className="notice err" role="alert">{state.error}</p>}
      <div>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required className="sunk field" defaultValue={state.fields?.email} />
      </div>
      <div>
        <label htmlFor="password">{fr ? "Mot de passe" : "Password"}</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="sunk field" />
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <button className="b strong" type="submit" disabled={pending}>{pending ? "..." : fr ? "Se connecter" : "Log in"}</button>
        <span>
          {fr ? "Pas encore de compte ?" : "No account yet?"} <Link href={`/inscription?next=${encodeURIComponent(next)}`}>{fr ? "Créer un compte" : "Sign up"}</Link>
        </span>
      </div>
    </form>
  );
}

export function RegisterForm({ next, fr }: { next: string; fr: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(register, {});
  return (
    <form action={action} className="form" noValidate>
      <input type="hidden" name="next" value={next} />
      {state.error && <p className="notice err" role="alert">{state.error}</p>}
      <div>
        <label htmlFor="displayName">{fr ? "Pseudo" : "Display name"}</label>
        <input id="displayName" name="displayName" required minLength={2} maxLength={40} className="sunk field" autoComplete="nickname" defaultValue={state.fields?.displayName} />
        <p className="help">{fr ? "Visible publiquement si tu ajoutes des événements." : "Shown publicly if you add events."}</p>
      </div>
      <div>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required className="sunk field" autoComplete="email" defaultValue={state.fields?.email} />
      </div>
      <div>
        <label htmlFor="password">{fr ? "Mot de passe" : "Password"}</label>
        <input id="password" name="password" type="password" required minLength={10} className="sunk field" autoComplete="new-password" aria-describedby="pw-help" />
        <p className="help" id="pw-help">{fr ? "10 caractères minimum. Une phrase marche très bien." : "At least 10 characters. A sentence works well."}</p>
      </div>
      <label className="opt" style={{ fontFamily: "var(--fb)", fontWeight: 400 }}>
        <input type="checkbox" name="charte" required />
        <span>
          {fr ? "J'ai lu et j'accepte la " : "I have read and accept the "}
          <Link href="/charte" target="_blank">{fr ? "charte" : "charter"}</Link>
        </span>
      </label>
      <div>
        <button className="b strong" type="submit" disabled={pending}>{pending ? "..." : fr ? "Créer mon compte" : "Create my account"}</button>
      </div>
    </form>
  );
}

export function PasswordForm({ fr }: { fr: boolean }) {
  const [state, action, pending] = useActionState(changePassword, {});
  return (
    <form action={action} className="form" style={{ padding: 0 }}>
      {state.error && <p className="notice err" role="alert">{state.error}</p>}
      {"ok" in state && state.ok && <p className="notice" role="status">{fr ? "Mot de passe changé." : "Password changed."}</p>}
      <div className="grid2">
        <div>
          <label htmlFor="current">{fr ? "Mot de passe actuel" : "Current password"}</label>
          <input id="current" name="current" type="password" autoComplete="current-password" required className="sunk field" />
        </div>
        <div>
          <label htmlFor="new">{fr ? "Nouveau mot de passe" : "New password"}</label>
          <input id="new" name="password" type="password" autoComplete="new-password" minLength={10} required className="sunk field" />
        </div>
      </div>
      <div><button className="b" type="submit" disabled={pending}>{fr ? "Changer" : "Change"}</button></div>
    </form>
  );
}
