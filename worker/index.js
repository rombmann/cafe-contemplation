/* =====================================================================
   Worker Cloudflare du site du Café Contemplation.
   - Les fichiers du site (index.html, images, admin/…) sont servis directement
     par Cloudflare, sans passer par ce code (voir wrangler.jsonc).
   - Seules les adresses /api/… arrivent ici : connexion à l'admin et
     enregistrement des données du café (donnees.js) sur GitHub.
   ===================================================================== */
import { connecter, cookieDeconnexion, configurationManquante, estConnecte, memeOrigine, reponse } from "./securite.js";
import { depuisFichier, verifier, versFichier, Invalide } from "./donnees.js";
import { lire, ecrire, ErreurGitHub } from "./github.js";

const NOMS = { hours: "horaires", fermetures: "fermetures", fermetureAnnonceJours: "annonce des fermetures", google: "note Google", menu: "carte", douceurs: "douceurs" };

/* ---------- POST /api/connexion  { motDePasse } → ouvre une session (cookie) ---------- */
async function connexion(request, env) {
  const manque = configurationManquante(env);
  if (manque.length) return reponse({ erreur: "Admin pas encore configuré : " + manque.join(", ") }, 503);
  if (!memeOrigine(request)) return reponse({ erreur: "Requête refusée." }, 403);
  let corps = {};
  try { corps = await request.json(); } catch (e) { /* corps vide */ }
  const r = await connecter(request, env, corps.motDePasse);
  if (r.erreur) return reponse({ erreur: r.erreur }, r.statut);
  return reponse({ ok: true }, 200, { "set-cookie": r.cookie });
}

/* ---------- POST /api/deconnexion → ferme la session ---------- */
function deconnexion(request) {
  if (!memeOrigine(request)) return reponse({ erreur: "Requête refusée." }, 403);
  return reponse({ ok: true }, 200, { "set-cookie": cookieDeconnexion() });
}

/* ---------- Contrôles communs aux routes /api/donnees ---------- */
async function garde(request, env) {
  const manque = configurationManquante(env);
  if (!env.GITHUB_TOKEN) manque.push("GITHUB_TOKEN");
  if (manque.length) return reponse({ erreur: "Admin pas encore configuré : " + manque.join(", ") }, 503);
  if (!memeOrigine(request)) return reponse({ erreur: "Requête refusée." }, 403);
  if (!(await estConnecte(request, env))) return reponse({ erreur: "Session expirée : reconnectez-vous." }, 401);
  return null;
}

/* ---------- GET /api/donnees → dernière version sur GitHub + sa version (sha) ---------- */
async function lireDonnees(request, env) {
  const refus = await garde(request, env);
  if (refus) return refus;
  try {
    const { texte, sha } = await lire(env);
    return reponse({ donnees: depuisFichier(texte), sha });
  } catch (e) {
    return reponse({ erreur: e instanceof ErreurGitHub ? e.message : "Données illisibles." }, 502);
  }
}

/* ---------- PUT /api/donnees { donnees, sha } → vérifie puis enregistre sur GitHub ---------- */
async function ecrireDonnees(request, env) {
  const refus = await garde(request, env);
  if (refus) return refus;

  let corps;
  try { corps = await request.json(); } catch (e) { return reponse({ erreur: "Requête illisible." }, 400); }
  if (typeof corps.sha !== "string" || !/^[0-9a-f]{40}$/.test(corps.sha)) return reponse({ erreur: "Version manquante : rechargez la page." }, 400);

  let propres;
  try { propres = verifier(corps.donnees); }
  catch (e) { return reponse({ erreur: e instanceof Invalide ? e.message : "Données invalides." }, 422); }

  try {
    /* Message de commit lisible : quelles parties ont changé */
    let avant = {};
    try { avant = depuisFichier((await lire(env)).texte); } catch (e) { /* message générique */ }
    const changes = Object.keys(NOMS).filter((k) => JSON.stringify(avant[k]) !== JSON.stringify(propres[k])).map((k) => NOMS[k]);
    if (!changes.length) return reponse({ ok: true, inchange: true, sha: corps.sha });

    const r = await ecrire(env, versFichier(propres), corps.sha, "Admin du café : " + changes.join(", "));
    return reponse({ ok: true, sha: r.sha, donnees: propres, changes });
  } catch (e) {
    if (e instanceof ErreurGitHub) return reponse({ erreur: e.message }, e.statut === 409 ? 409 : 502);
    return reponse({ erreur: "Enregistrement impossible." }, 500);
  }
}

/* ---------- Aiguillage ---------- */
const ROUTES = {
  "POST /api/connexion": connexion,
  "POST /api/deconnexion": deconnexion,
  "GET /api/donnees": lireDonnees,
  "PUT /api/donnees": ecrireDonnees
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      const route = ROUTES[request.method + " " + url.pathname.replace(/\/+$/, "")];
      if (!route) return reponse({ erreur: "Adresse inconnue." }, 404);
      try { return await route(request, env); }
      catch (e) { return reponse({ erreur: "Erreur du serveur." }, 500); }
    }
    /* Tout le reste : fichiers du site (normalement servis avant d'arriver ici) */
    return env.ASSETS.fetch(request);
  }
};
