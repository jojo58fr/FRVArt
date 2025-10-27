import React, { useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import './FullscreenViewer.css';

function FullscreenViewer({ open, post, mediaIndex = 0, onClose }) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open || !post) {
    return null;
  }

  const images = Array.isArray(post.images) ? post.images.filter(Boolean) : [];
  const safeIndex = Number.isFinite(mediaIndex) ? mediaIndex : 0;
  const maxIndex = images.length > 0 ? images.length - 1 : 0;
  const normalizedIndex = Math.min(Math.max(0, safeIndex), maxIndex);
  const selectedImage = images[normalizedIndex] || null;
  const mediaSource =
    selectedImage?.fullsize ||
    selectedImage?.thumb ||
    post.author?.avatar ||
    '';
  const mediaAlt =
    selectedImage?.alt ||
    post.text ||
    post.author?.displayName ||
    post.author?.handle ||
    'Illustration Bluesky';
  const authorDisplay =
    post.author?.displayName ||
    (post.author?.handle ? `@${post.author.handle}` : 'Artiste');

  const handleBackdropClick = () => {
    onClose?.();
  };

  const handleContentClick = (event) => {
    event.stopPropagation();
  };

  const handleCloseClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    onClose?.();
  };

  return (
    <div
      className="fullscreen-viewer-backdrop"
      role="dialog"
      aria-modal="true"
      onClick={handleBackdropClick}
    >
      <div className="fullscreen-viewer" onClick={handleContentClick}>
        <button
          type="button"
          className="fullscreen-viewer__close"
          onClick={handleCloseClick}
          aria-label="Fermer la visionneuse"
          data-prevent-desktop-swipe="true"
        >
          <FontAwesomeIcon icon={faXmark} />
        </button>
        <div className="fullscreen-viewer__media">
          {mediaSource ? (
            <img src={mediaSource} alt={mediaAlt} />
          ) : (
            <div className="fullscreen-viewer__placeholder">
              Aucun media disponible
            </div>
          )}
        </div>
        {post.text ? (
          <div className="fullscreen-viewer__caption">
            <span className="fullscreen-viewer__author">{authorDisplay}</span>
            <p className="fullscreen-viewer__text">{post.text}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default FullscreenViewer;
