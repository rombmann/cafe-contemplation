# Admin du café : installation sur Cloudflare (Worker)

L'admin (`/admin`) permet au café de modifier lui-même, avec un simple mot de passe et sans compte GitHub :
horaires, fermetures exceptionnelles, carte et prix, douceurs, note Google.

## Comment ça marche

- Le site est hébergé gratuitement sur un **Worker Cloudflare**, branché sur ce dépôt GitHub : chaque push sur `main`
  le redéploie automatiquement (configuration : `wrangler.jsonc`).
- Les fichiers du site sont servis tels quels. Ceux listés dans `.assetsignore` ne sont jamais publiés
  (code du Worker, configuration, fichiers `.md`, secrets locaux).
- Seules les adresses `/api/…` passent par le code du Worker (`worker/index.js`) : connexion à l'admin,
  lecture et enregistrement des données.
- Les données modifiables sont dans `donnees.js`. Quand le café clique sur « Enregistrer », le Worker vérifie
  le mot de passe et les données, puis enregistre `donnees.js` dans ce dépôt (commit « Admin du café : … »).
  Cloudflare redéploie le site en une minute environ.
- Conséquence pour nous deux : **toujours `git pull --rebase` avant de travailler**. Le café peut avoir modifié
  `donnees.js` depuis l'admin.
- GitHub Pages (`rombmann.github.io/cafe-contemplation`) continue d'afficher le site, mais l'admin n'y fonctionne pas
  (pas de serveur) : la page `/admin` y redirige automatiquement vers l'admin Cloudflare
  (adresse dans `ADMIN_URL`, en haut de `admin/index.html`, à changer si l'adresse du site change).

## Installation (une fois, environ 20 minutes)

### 1. Jeton GitHub (pour que l'admin puisse enregistrer)

1. https://github.com/settings/personal-access-tokens/new (jeton « fine-grained »).
2. Nom : `admin-cafe-contemplation`. Expiration : 1 an (**noter la date** : à renouveler avant, sinon l'admin
   ne pourra plus enregistrer ; GitHub envoie aussi un e-mail de rappel).
3. Repository access : **Only select repositories** → `rombmann/cafe-contemplation`.
4. Permissions → Repository permissions → **Contents : Read and write**. Rien d'autre.
5. Générer et copier le jeton (il ne s'affiche qu'une fois).

### 2. Worker Cloudflare branché sur GitHub

1. https://dash.cloudflare.com → **Workers & Pages** → **Create** → **Import a repository** (GitHub) →
   `rombmann/cafe-contemplation`.
2. Réglages :
   - Project name : **`cafe-contemplation`** (doit être identique au `name` de `wrangler.jsonc`)
   - Build command : *(vide)*
   - Deploy command : `npx wrangler deploy` (valeur proposée, ne pas changer)
   - Root directory / chemin : `/` (valeur proposée)
   - Enable Preview builds : peut rester activé (déploie aussi les autres branches sur une adresse de test)
3. **Deploy**. Le site est en ligne sur `https://cafe-contemplation.<ton-compte>.workers.dev`.

### 3. Secrets de l'admin

Dans le Worker → **Settings** → **Variables and Secrets** → **Add**, type **Secret** :

| Nom | Valeur |
|---|---|
| `ADMIN_PASSWORD` | le mot de passe donné au café (12 caractères minimum) |
| `SESSION_SECRET` | une longue chaîne aléatoire, jamais communiquée (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`) |
| `GITHUB_TOKEN` | le jeton de l'étape 1 |

Les secrets sont pris en compte tout de suite (**Deploy** si Cloudflare le propose). Les déploiements suivants
ne les effacent pas.

Facultatif mais conseillé : blocage durable après 5 mots de passe faux. Storage & Databases → **KV** → Create
namespace `admin-essais`, copier son **ID**, puis dans `wrangler.jsonc` décommenter la ligne `kv_namespaces` et y
coller l'ID (ce n'est pas un secret), commit et push. Sans KV, un blocage plus léger s'applique quand même.

### 4. Tester

Ouvrir `https://cafe-contemplation.<ton-compte>.workers.dev/admin`, se connecter, changer un prix, enregistrer.
Vérifier :
- le commit « Admin du café : carte » apparaît sur GitHub ;
- une minute plus tard, le prix a changé sur le site.

Remettre le prix d'origine depuis l'admin.

### 5. Nom de domaine (à la mise en ligne définitive)

Le domaine `cafecontemplation.ch` reste chez Infomaniak (compte du café), avec son e-mail.

1. Worker → **Settings** → **Domains & Routes** → **Add** → **Custom domain**. Pour un domaine géré ailleurs
   que chez Cloudflare, Cloudflare demande en général d'ajouter le domaine au compte (changement des serveurs DNS
   chez Infomaniak) : **avant de le faire, recopier tous les enregistrements DNS existants, en particulier les MX
   (e-mail)**, et vérifier qu'ils sont repris chez Cloudflare. Sinon l'e-mail du café s'arrête.
2. Rediriger `cafecontemplation.ch` (sans www) vers `https://www.cafecontemplation.ch`.
3. Dans le site : adresse dans le commentaire « ADRESSE DU SITE » de `index.html`, puis retrait du `noindex`
   (voir LISEZ-MOI). La page 404 s'adapte toute seule à l'adresse.

## Tester en local (sans rien publier)

```bash
npx wrangler dev --port 8787
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
