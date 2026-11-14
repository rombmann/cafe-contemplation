/* =====================================================================
   Données modifiables depuis l'admin : lecture, vérification, écriture.
   Utilisé par le Worker Cloudflare (worker/index.js) et par les tests.
   Le fichier du site s'appelle donnees.js et contient :
       window.DONNEES = { ...JSON... };
   ===================================================================== */

export const FICHIER = "donnees.js";

export const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

const ENTETE = `/* =====================================================================
   DONNÉES DU CAFÉ MODIFIABLES DEPUIS L'ADMIN (adresse du site + /admin)
   Horaires, fermetures exceptionnelles, note Google, carte et douceurs.
   Ce fichier est réécrit à chaque enregistrement dans l'admin. On peut aussi
   le modifier à la main, à condition de garder un JSON valide après
   « window.DONNEES = » (guillemets doubles, pas de virgule finale).
   Signification des champs : commentaire « MODIFIER LES DONNÉES DU SITE ICI »
   dans index.html.
   ===================================================================== */
`;

/* Transforme l'objet en contenu du fichier donnees.js */
export function versFichier(donnees) {
  return ENTETE + "window.DONNEES = " + JSON.stringify(donnees, null, 2) + ";\n";
}

/* Retrouve l'objet à partir du contenu du fichier donnees.js */
export function depuisFichier(texte) {
  /* La vraie ligne commence en début de ligne (l'en-tête cite aussi « window.DONNEES = ») */
  const m = /^window\.DONNEES\s*=/m.exec(texte);
  if (!m) throw new Error("window.DONNEES introuvable");
  const egal = m.index + m[0].length - 1;
  const fin = texte.lastIndexOf("}");
  return JSON.parse(texte.slice(egal + 1, fin + 1));
}

/* ---------- Vérification stricte de ce qu'envoie l'admin ---------- */

class Invalide extends Error {}
export { Invalide };

function texte(v, champ, max, obligatoire) {
  if (v === undefined || v === null || v === "") {
    if (obligatoire) throw new Invalide(`${champ} : à remplir`);
    return undefined;
  }
  if (typeof v !== "string") throw new Invalide(`${champ} : texte attendu`);
  const t = v.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
  if (!t) { if (obligatoire) throw new Invalide(`${champ} : à remplir`); return undefined; }
  if (t.length > max) throw new Invalide(`${champ} : ${max} caractères au maximum`);
  if (/[<>]/.test(t)) throw new Invalide(`${champ} : les caractères < et > ne sont pas autorisés`);
  return t;
}

function prix(v, champ, obligatoire) {
  if (v === undefined || v === null || v === "") {
    if (obligatoire) throw new Invalide(`${champ} : prix à remplir`);
    return undefined;
  }
  const n = typeof v === "string" ? Number(v.replace(",", ".")) : v;
  if (typeof n !== "number" || !isFinite(n) || n < 0 || n > 500) throw new Invalide(`${champ} : prix invalide`);
  return Math.round(n * 100) / 100;
}

function oui(v) { return v === true ? true : undefined; }

function heure(v, champ) {
  if (typeof v !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(v)) throw new Invalide(`${champ} : heure invalide (HH:MM)`);
  return v;
}

function date(v, champ) {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v) || isNaN(Date.parse(v + "T00:00:00Z")))
    throw new Invalide(`${champ} : date invalide`);
  return v;
}

function slug(v, champ) {
  if (typeof v !== "string" || !/^[a-z0-9-]{1,30}$/.test(v)) throw new Invalide(`${champ} : identifiant invalide`);
  return v;
}

function liste(v, champ, max) {
  if (!Array.isArray(v)) throw new Invalide(`${champ} : liste attendue`);
  if (v.length > max) throw new Invalide(`${champ} : ${max} éléments au maximum`);
  return v;
}

/* Enlève les champs vides pour garder un fichier propre */
function propre(o) {
  Object.keys(o).forEach((k) => o[k] === undefined && delete o[k]);
  return o;
}

export function verifier(d) {
  if (!d || typeof d !== "object") throw new Invalide("Données manquantes");

  const hours = liste(d.hours, "Horaires", 7);
  if (hours.length !== 7) throw new Invalide("Horaires : il faut les 7 jours");
  const horaires = hours.map((h, i) => {
    const jour = JOURS[i];
    if (h && h.closed === true) return { day: jour, closed: true };
    const open = heure(h && h.open, `${jour}, ouverture`);
    const close = heure(h && h.close, `${jour}, fermeture`);
    if (close <= open) throw new Invalide(`${jour} : la fermeture doit être après l'ouverture`);
    return { day: jour, open, close };
  });

  const fermetures = liste(d.fermetures || [], "Fermetures", 40).map((f, i) => {
    const n = `Fermeture ${i + 1}`;
    const du = date(f && f.du, `${n}, début`);
    const au = f && f.au ? date(f.au, `${n}, fin`) : undefined;
    if (au && au < du) throw new Invalide(`${n} : la fin doit être après le début`);
    return propre({ du, au: au && au !== du ? au : undefined, motif: texte(f.motif, `${n}, motif`, 80), motif_en: texte(f.motif_en, `${n}, motif en anglais`, 80) });
  });
  fermetures.sort((a, b) => (a.du < b.du ? -1 : 1));

  const annonce = Number(d.fermetureAnnonceJours);
  if (!Number.isInteger(annonce) || annonce < 0 || annonce > 90) throw new Invalide("Annonce des fermetures : entre 0 et 90 jours");

  const g = d.google || {};
  const note = Number(g.ratingValue), avis = Number(g.reviewCount);
  if (!isFinite(note) || note < 1 || note > 5) throw new Invalide("Note Google : entre 1 et 5");
  if (!Number.isInteger(avis) || avis < 0 || avis > 1000000) throw new Invalide("Nombre d'avis Google invalide");
  if (typeof g.checkedOn !== "string" || !/^\d{4}-(0[1-9]|1[0-2])$/.test(g.checkedOn)) throw new Invalide("Mois du relevé Google invalide");
  const google = { ratingValue: Math.round(note * 10) / 10, reviewCount: avis, checkedOn: g.checkedOn };

  const ids = new Set();
  const menu = liste(d.menu, "Carte", 15).map((c, i) => {
    const n = `Catégorie ${i + 1}`;
    const id = slug(c && c.id, `${n}, identifiant`);
    if (ids.has(id)) throw new Invalide(`${n} : identifiant en double`);
    ids.add(id);
    const items = liste(c.items, `${n}, produits`, 60).map((p, j) => {
      const m = `${texte(c.title, "", 60) || n}, produit ${j + 1}`;
      const temps = p && p.temps ? liste(p.temps, `${m}, chaud / glacé`, 2).filter((x) => x === "chaud" || x === "glacé") : [];
      return propre({
        name: texte(p && p.name, `${m}, nom`, 60, true),
        name_en: texte(p.name_en, `${m}, nom en anglais`, 60),
        price: prix(p.price, m, true),
        temps: temps.length ? temps : undefined,
        fav: oui(p.fav),
        desc: texte(p.desc, `${m}, description`, 160),
        desc_en: texte(p.desc_en, `${m}, description en anglais`, 160),
        gap: oui(p.gap),
        available: p.available === false ? false : undefined
      });
    });
    return propre({
      id,
      title: texte(c.title, `${n}, titre`, 60, true),
      title_en: texte(c.title_en, `${n}, titre en anglais`, 60),
      after: c.after ? slug(c.after, `${n}, emplacement`) : undefined,
      items
    });
  });
  menu.forEach((c) => { if (c.after && !ids.has(c.after)) delete c.after; });

  const douceurs = liste(d.douceurs, "Douceurs", 40).map((p, i) => {
    const m = `Douceur ${i + 1}`;
    return propre({
      name: texte(p && p.name, `${m}, nom`, 60, true),
      name_en: texte(p.name_en, `${m}, nom en anglais`, 60),
      desc: texte(p.desc, `${m}, description`, 200),
      desc_en: texte(p.desc_en, `${m}, description en anglais`, 200),
      price: prix(p.price, m, false),
      confirm: oui(p.confirm),
      available: p.available === false ? false : undefined
    });
  });

  return { hours: horaires, fermetures, fermetureAnnonceJours: annonce, google, menu, douceurs };
}
