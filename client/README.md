# FRVArt Client

Client React de la vitrine FRVArt (version 1.1.0). Cette application Vite assure la navigation type TikTok au sein du flux artistique, avec visionneuse plein ecran, gestion multi-images et integration Bluesky.

## Installation rapide
```bash
npm install
```

## Scripts principaux
- `npm run dev` : demarre Vite en mode developpement avec HMR.
- `npm run build` : compile TypeScript et genere le bundle de production.
- `npm run preview` : sert le build de production pour verification.
- `npm run lint` : execute ESLint sur l'ensemble du projet.

## Configuration
- `metadata-version.json` fixe la version exposee dans l'UI (actuellement 1.1.0).
- `CHANGELOG.md` detaille les evolutions pour le dialogue in-app.
- Les variables sensibles (identifiants Bluesky) sont gerees via app password saisi par l'utilisateur final.

## Ressources
- Documentation generale : [../README.md](../README.md)
- Historique des changements : [CHANGELOG.md](CHANGELOG.md)
- Guide de contribution : [../CONTRIBUTING.md](../CONTRIBUTING.md)
