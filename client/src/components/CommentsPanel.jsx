import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';
import './CommentsPanel.css';

const formatDate = (timestamp) => {
  if (!timestamp) {
    return '';
  }
  try {
    return new Date(timestamp).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (_err) {
    return '';
  }
};

function CommentsPanel({
  open,
  onClose,
  post,
  comments,
  loading,
  error,
  onRetry,
  onOpenPost,
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="comments-backdrop" onClick={onClose}>
      <aside
        className="comments-panel"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="comments-header">
          <div className="comments-title">
            <span>Commentaires</span>
            {post?.replyCount ? (
              <span className="comments-count">{post.replyCount}</span>
            ) : null}
          </div>
          <button
            type="button"
            className="comments-close"
            onClick={onClose}
            aria-label="Fermer"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </header>
        {post ? (
          <div className="comments-root">
            <div className="comments-root-author">
              {post.author?.avatar ? (
                <img src={post.author.avatar} alt={post.author.displayName} />
              ) : null}
              <div className="comments-root-author-name">
                <strong>{post.author?.displayName || post.author?.handle}</strong>
                <span>
                  {post.author?.handle ? `@${post.author.handle}` : ''}
                </span>
              </div>
              <span className="comments-root-date">{formatDate(post.indexedAt)}</span>
            </div>
            {post.text ? <p className="comments-root-text">{post.text}</p> : null}
            {onOpenPost ? (
              <button
                type="button"
                className="comments-open-post"
                onClick={() => onOpenPost(post)}
              >
                <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
                <span>Ouvrir sur Bluesky</span>
              </button>
            ) : null}
          </div>
        ) : null}
        <section className="comments-body">
          {loading ? (
            <div className="comments-message">Chargement des commentaires...</div>
          ) : null}
          {!loading && error ? (
            <div className="comments-message">
              <p>{error}</p>
              {onRetry ? (
                <button type="button" onClick={onRetry}>
                  Réessayer
                </button>
              ) : null}
            </div>
          ) : null}
          {!loading && !error && comments.length === 0 ? (
            <div className="comments-message">
              Aucun commentaire pour l'instant.
            </div>
          ) : null}
          {!loading && !error ? (
            <ul className="comments-list">
              {comments.map((comment) => (
                <li key={comment.uri} className="comments-item">
                  <div className="comments-author">
                    {comment.author?.avatar ? (
                      <img
                        src={comment.author.avatar}
                        alt={comment.author.displayName}
                      />
                    ) : null}
                    <div>
                      <span className="comments-author-name">
                        {comment.author?.displayName || comment.author?.handle}
                      </span>
                      <span className="comments-author-handle">
                        {comment.author?.handle ? `@${comment.author.handle}` : ''}
                      </span>
                    </div>
                    <span className="comments-date">{formatDate(comment.indexedAt)}</span>
                  </div>
                  {comment.text ? (
                    <p className="comments-text">{comment.text}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      </aside>
    </div>
  );
}

export default CommentsPanel;
