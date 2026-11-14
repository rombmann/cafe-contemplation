/* POST /api/deconnexion → ferme la session */
import { cookieDeconnexion, memeOrigine, reponse } from "../_lib/securite.js";

export async function onRequestPost({ request }) {
  if (!memeOrigine(request)) return reponse({ erreur: "Requête refusée." }, 403);
  return reponse({ ok: true }, 200, { "set-cookie": cookieDeconnexion() });
}
