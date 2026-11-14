/* =====================================================================
   Lecture et écriture de donnees.js dans le dépôt GitHub.
   Chaque enregistrement de l'admin devient un commit sur la branche main ;
   Cloudflare Pages republie alors le site automatiquement (environ 1 minute).

   Variables à définir dans Cloudflare :
     GITHUB_TOKEN   jeton « fine-grained » limité au dépôt, droit Contents : Read and write
     GITHUB_REPO    facultatif, par défaut rombmann/cafe-contemplation
     GITHUB_BRANCH  facultatif, par défaut main
   ===================================================================== */

import { FICHIER } from "./donnees.js";

function cfg(env) {
  return {
    api: env.GITHUB_API || "https://api.github.com",
    repo: env.GITHUB_REPO || "rombmann/cafe-contemplation",
    branche: env.GITHUB_BRANCH || "main"
  };
}

function entetes(env) {
  return {
    authorization: "Bearer " + env.GITHUB_TOKEN,
    accept: "application/vnd.github+json",
    "x-github-api-version": "2022-11-28",
    "user-agent": "cafe-contemplation-admin"
  };
}

function versBase64(texte) {
  let s = "";
  new TextEncoder().encode(texte).forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s);
}

function depuisBase64(b64) {
  const bin = atob(b64.replace(/\s/g, ""));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

export class ErreurGitHub extends Error {
  constructor(message, statut) { super(message); this.statut = statut; }
}

/* Renvoie { texte, sha } de la version actuelle de donnees.js */
export async function lire(env) {
  const c = cfg(env);
  const r = await fetch(`${c.api}/repos/${c.repo}/contents/${FICHIER}?ref=${encodeURIComponent(c.branche)}`, { headers: entetes(env) });
  if (!r.ok) throw new ErreurGitHub(`Lecture GitHub impossible (${r.status})`, r.status);
  const j = await r.json();
  return { texte: depuisBase64(j.content), sha: j.sha };
}

/* Écrit donnees.js ; sha = version lue au départ (refus si quelqu'un a modifié entre-temps) */
export async function ecrire(env, texte, sha, message) {
  const c = cfg(env);
  const r = await fetch(`${c.api}/repos/${c.repo}/contents/${FICHIER}`, {
    method: "PUT",
    headers: { ...entetes(env), "content-type": "application/json" },
    body: JSON.stringify({ message, content: versBase64(texte), sha, branch: c.branche })
  });
  if (r.status === 409 || r.status === 422)
    throw new ErreurGitHub("Les données ont été modifiées entre-temps (par quelqu'un d'autre ou dans un autre onglet). Rechargez la page.", 409);
  if (!r.ok) throw new ErreurGitHub(`Enregistrement GitHub impossible (${r.status})`, r.status);
  const j = await r.json();
  return { sha: j.content && j.content.sha };
}
