import React from 'react';
import './FooterLeft.css';

export default function FooterLeft({
  author,
  text,
  indexedAt,
  mediaCount = 0,
  mediaIndex = 0,
  onSelectMedia,
}) {
  const displayName = author?.displayName || author?.handle || 'Artiste';
  const handle = author?.handle ? `@${author.handle}` : '';

  const formattedDate = indexedAt
    ? new Date(indexedAt).toLocaleString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: 'short',
      })
    : '';

  const showIndicators = mediaCount > 1;

  const handleIndicatorClick = (index) => {
    if (typeof onSelectMedia === 'function') {
      onSelectMedia(index);
    }
  };

  return (
    <div className="footer-left">
      <div className="author">
        {/* {avatar ? <img src={avatar} alt={displayName} /> : null} */}
        <div>
          <span className="display-name">{displayName}</span>
          {handle ? <span className="handle">{handle}</span> : null}
        </div>
      </div>
      {text ? <p className="post-text">{text}</p> : null}
      {formattedDate || showIndicators ? (
        <div className="post-date-wrapper">
          {formattedDate ? <span className="post-date">{formattedDate}</span> : null}
          {showIndicators ? (
            <div className="post-indicators" role="tablist" aria-label="Selection du visuel">
              {Array.from({ length: mediaCount }).map((_, index) => (
                <button
                  key={`media-dot-${index}`}
                  type="button"
                  className={`post-indicator${index === mediaIndex ? ' active' : ''}`}
                  aria-label={`Afficher l'image ${index + 1} sur ${mediaCount}`}
                  aria-pressed={index === mediaIndex}
                  onClick={() => handleIndicatorClick(index)}
                />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
