import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';
import './ChangelogDialog.css';

function ChangelogDialog({ open, onClose, version, entries = [] }) {
  if (!open) {
    return null;
  }

  return (
    <div className="changelog-backdrop" onClick={onClose} role="presentation">
      <section
        className="changelog-panel"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Changelog FRVArt"
      >
        <header className="changelog-header">
          <div>
            <h2>
              <FontAwesomeIcon icon={faWandMagicSparkles} />
              <span>Changelog FRVArt</span>
            </h2>
            <p className="changelog-version">Version actuelle&nbsp;: v{version}</p>
          </div>
          <button
            type="button"
            className="changelog-close"
            onClick={onClose}
            aria-label="Fermer le changelog"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </header>
        <div className="changelog-content">
          {entries.map((entry) => (
            <article key={entry.version} className="changelog-entry">
              <div className="changelog-entry-meta">
                <span className="changelog-entry-version">v{entry.version}</span>
                <span className="changelog-entry-date">{entry.date}</span>
              </div>
              <ul>
                {entry.changes.map((change, index) => (
                  <li key={`${entry.version}-${index}`}>{change}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default ChangelogDialog;
