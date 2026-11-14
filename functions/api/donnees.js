/* =====================================================================
   GET /api/donnees  → données actuelles (dernière version sur GitHub) + version (sha)
   PUT /api/donnees  { donnees, sha } → vérifie, puis enregistre sur GitHub
   Réservé à une session ouverte (voir /api/connexion).
   ===================================================================== */
import { configurationManquante, estConnecte, memeOrigine, reponse } from "../_lib/securite.js";
import { depuisFichier, verifier, versFichier, Invalide } from "../_lib/donnees.js";
import { lire, ecrire, ErreurGitHub } from "../_lib/github.js";

const NOMS = { hours: "horaires", fermetures: "fermetures", fermetureAnnonceJours: "annonce des fermetures", google: "note Google", menu: "carte", douceurs: "douceurs" };

async function garde(request, env) {
  const manque = configurationManquante(env);
  if (!env.GITHUB_TOKEN) manque.push("GITHUB_TOKEN");
  if (manque.length) return reponse({ erreur: "Admin pas encore configuré : " + manque.join(", ") }, 503);
  if (!memeOrigine(request)) return reponse({ erreur: "Requête refusée." }, 403);
  if (!(await estConnecte(request, env))) return reponse({ erreur: "Session expirée : reconnectez-vous." }, 401);
  return null;
}

export async function onRequestGet({ request, env }) {
  const refus = await garde(request, env);
  if (refus) return refus;
  try {
    const { texte, sha } = await lire(env);
    return reponse({ donnees: depuisFichier(texte), sha });
  } catch (e) {
    return reponse({ erreur: e instanceof ErreurGitHub ? e.message : "Données illisibles." }, 502);
  }
}

export async function onRequestPut({ request, env }) {
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

    const message = "Admin du café : " + changes.join(", ");
    const r = await ecrire(env, versFichier(propres), corps.sha, message);
    return reponse({ ok: true, sha: r.sha, donnees: propres, changes });
  } catch (e) {
    if (e instanceof ErreurGitHub) return reponse({ erreur: e.message }, e.statut === 409 ? 409 : 502);
    return reponse({ erreur: "Enregistrement impossible." }, 500);
  }
}
