import React from 'react';
import FooterLeft from './FooterLeft';
import FooterRight from './FooterRight';
import './ArtCard.css';
import { buildPostLink } from '../utils/post';

const ArtCard = ({
  post,
  active,
  setCardRef,
  onLike,
  onPin,
  onLoginRequest,
  pinned,
  onComment,
  onShare,
  onFollow,
  viewerDid,
}) => {
  const primaryImage = post.images?.[0];
  const backgroundImage =
    primaryImage?.fullsize ||
    primaryImage?.thumb ||
    post.author?.avatar ||
    '';
  const hasImage = Boolean(backgroundImage);
  const ambientStyle = {
    '--ambient-img': hasImage ? `url("${backgroundImage}")` : 'none',
  };
  const videoClassName = [
    'video',
    active ? 'active' : '',
    hasImage ? 'has-image' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={videoClassName}
      ref={(node) => setCardRef?.(node)}
      style={ambientStyle}
    >
      <div className="media-wrapper">
        {backgroundImage ? (
          <img
            className="videoImg"
            src={backgroundImage}
            alt={primaryImage?.alt || post.text || post.author?.displayName}
          />
        ) : (
          <div className="video-placeholder">
            <span>Post sans image</span>
          </div>
        )}
        {post.images?.length > 1 ? (
          <div className="multi-indicator">{post.images.length} visuels</div>
        ) : null}
      </div>

      <div className="bottom-controls">
        <div className="footer-left">
          <FooterLeft
            author={post.author}
            text={post.text}
            indexedAt={post.indexedAt}
          />
        </div>
        <div className="footer-right">
          <FooterRight
            author={post.author}
            likeCount={post.likeCount}
            replyCount={post.replyCount}
            repostCount={post.repostCount}
            liked={Boolean(post.viewer?.like)}
            pinned={pinned}
            onLike={onLike}
            onComment={onComment}
            onShare={onShare}
            onPin={onPin}
            onLoginRequest={onLoginRequest}
            postLink={buildPostLink(post)}
            onFollow={onFollow ? () => onFollow(post.author) : null}
            viewerDid={viewerDid}
          />
        </div>
      </div>
    </div>
  );
};

export default ArtCard;
