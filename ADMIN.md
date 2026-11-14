# Admin du café : installation sur Cloudflare Pages

L'admin (`/admin`) permet au café de modifier lui-même, avec un simple mot de passe, sans compte GitHub :
horaires, fermetures exceptionnelles, carte et prix, douceurs, note Google.

## Comment ça marche

- Le site est hébergé gratuitement sur **Cloudflare Pages**, branché sur ce dépôt GitHub.
- Les données modifiables sont dans `donnees.js`. Le reste du site (design, textes) ne change pas.
- Quand le café clique sur « Enregistrer », une fonction Cloudflare (`functions/api/`) vérifie le mot de passe
  et les données, puis enregistre `donnees.js` dans ce dépôt (commit « Admin du café : … »).
  Cloudflare republie le site en une minute environ.
- Conséquence pour nous deux : **toujours `git pull --rebase` avant de travailler**. Le café peut avoir modifié
  `donnees.js` depuis l'admin.
- GitHub Pages (`rombmann.github.io/cafe-contemplation`) continue d'afficher le site, mais l'admin n'y fonctionne pas
  (pas de serveur). La page `/admin` y affiche un message d'explication.

## Installation (une fois, environ 20 minutes)

### 1. Jeton GitHub (pour que l'admin puisse enregistrer)

1. https://github.com/settings/personal-access-tokens/new (jeton « fine-grained »).
2. Nom : `admin-cafe-contemplation`. Expiration : 1 an (**noter la date** : à renouveler avant, sinon l'admin
   ne pourra plus enregistrer).
3. Repository access : **Only select repositories** → `rombmann/cafe-contemplation`.
4. Permissions → Repository permissions → **Contents : Read and write**. Rien d'autre.
5. Générer et copier le jeton (il ne s'affiche qu'une fois).

### 2. Projet Cloudflare Pages

1. Créer un compte gratuit sur https://dash.cloudflare.com/sign-up.
2. Workers & Pages → Create → onglet **Pages** → **Connect to Git** → autoriser GitHub → choisir `cafe-contemplation`.
3. Réglages de build :
   - Production branch : `main`
   - Framework preset : **None**
   - Build command : *(vide)*
   - Build output directory : `/`
4. Save and Deploy. Le site est en ligne sur `https://<nom-du-projet>.pages.dev`.

### 3. Secrets de l'admin

Dans le projet Pages → Settings → **Variables and Secrets** → Add (type **Secret**, environnement Production) :

| Nom | Valeur |
|---|---|
| `ADMIN_PASSWORD` | le mot de passe donné au café (12 caractères minimum, par exemple 4 mots au hasard) |
| `SESSION_SECRET` | une longue chaîne aléatoire, jamais communiquée (générer avec `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`) |
| `GITHUB_TOKEN` | le jeton de l'étape 1 |

Puis Deployments → dernier déploiement → **Retry deployment** pour qu'ils soient pris en compte.

Facultatif mais conseillé : blocage durable après 5 mots de passe faux.
Workers & Pages → KV → Create namespace `admin-essais`, puis dans le projet Pages → Settings → Bindings →
Add → KV namespace, nom de variable **`ADMIN_KV`**. (Sans KV, un blocage plus léger s'applique quand même.)

### 4. Tester

Ouvrir `https://<nom-du-projet>.pages.dev/admin`, se connecter, changer un prix, enregistrer. Vérifier :
- le commit « Admin du café : carte » apparaît sur GitHub ;
- une minute plus tard, le prix a changé sur le site.

Remettre le prix d'origine depuis l'admin.

### 5. Nom de domaine (à la mise en ligne définitive)

1. Projet Pages → **Custom domains** → Set up a custom domain → `www.cafecontemplation.ch`.
   Cloudflare indique un enregistrement **CNAME** à créer.
2. Chez Infomaniak (compte du café) → Domaines → `cafecontemplation.ch` → Zone DNS : ajouter ce CNAME
   (`www` → `<nom-du-projet>.pages.dev`). **Ne pas toucher aux enregistrements MX** : ce sont ceux de l'e-mail.
3. Chez Infomaniak, rediriger `cafecontemplation.ch` (sans www) vers `https://www.cafecontemplation.ch`.
4. Dans le site : adresse dans le commentaire « ADRESSE DU SITE » de `index.html`, `<base href="/">` dans
   `404.html`, et retrait du `noindex` (voir LISEZ-MOI).

## Tester en local (sans rien publier)

```bash
npx wrangler pages dev . --port 8788
```

Avec un fichier `.dev.vars` (ignoré par git) contenant `ADMIN_PASSWORD`, `SESSION_SECRET` et `GITHUB_TOKEN`.
Attention : avec un vrai jeton, enregistrer depuis l'admin local **publie** sur `main`. Pour tester sans publier,
ajouter `GITHUB_API=http://127.0.0.1:8799` et lancer un faux serveur GitHub local.

## Sécurité, en bref

- Mot de passe vérifié côté serveur (comparaison en temps constant), session dans un cookie `HttpOnly`,
  `Secure`, `SameSite=Strict`, valable 14 jours. Changer `ADMIN_PASSWORD` déconnecte tout le monde.
- Requêtes venant d'un autre site refusées. Blocage de 15 minutes après 5 essais ratés.
- Toutes les données sont revérifiées côté serveur (formats, longueurs, heures, dates, prix ; les caractères
  `<` et `>` sont refusés). Seul `donnees.js` peut être modifié, jamais le code.
- Le jeton GitHub n'a accès qu'à ce dépôt, en lecture et écriture du contenu.
- Chaque modification est un commit : on voit qui a changé quoi, et on peut annuler (`git revert`).
