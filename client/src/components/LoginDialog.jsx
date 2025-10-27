import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';
import './LoginDialog.css';

function LoginDialog({ open, onClose, onSubmit, loading, error }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [dontRemember, setDontRemember] = useState(false);

  useEffect(() => {
    if (!open) {
      setIdentifier('');
      setPassword('');
      setDontRemember(false);
    }
  }, [open]);

  if (!open) {
    return null;
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmedIdentifier = identifier.trim();
    const normalizedIdentifier = trimmedIdentifier.replace(/^@+/, '');
    const trimmedPassword = password.trim();

    if (normalizedIdentifier && trimmedPassword) {
      onSubmit({
        identifier: normalizedIdentifier,
        password: trimmedPassword,
        remember: !dontRemember,
      });
    }
  };

  return (
    <div className="login-dialog-backdrop" onClick={onClose}>
      <div
        className="login-dialog"
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        <header>
          <h2>Connexion Bluesky</h2>
          <button type="button" onClick={onClose} aria-label="Fermer la fenêtre">
            ×
          </button>
        </header>
        <p className="login-hint">
          Utilise ton identifiant Bluesky et un app password (paramètres &gt; App
          passwords). Tes informations restent sur ton appareil.
        </p>
        <form onSubmit={handleSubmit}>
          <label htmlFor="login-identifier">Identifiant ou handle</label>
          <input
            id="login-identifier"
            type="text"
            placeholder="@tonhandle.bsky.social"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            autoComplete="username"
            required
          />
          <label htmlFor="login-password">App password</label>
          <div className="login-input-with-action">
            <input
              id="login-password"
              type="password"
              placeholder="xxxx-xxxx-xxxx-xxxx"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
            <a
              className="login-input-action"
              href="https://bsky.app/settings/app-passwords"
              target="_blank"
              rel="noreferrer"
              aria-label="Ouvrir la page des app passwords sur Bluesky"
            >
              <FontAwesomeIcon icon={faUpRightFromSquare} />
            </a>
          </div>
          {error ? <p className="login-error">{error}</p> : null}
          <label className="login-checkbox" htmlFor="login-no-remember">
            <input
              id="login-no-remember"
              type="checkbox"
              checked={dontRemember}
              onChange={(event) => setDontRemember(event.target.checked)}
            />
            <span>Ne pas se souvenir de moi</span>
          </label>
          {dontRemember ? (
            <p className="login-warning">
              N&apos;oubliez pas de bien noter votre app password pour ne pas le perdre.
            </p>
          ) : null}
          <button className="login-submit" type="submit" disabled={loading}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginDialog;

