import React from 'react';
import './FooterLeft.css';

export default function FooterLeft({ author, text, indexedAt }) {
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
      {formattedDate ? <span className="post-date">{formattedDate}</span> : null}
    </div>
  );
}
