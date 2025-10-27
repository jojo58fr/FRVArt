import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import FooterLeft from './FooterLeft';
import FooterRight from './FooterRight';
import './ArtCard.css';
import { buildPostLink } from '../utils/post';

const SWIPE_THRESHOLD = 60;

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
  fitMode = 'cover',
  mediaIndex = 0,
  onMediaChange,
  isFullscreen = false,
  onCloseFullscreen,
}) => {
  const images = useMemo(
    () => (Array.isArray(post.images) ? post.images.filter(Boolean) : []),
    [post.images],
  );
  const safeMediaIndex = Number.isFinite(mediaIndex) ? mediaIndex : 0;
  const [activeImageIndex, setActiveImageIndex] = useState(safeMediaIndex);
  const primaryImage = images[0] || null;
  const currentImage = images[activeImageIndex] || primaryImage || null;
  const backgroundImage =
    currentImage?.fullsize ||
    currentImage?.thumb ||
    post.author?.avatar ||
    '';
  const hasImage = Boolean(backgroundImage);
  const imageCount = images.length;
  const imageRef = useRef(null);
  const [imageTone, setImageTone] = useState('dark');
  const [fullscreenZoom, setFullscreenZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const fullscreenContainerRef = useRef(null);
  const fullscreenImageRef = useRef(null);
  const swipeStateRef = useRef({
    pointerId: null,
    startX: 0,
    startY: 0,
    deltaX: 0,
    isSwiping: false,
  });
  const touchSwipeRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    isSwiping: false,
    hasSwiped: false,
  });
  const pointerStateRef = useRef({
    pointers: new Map(),
    panStart: null,
    pinch: null,
  });
  const lastNotifiedIndexRef = useRef(safeMediaIndex);

  useEffect(() => {
    const maxIndex = imageCount > 0 ? imageCount - 1 : 0;
    const nextIndex = Math.min(Math.max(0, safeMediaIndex), maxIndex);
    setActiveImageIndex((prev) => (prev === nextIndex ? prev : nextIndex));
    lastNotifiedIndexRef.current = nextIndex;
  }, [safeMediaIndex, imageCount, post?.uri]);

  const emitMediaChange = useCallback(
    (nextIndex) => {
      if (lastNotifiedIndexRef.current === nextIndex) {
        return;
      }
      lastNotifiedIndexRef.current = nextIndex;
      if (typeof onMediaChange === 'function') {
        onMediaChange(nextIndex);
      }
    },
    [onMediaChange],
  );

  const setActiveIndexAndNotify = useCallback(
    (updater) => {
      if (imageCount <= 1) {
        return;
      }
      setActiveImageIndex((prev) => {
        const resolved =
          typeof updater === 'function' ? updater(prev) : updater;
        if (!Number.isFinite(resolved)) {
          return prev;
        }
        const maxIndex = imageCount - 1;
        const clamped = Math.min(Math.max(0, resolved), maxIndex);
        if (clamped === prev) {
          return prev;
        }
        emitMediaChange(clamped);
        return clamped;
      });
    },
    [emitMediaChange, imageCount],
  );

  const showNextImage = useCallback(() => {
    setActiveIndexAndNotify((prev) => prev + 1);
  }, [setActiveIndexAndNotify]);

  const showPreviousImage = useCallback(() => {
    setActiveIndexAndNotify((prev) => prev - 1);
  }, [setActiveIndexAndNotify]);

  const handleIndicatorSelect = useCallback(
    (index) => {
      setActiveIndexAndNotify(index);
    },
    [setActiveIndexAndNotify],
  );

  const resetTouchSwipe = useCallback(() => {
    touchSwipeRef.current = {
      active: false,
      startX: 0,
      startY: 0,
      isSwiping: false,
      hasSwiped: false,
    };
  }, []);

  const resetSwipeState = useCallback(() => {
    swipeStateRef.current = {
      pointerId: null,
      startX: 0,
      startY: 0,
      deltaX: 0,
      isSwiping: false,
    };
  }, []);

  const handlePointerDownMedia = useCallback(
    (event) => {
      if (imageCount <= 1) {
        return;
      }
      swipeStateRef.current.pointerId = event.pointerId;
      swipeStateRef.current.startX = event.clientX;
      swipeStateRef.current.startY = event.clientY;
      swipeStateRef.current.deltaX = 0;
      swipeStateRef.current.isSwiping = false;
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch (_) {
        // ignore capture errors
      }
    },
    [imageCount],
  );

  const handlePointerMoveMedia = useCallback(
    (event) => {
      if (imageCount <= 1) {
        return;
      }
      const state = swipeStateRef.current;
      if (state.pointerId !== event.pointerId) {
        return;
      }
      const deltaX = event.clientX - state.startX;
      const deltaY = event.clientY - state.startY;
      if (!state.isSwiping) {
        if (Math.abs(deltaX) > 22 && Math.abs(deltaX) > Math.abs(deltaY)) {
          state.isSwiping = true;
        }
      }
      if (state.isSwiping) {
        event.preventDefault();
        state.deltaX = deltaX;
      }
    },
    [imageCount],
  );

  const handlePointerEndMedia = useCallback(
    (event) => {
      if (imageCount <= 1) {
        resetSwipeState();
        return;
      }
      const state = swipeStateRef.current;
      if (state.pointerId !== event.pointerId) {
        return;
      }
      if (state.isSwiping) {
        if (state.deltaX <= -SWIPE_THRESHOLD) {
          showNextImage();
        } else if (state.deltaX >= SWIPE_THRESHOLD) {
          showPreviousImage();
        }
      }
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch (_) {
        // ignore release errors
      }
      resetSwipeState();
    },
    [imageCount, resetSwipeState, showNextImage, showPreviousImage],
  );

  const handlePointerCancelMedia = useCallback(
    (event) => {
      const state = swipeStateRef.current;
      if (state.pointerId === event.pointerId) {
        try {
          event.currentTarget.releasePointerCapture(event.pointerId);
        } catch (_) {
          // ignore release errors
        }
        resetSwipeState();
      }
    },
    [resetSwipeState],
  );

  const handleMediaKeyDown = useCallback(
    (event) => {
      if (imageCount <= 1) {
        return;
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        showNextImage();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        showPreviousImage();
      }
    },
    [imageCount, showNextImage, showPreviousImage],
  );

  const handleTouchStartMedia = useCallback(
    (event) => {
      console.error("ÄLLO LES GENS");

      if (imageCount <= 1) {
        return;
      }
      if (event.touches.length !== 1) {
        resetTouchSwipe();
        return;
      }
      const touch = event.touches[0];
      touchSwipeRef.current = {
        active: true,
        startX: touch.clientX,
        startY: touch.clientY,
        isSwiping: false,
        hasSwiped: false,
      };
    },
    [imageCount, resetTouchSwipe],
  );

  const handleTouchMoveMedia = useCallback(
    (event) => {
      const state = touchSwipeRef.current;
      if (!state.active || imageCount <= 1) {
        return;
      }
      if (event.touches.length !== 1) {
        resetTouchSwipe();
        return;
      }
      const touch = event.touches[0];
      const deltaX = touch.clientX - state.startX;
      const deltaY = touch.clientY - state.startY;

      if (!state.isSwiping) {
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 16) {
          state.isSwiping = true;
        } else if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 24) {
          resetTouchSwipe();
          return;
        }
      }

      if (!state.isSwiping || state.hasSwiped) {
        return;
      }

      if (Math.abs(deltaX) >= SWIPE_THRESHOLD) {
        event.preventDefault();
        if (deltaX < 0) {
          showNextImage();
        } else {
          showPreviousImage();
        }
        state.hasSwiped = true;
      }
    },
    [imageCount, resetTouchSwipe, showNextImage, showPreviousImage],
  );

  const handleTouchEndMedia = useCallback(() => {
    resetTouchSwipe();
  }, [resetTouchSwipe]);

  const handleTouchCancelMedia = useCallback(() => {
    resetTouchSwipe();
  }, [resetTouchSwipe]);

  useEffect(() => {
    setImageTone('dark');
  }, [backgroundImage]);

  const evaluateImageTone = useCallback((img) => {
    if (!img || !img.complete || !img.naturalWidth || !img.naturalHeight) {
      return;
    }

    try {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) {
        return;
      }

      const sampleSize = 24;
      canvas.width = sampleSize;
      canvas.height = sampleSize;
      context.drawImage(img, 0, 0, sampleSize, sampleSize);
      const { data } = context.getImageData(0, 0, sampleSize, sampleSize);
      let totalLuminance = 0;
      const pixelCount = data.length / 4;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        totalLuminance += luminance;
      }

      const averageLuminance = totalLuminance / pixelCount / 255;
      setImageTone(averageLuminance >= 0.6 ? 'light' : 'dark');
    } catch (error) {
      setImageTone('dark');
    }
  }, []);

  const handleImageLoad = useCallback(() => {
    if (!active || !imageRef.current) {
      return;
    }
    evaluateImageTone(imageRef.current);
  }, [active, evaluateImageTone]);

  const handleImageError = useCallback(() => {
    setImageTone('dark');
  }, []);

  const clampZoom = useCallback((value) => Math.min(4, Math.max(1, value)), []);

  const clampPan = useCallback(
    (pan, zoom) => {
      if (zoom <= 1) {
        return { x: 0, y: 0 };
      }
      const container = fullscreenContainerRef.current;
      const image = fullscreenImageRef.current;
      if (!container || !image) {
        return pan;
      }
      const rect = container.getBoundingClientRect();
      const naturalWidth = image.naturalWidth || rect.width;
      const naturalHeight = image.naturalHeight || rect.height;
      const baseScale = Math.min(
        rect.width / naturalWidth,
        rect.height / naturalHeight,
      );
      const scaledWidth = naturalWidth * baseScale * zoom;
      const scaledHeight = naturalHeight * baseScale * zoom;
      const maxX = Math.max(0, (scaledWidth - rect.width) / 2);
      const maxY = Math.max(0, (scaledHeight - rect.height) / 2);
      const clampedX = Math.min(maxX, Math.max(-maxX, pan.x));
      const clampedY = Math.min(maxY, Math.max(-maxY, pan.y));
      if (clampedX === pan.x && clampedY === pan.y) {
        return pan;
      }
      return { x: clampedX, y: clampedY };
    },
    [],
  );

  const resetFullscreenState = useCallback(() => {
    pointerStateRef.current.pointers.clear();
    pointerStateRef.current.panStart = null;
    pointerStateRef.current.pinch = null;
    setFullscreenZoom(1);
    setPanOffset({ x: 0, y: 0 });
    setIsDragging(false);
  }, []);

  useEffect(() => {
    resetFullscreenState();
  }, [isFullscreen, resetFullscreenState]);

  const updateZoom = useCallback(
    (desiredZoom, pivot) => {
      setFullscreenZoom((prevZoom) => {
        const newZoom = clampZoom(desiredZoom);
        if (newZoom === prevZoom) {
          return prevZoom;
        }
        setPanOffset((prevPan) => {
          if (!fullscreenContainerRef.current) {
            return clampPan(prevPan, newZoom);
          }
          const rect = fullscreenContainerRef.current.getBoundingClientRect();
          const origin =
            pivot ||
            {
              x: rect.left + rect.width / 2,
              y: rect.top + rect.height / 2,
            };
          const center = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
          };
          const relativeX = origin.x - center.x - prevPan.x;
          const relativeY = origin.y - center.y - prevPan.y;
          const scaleFactor = newZoom / prevZoom;
          const nextPan = {
            x: prevPan.x - relativeX * (scaleFactor - 1),
            y: prevPan.y - relativeY * (scaleFactor - 1),
          };
          return clampPan(nextPan, newZoom);
        });
        return newZoom;
      });
    },
    [clampPan, clampZoom],
  );

  useEffect(() => {
    setPanOffset((prevPan) => {
      const clamped = clampPan(prevPan, fullscreenZoom);
      if (clamped.x === prevPan.x && clamped.y === prevPan.y) {
        return prevPan;
      }
      return clamped;
    });
    if (fullscreenZoom <= 1.01) {
      setIsDragging(false);
    }
  }, [clampPan, fullscreenZoom]);

  useEffect(() => {
    if (hasImage && imageRef.current?.complete && active) {
      evaluateImageTone(imageRef.current);
    }
  }, [active, hasImage, evaluateImageTone, backgroundImage]);

  const ambientStyle = {
    '--ambient-img': hasImage ? `url("${backgroundImage}")` : 'none',
  };
  const toneClass = useMemo(() => {
    if (!active || !hasImage) {
      return '';
    }
    return imageTone === 'light' ? 'tone-light' : 'tone-dark';
  }, [active, hasImage, imageTone]);
  const videoClassName = [
    'video',
    active ? 'active' : '',
    hasImage ? 'has-image' : '',
    toneClass,
    fitMode === 'contain' ? 'fit-contain' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const handleCloseFullscreen = useCallback(() => {
    resetFullscreenState();
    onCloseFullscreen?.();
  }, [onCloseFullscreen, resetFullscreenState]);

  useEffect(() => {
    if (!active && isFullscreen) {
      onCloseFullscreen?.();
    }
  }, [active, isFullscreen, onCloseFullscreen]);

  useEffect(() => {
    if (!isFullscreen) {
      return undefined;
    }

    if (typeof document === 'undefined' || typeof window === 'undefined') {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onCloseFullscreen?.();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isFullscreen, onCloseFullscreen]);

  const handleWheelFullscreen = useCallback(
    (event) => {
      if (!hasImage) {
        return;
      }
      event.preventDefault();
      const delta = event.deltaY > 0 ? -0.18 : 0.18;
      updateZoom(fullscreenZoom + delta, { x: event.clientX, y: event.clientY });
    },
    [fullscreenZoom, hasImage, updateZoom],
  );

  const handleDoubleClickFullscreen = useCallback(
    (event) => {
      if (!hasImage) {
        return;
      }
      event.preventDefault();
      if (fullscreenZoom > 1.05) {
        updateZoom(1, { x: event.clientX, y: event.clientY });
      } else {
        updateZoom(2, { x: event.clientX, y: event.clientY });
      }
    },
    [fullscreenZoom, hasImage, updateZoom],
  );

  const handlePointerDownFullscreen = useCallback(
    (event) => {
      if (!hasImage) {
        return;
      }
      if (fullscreenContainerRef.current?.setPointerCapture) {
        fullscreenContainerRef.current.setPointerCapture(event.pointerId);
      }
      event.preventDefault();
      const state = pointerStateRef.current;
      state.pointers.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      });
      if (state.pointers.size === 1) {
        state.panStart = {
          id: event.pointerId,
          x: event.clientX,
          y: event.clientY,
          pan: panOffset,
        };
        setIsDragging(fullscreenZoom > 1.01);
      } else if (state.pointers.size === 2) {
        const points = Array.from(state.pointers.values());
        state.pinch = {
          distance:
            Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y) || 1,
          zoom: fullscreenZoom,
        };
        state.panStart = null;
        setIsDragging(false);
      }
    },
    [fullscreenZoom, hasImage, panOffset],
  );

  const handlePointerMoveFullscreen = useCallback(
    (event) => {
      const state = pointerStateRef.current;
      if (!state.pointers.has(event.pointerId)) {
        return;
      }
      event.preventDefault();
      state.pointers.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      });

      if (state.pointers.size === 2 && state.pinch) {
        const points = Array.from(state.pointers.values());
        const distance =
          Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y) ||
          state.pinch.distance;
        const ratio = distance / state.pinch.distance;
        const pivot = {
          x: (points[0].x + points[1].x) / 2,
          y: (points[0].y + points[1].y) / 2,
        };
        updateZoom(state.pinch.zoom * ratio, pivot);
        return;
      }

      if (
        state.pointers.size === 1 &&
        state.panStart &&
        state.panStart.id === event.pointerId &&
        fullscreenZoom > 1.01
      ) {
        const point = state.pointers.get(event.pointerId);
        if (!point) {
          return;
        }
        const deltaX = point.x - state.panStart.x;
        const deltaY = point.y - state.panStart.y;
        const nextPan = {
          x: state.panStart.pan.x + deltaX,
          y: state.panStart.pan.y + deltaY,
        };
        const clamped = clampPan(nextPan, fullscreenZoom);
        setPanOffset((prevPan) => {
          if (prevPan.x === clamped.x && prevPan.y === clamped.y) {
            return prevPan;
          }
          return clamped;
        });
      }
    },
    [clampPan, fullscreenZoom, updateZoom],
  );

  const finalizePointerRemoval = useCallback(
    (pointerId) => {
      const state = pointerStateRef.current;
      state.pointers.delete(pointerId);
      if (state.panStart?.id === pointerId) {
        state.panStart = null;
        setIsDragging(false);
      }
      if (state.pointers.size === 1) {
        const [remainingId, point] = state.pointers.entries().next().value;
        state.panStart = {
          id: remainingId,
          x: point.x,
          y: point.y,
          pan: panOffset,
        };
        setIsDragging(fullscreenZoom > 1.01);
      }
      if (state.pointers.size < 2) {
        state.pinch = null;
      }
      if (fullscreenContainerRef.current?.releasePointerCapture) {
        fullscreenContainerRef.current.releasePointerCapture(pointerId);
      }
    },
    [fullscreenZoom, panOffset],
  );

  const handlePointerUpFullscreen = useCallback(
    (event) => {
      if (!pointerStateRef.current.pointers.has(event.pointerId)) {
        return;
      }
      event.preventDefault();
      finalizePointerRemoval(event.pointerId);
    },
    [finalizePointerRemoval],
  );

  const handlePointerCancelFullscreen = useCallback(
    (event) => {
      if (!pointerStateRef.current.pointers.has(event.pointerId)) {
        return;
      }
      event.preventDefault();
      finalizePointerRemoval(event.pointerId);
    },
    [finalizePointerRemoval],
  );

  const fullscreenImage =
    currentImage?.fullsize || currentImage?.thumb || backgroundImage;
  const fullscreenClassName = useMemo(() => {
    const classes = ['artcard-fullscreen'];
    if (fullscreenZoom > 1.01) {
      classes.push('zoomed');
    }
    if (isDragging) {
      classes.push('dragging');
    }
    return classes.join(' ');
  }, [fullscreenZoom, isDragging]);

  return (
    <div
      className={videoClassName}
      ref={(node) => setCardRef?.(node)}
      style={ambientStyle}
    >
      <div
        className="media-wrapper"
        onPointerDown={handlePointerDownMedia}
        onPointerMove={handlePointerMoveMedia}
        onPointerUp={handlePointerEndMedia}
        onPointerCancel={handlePointerCancelMedia}
        onPointerLeave={handlePointerCancelMedia}
        onTouchStart={handleTouchStartMedia}
        onTouchMove={handleTouchMoveMedia}
        onTouchEnd={handleTouchEndMedia}
        onTouchCancel={handleTouchCancelMedia}
        onKeyDown={handleMediaKeyDown}
        tabIndex={imageCount > 1 ? 0 : undefined}
        role={imageCount > 1 ? 'group' : undefined}
        aria-roledescription={imageCount > 1 ? 'carrousel' : undefined}
        aria-label={
          imageCount > 1
            ? `Visuel ${activeImageIndex + 1} sur ${imageCount}`
            : undefined
        }
      >
        {backgroundImage ? (
          <img
            className="videoImg"
            src={backgroundImage}
            ref={imageRef}
            onLoad={handleImageLoad}
            onError={handleImageError}
            alt={currentImage?.alt || post.text || post.author?.displayName}
          />
        ) : (
          <div className="video-placeholder">
            <span>Post sans image</span>
          </div>
        )}
      </div>

      <div className="bottom-controls">
        <div className="footer-left">
          <FooterLeft
            author={post.author}
            text={post.text}
            indexedAt={post.indexedAt}
            mediaCount={imageCount}
            mediaIndex={activeImageIndex}
            onSelectMedia={handleIndicatorSelect}
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
      {isFullscreen && hasImage ? (
        <div
          className={fullscreenClassName}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="fullscreen-close"
            onClick={handleCloseFullscreen}
            data-prevent-desktop-swipe="true"
            aria-label="Fermer l'affichage plein écran"
          >
            Fermer
          </button>
          <div
            className="fullscreen-media"
            ref={fullscreenContainerRef}
            onWheel={handleWheelFullscreen}
            onPointerDown={handlePointerDownFullscreen}
            onPointerMove={handlePointerMoveFullscreen}
            onPointerUp={handlePointerUpFullscreen}
            onPointerCancel={handlePointerCancelFullscreen}
            onPointerLeave={handlePointerCancelFullscreen}
            onDoubleClick={handleDoubleClickFullscreen}
          >
            <img
              ref={fullscreenImageRef}
              src={fullscreenImage}
              alt={currentImage?.alt || post.text || post.author?.displayName}
              style={{
                transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${fullscreenZoom})`,
              }}
              draggable={false}
            />
          </div>
          {fullscreenZoom > 1.01 ? (
            <div className="fullscreen-zoom-indicator">
              {`${Math.round(fullscreenZoom * 100)}%`}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

export default ArtCard;
