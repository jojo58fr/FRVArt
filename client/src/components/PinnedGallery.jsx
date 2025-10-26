import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faThumbTack,
  faHeart,
  faXmark,
  faArrowUpRightFromSquare,
} from '@fortawesome/free-solid-svg-icons';
import './PinnedGallery.css';

function PinnedGallery({
  open,
  onClose,
  pins,
  onUnpin,
  onLike,
  onOpenPost,
  isAuthenticated,
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="pinned-gallery-backdrop" onClick={onClose}>
      <section
        className="pinned-gallery"
        onClick={(event) => event.stopPropagation()}
      >
        <header>
          <h2>
            <FontAwesomeIcon icon={faThumbTack} />
            <span>Mes épinglées</span>
          </h2>
          <button
            type="button"
            className="pinned-close"
            onClick={onClose}
            aria-label="Fermer"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </header>
        <div className="pinned-info">
          ⚠️ Version 1.0.0 - tes épingles sont stockées localement sur cet appareil.
          Elles peuvent disparaître si tu effaces le cache ou changes de
          navigateur.
        </div>
        {pins.length === 0 ? (
          <p className="pinned-empty">
            Tu n&apos;as pas encore épinglé d&apos;oeuvre. Utilise l&apos;icône
            épingle sur un post pour le garder ici.
          </p>
        ) : (
          <div className="pinned-grid">
            {pins.map((post) => {
              const cover = post.images?.[0]?.thumb || '';
              return (
                <article key={post.uri} className="pinned-card">
                  <img src={cover} alt={post.images?.[0]?.alt || post.text} />
                  <div className="pinned-meta">
                    <div className="pinned-author">
                      <span className="pinned-handle">
                        @{post.author?.handle || 'artiste'}
                      </span>
                      <button
                        type="button"
                        className="pinned-unpin"
                        onClick={() => onUnpin(post.uri)}
                      >
                        Retirer
                      </button>
                    </div>
                    <p className="pinned-text">{post.text}</p>
                    <div className="pinned-actions">
                      {onOpenPost ? (
                        <button
                          type="button"
                          className="pinned-open-post"
                          onClick={() => onOpenPost(post)}
                        >
                          <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
                          <span>Voir sur Bluesky</span>
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className={`pinned-like ${
                          post.viewer?.like ? 'active' : ''
                        }`}
                        onClick={() => onLike(post)}
                      >
                        <FontAwesomeIcon icon={faHeart} />
                        <span>{post.likeCount ?? 0}</span>
                      </button>
                      {!isAuthenticated && !post.viewer?.like ? (
                        <span className="pinned-login-hint">
                          Connecte-toi pour liker
                        </span>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default PinnedGallery;
