import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPalette,
  faStar,
  faBookmark,
  faRightToBracket,
  faListCheck,
} from '@fortawesome/free-solid-svg-icons';
import './GuestLanding.css';

const SAMPLE_ART = [
  {
    id: 'aurora',
    title: 'Aurora Echoes',
    artist: '@MizuHoshi',
    description: 'Fanart lumineux conçu pour la vitrine FRVArt.',
    accent: 'var(--guest-accent-purple)',
    background:
      'linear-gradient(135deg, rgba(123, 103, 255, 0.85), rgba(33, 29, 65, 0.9))',
  },
  {
    id: 'cascade',
    title: 'Cascade Chromatique',
    artist: '@Lumenia',
    description: 'Exemple d’illustration en mouvement pour la lecture verticale.',
    accent: 'var(--guest-accent-cyan)',
    background:
      'linear-gradient(140deg, rgba(48, 214, 197, 0.82), rgba(14, 58, 66, 0.92))',
  },
  {
    id: 'nocturne',
    title: 'Nocturne Synthwave',
    artist: '@OrionWave',
    description: 'Stylisation rétro-futuriste pour inspirer les créateurs.',
    accent: 'var(--guest-accent-amber)',
    background:
      'linear-gradient(150deg, rgba(255, 143, 72, 0.83), rgba(105, 22, 55, 0.9))',
  },
];

function GuestLanding({ version, onLoginRequest, onOpenChangelog }) {
  return (
    <section className="guest-landing">
      <div className="guest-intro">
        <h2 className="guest-title">
          <FontAwesomeIcon icon={faPalette} />
          <span>Bienvenue sur FRVArt</span>
        </h2>
        <p className="guest-description">
          Connecte-toi avec Bluesky pour accéder au flux d’œuvres de la communauté
          francophone. En attendant, explore les exemples ci-dessous pour voir
          comment l’expérience est pensée.
        </p>
        <div className="guest-actions">
          <button type="button" className="guest-btn primary" onClick={onLoginRequest}>
            <FontAwesomeIcon icon={faRightToBracket} />
            <span>Se connecter via Bluesky</span>
          </button>
          <button type="button" className="guest-btn ghost" onClick={onOpenChangelog}>
            <FontAwesomeIcon icon={faListCheck} />
            <span>Changelog &amp; version</span>
          </button>
          <span className="guest-version">Version actuelle&nbsp;: v{version}</span>
        </div>
      </div>
      <div className="guest-samples">
        {SAMPLE_ART.map((art) => (
          <article
            key={art.id}
            className="guest-art-card"
            style={{ backgroundImage: art.background }}
          >
            <div className="guest-art-badge" style={{ color: art.accent }}>
              <FontAwesomeIcon icon={faStar} />
              <span>Exemple</span>
            </div>
            <h3>{art.title}</h3>
            <p className="guest-art-artist">{art.artist}</p>
            <p className="guest-art-description">{art.description}</p>
          </article>
        ))}
      </div>
      <div className="guest-how">
        <h3>
          <FontAwesomeIcon icon={faBookmark} />
          <span>Comment ça marche ?</span>
        </h3>
        <ul>
          <li>
            Repère les meilleures œuvres taguées <strong>#FRVArt</strong> ou <strong>#VtuberFR</strong>
            sur Bluesky.
          </li>
          <li>
            Ajoute-les à tes épingles personnelles pour les retrouver rapidement.
          </li>
          <li>
            Ouvre les commentaires ou partage les posts originaux en un clic.
          </li>
        </ul>
      </div>
    </section>
  );
}

export default GuestLanding;
