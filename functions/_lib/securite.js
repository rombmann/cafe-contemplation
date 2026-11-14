/* =====================================================================
   Sécurité de l'admin : mot de passe, session, protection contre les essais
   répétés et les requêtes venues d'autres sites.

   Variables à définir dans Cloudflare (Settings → Variables and Secrets) :
     ADMIN_PASSWORD   mot de passe de l'admin (long, donné au café)
     SESSION_SECRET   longue chaîne aléatoire (jamais communiquée)
   Facultatif : un espace KV lié sous le nom ADMIN_KV, pour bloquer
   durablement une adresse après 5 essais ratés (15 minutes).
   ===================================================================== */

const COOKIE = "cc_admin";
const DUREE_SESSION = 14 * 24 * 3600;      // 14 jours, puis il faut se reconnecter
const ESSAIS_MAX = 5;
const BLOCAGE = 15 * 60;                   // secondes

const enc = new TextEncoder();

function b64url(buf) {
  let s = "";
  new Uint8Array(buf).forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(cle, texte) {
  const k = await crypto.subtle.importKey("raw", enc.encode(cle), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64url(await crypto.subtle.sign("HMAC", k, enc.encode(texte)));
}

/* Comparaison en temps constant (on compare des empreintes de même longueur) */
async function egal(a, b) {
  const cle = crypto.getRandomValues(new Uint8Array(32));
  const k = await crypto.subtle.importKey("raw", cle, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const [x, y] = await Promise.all([crypto.subtle.sign("HMAC", k, enc.encode(a)), crypto.subtle.sign("HMAC", k, enc.encode(b))]);
  const u = new Uint8Array(x), v = new Uint8Array(y);
  let diff = 0;
  for (let i = 0; i < u.length; i++) diff |= u[i] ^ v[i];
  return diff === 0;
}

export function reponse(corps, statut = 200, entetes = {}) {
  return new Response(JSON.stringify(corps), {
    status: statut,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...entetes }
  });
}

export function configurationManquante(env) {
  const manque = ["ADMIN_PASSWORD", "SESSION_SECRET"].filter((k) => !env[k]);
  if (env.ADMIN_PASSWORD && env.ADMIN_PASSWORD.length < 12) manque.push("ADMIN_PASSWORD (12 caractères minimum)");
  return manque;
}

/* Clé de signature : change si le mot de passe change, ce qui déconnecte tout le monde */
function cleSession(env) { return env.SESSION_SECRET + "|" + env.ADMIN_PASSWORD; }

/* Refuse les requêtes envoyées depuis un autre site */
export function memeOrigine(request) {
  const origine = request.headers.get("origin");
  if (origine && origine !== new URL(request.url).origin) return false;
  if (request.method !== "GET" && !(request.headers.get("content-type") || "").startsWith("application/json")) return false;
  return true;
}

function ip(request) { return request.headers.get("cf-connecting-ip") || "local"; }

const essaisMemoire = new Map();   // repli sans KV : limité à une instance, mais mieux que rien

async function lireEssais(env, cle) {
  if (env.ADMIN_KV) return Number(await env.ADMIN_KV.get(cle)) || 0;
  const e = essaisMemoire.get(cle);
  if (!e || e.fin < Date.now()) return 0;
  return e.n;
}

async function noterEchec(env, cle) {
  const n = (await lireEssais(env, cle)) + 1;
  if (env.ADMIN_KV) await env.ADMIN_KV.put(cle, String(n), { expirationTtl: BLOCAGE });
  else essaisMemoire.set(cle, { n, fin: Date.now() + BLOCAGE * 1000 });
  return n;
}

async function effacerEchecs(env, cle) {
  if (env.ADMIN_KV) await env.ADMIN_KV.delete(cle);
  else essaisMemoire.delete(cle);
}

/* Vérifie le mot de passe et renvoie le cookie de session, ou un message d'erreur */
export async function connecter(request, env, motDePasse) {
  const cle = "echecs:" + ip(request);
  if ((await lireEssais(env, cle)) >= ESSAIS_MAX)
    return { erreur: "Trop d'essais. Réessayez dans 15 minutes.", statut: 429 };

  const ok = typeof motDePasse === "string" && motDePasse.length <= 200 && (await egal(motDePasse, env.ADMIN_PASSWORD));
  if (!ok) {
    await noterEchec(env, cle);
    await new Promise((r) => setTimeout(r, 800));   // ralentit les essais automatiques
    return { erreur: "Mot de passe incorrect.", statut: 401 };
  }
  await effacerEchecs(env, cle);

  const fin = Math.floor(Date.now() / 1000) + DUREE_SESSION;
  const jeton = fin + "." + (await hmac(cleSession(env), "session:" + fin));
  return { cookie: `${COOKIE}=${jeton}; Path=/; Max-Age=${DUREE_SESSION}; HttpOnly; Secure; SameSite=Strict` };
}

export function cookieDeconnexion() {
  return `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`;
}

/* true si la requête porte une session valide */
export async function estConnecte(request, env) {
  const m = (request.headers.get("cookie") || "").match(new RegExp("(?:^|;\\s*)" + COOKIE + "=([^;]+)"));
  if (!m) return false;
  const [fin, signature] = m[1].split(".");
  if (!fin || !signature || !/^\d+$/.test(fin) || Number(fin) < Date.now() / 1000) return false;
  return egal(signature, await hmac(cleSession(env), "session:" + fin));
}
