# Site du Café Contemplation : règles pour Claude

Deux personnes travaillent sur ce site, chacune avec son propre Claude, dans ce même dépôt GitHub
(`rombmann/cafe-contemplation`). Le site en ligne : https://rombmann.github.io/cafe-contemplation/
(GitHub Pages publie automatiquement la branche `main`, environ une minute après chaque `git push`, et le Worker
Cloudflare qui porte l'admin aussi, voir `ADMIN.md`).

## Avant de commencer quoi que ce soit

1. `git status` : s'il reste des modifications non enregistrées, les montrer à l'utilisateur avant d'aller plus loin.
2. `git pull --rebase` : récupérer le travail de l'autre personne. **Toujours**, au début de chaque séance
   et avant chaque nouvelle modification.

## Pendant le travail

- Faire de petites modifications, une chose à la fois.
- Après chaque modification terminée et vérifiée : `git add` des fichiers concernés, `git commit` avec un message
  clair en français (ce qui a changé et pourquoi), puis `git pull --rebase` et `git push`.
- Ne jamais garder du travail non poussé longtemps : c'est ce qui crée les conflits.
- Pousser publie le site public. Demander l'accord de l'utilisateur avant chaque `git push`.

## En cas de conflit (`git pull --rebase` qui s'arrête)

- Ne jamais écraser le travail de l'autre : pas de `git push --force`, pas de `git reset --hard`,
  pas de suppression de ses modifications.
- Ouvrir les fichiers en conflit, garder les deux modifications quand c'est possible, expliquer à l'utilisateur
  ce qui se chevauchait et lui demander quand il faut choisir. Puis `git add`, `git rebase --continue`, vérifier, pousser.

## Organisation du projet

- Tout le site est dans `index.html` (HTML, CSS et scripts). Contact, liens et notes sont dans l'objet `SITE_DATA` :
  chercher « MODIFIER LES DONNÉES DU SITE ICI ».
- Horaires, fermetures, note Google, carte et douceurs sont dans `donnees.js` (JSON après `window.DONNEES =`).
  **Le café modifie ce fichier lui-même depuis l'admin** (`/admin`, voir `ADMIN.md`) : chaque enregistrement
  est un commit « Admin du café : … » sur `main`. D'où l'importance du `git pull --rebase` avant de travailler.
  Si on modifie `donnees.js` à la main, garder un JSON valide (guillemets doubles, pas de virgule finale)
  et respecter les règles de `worker/donnees.js` (sinon l'admin refusera d'enregistrer).
- `admin/` (page d'administration) et `worker/` (Worker Cloudflare : vérification du mot de passe et enregistrement,
  configuré par `wrangler.jsonc`) : ne jamais y mettre de secret. Les secrets sont dans les réglages Cloudflare et,
  pour les tests locaux, dans `.dev.vars` (ignoré par git). `.assetsignore` liste les fichiers jamais publiés
  (à compléter si on ajoute des fichiers internes à la racine).
- Version anglaise : champs `_en` dans `SITE_DATA`, et bloc « TEXTES EN ANGLAIS » pour les textes fixes
  (clés `data-i18n` dans le HTML). Toute modification d'un texte français doit aussi mettre à jour l'anglais.
- `visuels/`, `video/` : images et vidéos optimisées pour le web. `fonts/` et `vendor/three/` : polices et Three.js
  hébergés sur le site (ne pas remettre de liens vers Google Fonts ou un CDN : le site ne contacte aucun service
  extérieur à l'ouverture).
- Vérifier chaque changement dans un navigateur, en local : `npx http-server . -p 8123` depuis ce dossier,
  puis http://localhost:8123 (format ordinateur et téléphone).
- La ligne `<meta name="robots" content="noindex">` est voulue tant que le site est une maquette : ne pas la retirer
  sans accord.
- Ne pas inventer d'informations sur le café (prix, horaires, textes) : demander à l'utilisateur.
