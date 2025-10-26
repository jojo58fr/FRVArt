import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHeart,
  faCommentDots,
  faShareNodes,
  faThumbTack,
  faArrowUpRightFromSquare,
  faUserPlus,
  faCircleCheck,
} from '@fortawesome/free-solid-svg-icons';
import './FooterRight.css';

const formatCount = (count = 0) => {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
};

function FooterRight({
  author,
  likeCount = 0,
  replyCount = 0,
  repostCount = 0,
  liked = false,
  pinned = false,
  onLike,
  onComment,
  onShare,
  onPin,
  onLoginRequest,
  postLink,
  onFollow,
  viewerDid,
}) {
  const avatar = author?.avatar || '';
  const isFollowing = Boolean(author?.viewer?.following);
  const isOwnProfile = Boolean(viewerDid && author?.did && viewerDid === author.did);
  const showFollow = Boolean(onFollow) && !isOwnProfile;

  return (
    <div className="footer-right">
      <div className="sidebar-icon avatar">
        {avatar ? (
          <img src={avatar} className="userprofile" alt={author?.handle} />
        ) : null}
      </div>
      {showFollow ? (
        <button
          type="button"
          className={`sidebar-icon follow ${isFollowing ? 'active' : ''}`}
          onClick={onFollow}
          aria-pressed={isFollowing}
          aria-label={isFollowing ? 'Ne plus suivre cet artiste' : 'Suivre cet artiste'}
          title={isFollowing ? 'Ne plus suivre' : 'Suivre'}
        >
          <FontAwesomeIcon icon={isFollowing ? faCircleCheck : faUserPlus} />
          <span>{isFollowing ? 'Suivi' : 'Suivre'}</span>
        </button>
      ) : null}
      <button
        type="button"
        className={`sidebar-icon like ${liked ? 'active' : ''}`}
        onClick={onLike || onLoginRequest}
        aria-label="J'aime"
      >
        <FontAwesomeIcon icon={faHeart} />
        <span>{formatCount(likeCount)}</span>
      </button>
      <button
        type="button"
        className="sidebar-icon"
        onClick={onComment}
        aria-label="Afficher les commentaires"
      >
        <FontAwesomeIcon icon={faCommentDots} />
        <span>{formatCount(replyCount)}</span>
      </button>
      <button
        type="button"
        className="sidebar-icon"
        onClick={onShare}
        aria-label="Partager"
      >
        <FontAwesomeIcon icon={faShareNodes} />
        <span>{formatCount(repostCount)}</span>
      </button>
      <button
        type="button"
        className={`sidebar-icon pin ${pinned ? 'active' : ''}`}
        onClick={onPin}
        aria-label="Epingler cette oeuvre"
      >
        <FontAwesomeIcon icon={faThumbTack} />
      </button>
      <a
        href={postLink}
        className="sidebar-icon external"
        target="_blank"
        rel="noreferrer"
        aria-label="Ouvrir sur Bluesky"
      >
        <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
      </a>
    </div>
  );
}

export default FooterRight;
