# Guide de contribution

Merci de votre interet pour FRVArt. Ce document explique comment proposer des ameliorations tout en preservant la stabilite de l'application.

## Code de conduite
- Restez respectueux et inclusif.
- Favorisez les discussions techniques constructives.
- Respectez les creations artistiques partagees par la communaute.

## Avant de commencer
1. Forkez le depot puis creez une branche de travail descriptive (`feature/option-remember-me`, `fix/commentaires`...).
2. Assurez-vous de disposer de Node.js 18+ et npm 9+.
3. Installez les dependances depuis le dossier `client/` avec `npm install`.

## Flux de travail recommande
1. `npm run dev` pour lancer l'environnement de developpement.
2. Realisez vos modifications en respectant les conventions ci-dessous.
3. Ajoutez ou mettez a jour les tests si necessaire (unitaires ou manuels documentes).
4. Executez `npm run lint` et corrigez les avertissements.
5. Lancez `npm run build` pour verifier qu'aucune regression n'apparait.
6. Soumettez une Pull Request vers la branche principale avec un resume clair des changements.

## Normes de code
- Utilisez les hooks React et la logique existante (services Bluesky, contextes).
- Evitez d'introduire des dependances lourdes sans discussion prealable.
- Conservez les fichiers en ASCII par defaut. Si vous devez utiliser des caracteres non ASCII, assurez-vous que le fichier l'utilise deja et justifiez-le dans la PR.
- Ajoutez des commentaires seulement lorsque le code n'est pas explicite.
- Pour les styles, privilegiez les classes CSS dediees dans `client/src/components/*.css`.

## Interface utilisateur
- Pensez responsif: testez au minimum sur mobile et desktop.
- Respectez la palette actuelle (nuances violet/bleu) et l'ambiance sombre.
- Si vous modifiez un element partage, verifiez l'impact visuel dans tout le produit.

## Changelog
- Mettez a jour `client/CHANGELOG.md` pour toute fonctionnalite ou correction notable.
- Respectez le format existant: `## [version] - Mois Annee` puis liste a puces.

## Commit et Pull Request
- Commits concis et atomiques (`feat:`, `fix:`, `docs:` ...).
- Decrivez les tests effectues dans la Pull Request.
- Referencez les issues / tickets lorsque c'est pertinent.

## Support
- Bluesky: https://bsky.app/profile/frvtubers.bsky.social
- Discord FRVtubers: https://discord.gg/FRVtubers

Merci d'aider a faire grandir FRVArt !
