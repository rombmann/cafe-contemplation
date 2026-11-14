/* POST /api/connexion  { motDePasse }  → ouvre une session (cookie) */
import { connecter, configurationManquante, memeOrigine, reponse } from "../_lib/securite.js";

export async function onRequestPost({ request, env }) {
  const manque = configurationManquante(env);
  if (manque.length) return reponse({ erreur: "Admin pas encore configuré : " + manque.join(", ") }, 503);
  if (!memeOrigine(request)) return reponse({ erreur: "Requête refusée." }, 403);

  let corps = {};
  try { corps = await request.json(); } catch (e) { /* corps vide */ }
  const r = await connecter(request, env, corps.motDePasse);
  if (r.erreur) return reponse({ erreur: r.erreur }, r.statut);
  return reponse({ ok: true }, 200, { "set-cookie": r.cookie });
}
