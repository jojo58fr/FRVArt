import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import ArtCard from './components/ArtCard';
import OnboardingCard from './components/OnboardingCard';
import BottomNavbar from './components/BottomNavbar';
import TopNavbar from './components/TopNavbar';
import LoginDialog from './components/LoginDialog';
import PinnedGallery from './components/PinnedGallery';
import CommentsPanel from './components/CommentsPanel';
import ChangelogDialog from './components/ChangelogDialog';
import FullscreenViewer from './components/FullscreenViewer';
import onboardingCards from './data/onboardingCards';
import changelogEntries, { latestVersion as changelogLatestVersion } from './data/changelog.js';

import { buildPostLink } from './utils/post';
import buildInfo from '../metadata-version.json';

import { BlueskyContext } from './App.jsx';

const FEED_BUFFER_LIMIT = 180;
const RETRY_DELAY_MS = 8000;

const buildData = buildInfo ?? {};
const baseVersionSegments = [
  Number.isFinite(buildData.buildMajor) ? buildData.buildMajor : 0,
  Number.isFinite(buildData.buildMinor) ? buildData.buildMinor : 0,
  Number.isFinite(buildData.buildRevision) ? buildData.buildRevision : 0,
];
const computedBaseVersion = baseVersionSegments.join('.');
const BASE_VERSION =
  computedBaseVersion === '0.0.0' && changelogLatestVersion
    ? changelogLatestVersion
    : computedBaseVersion;
const DISPLAY_VERSION =
  buildData.buildTag && buildData.buildTag !== 'RELEASE'
    ? `${BASE_VERSION}-${String(buildData.buildTag).toLowerCase()}`
    : BASE_VERSION;

const CHANGELOG_ENTRIES =
  changelogEntries && changelogEntries.length
    ? changelogEntries
    : [
        {
          version: BASE_VERSION,
          date: 'Historique indisponible',
          changes: ['Aucune entree de changelog trouvee.'],
        },
      ];

const shufflePosts = (items) => {
  if (!Array.isArray(items)) {
    return [];
  }
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const interleavePostsByAuthor = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    return [];
  }

  // Group posts by author DID
  const groups = {};
  items.forEach((post) => {
    const authorDid = post.author?.did;
    if (!authorDid) return;
    if (!groups[authorDid]) {
      groups[authorDid] = [];
    }
    groups[authorDid].push(post);
  });

  // Get all group keys
  const authorKeys = Object.keys(groups);

  // Interleave: take one from each author in round-robin
  const result = [];
  let hasMore = true;
  while (hasMore) {
    hasMore = false;
    for (const key of authorKeys) {
      if (groups[key].length > 0) {
        result.push(groups[key].shift());
        hasMore = true;
      }
    }
  }

  return result;
};

const sortPostsByDateDesc = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    return [];
  }
  return [...items].sort((a, b) => {
    const timeA = a?.indexedAt ? new Date(a.indexedAt).getTime() : 0;
    const timeB = b?.indexedAt ? new Date(b.indexedAt).getTime() : 0;
    if (timeB !== timeA) {
      return timeB - timeA;
    }
    const uriA = a?.uri ? String(a.uri) : '';
    const uriB = b?.uri ? String(b.uri) : '';
    return uriA.localeCompare(uriB);
  });
};

function CloneTikTok() {
  const { client, isAuthenticated, pins, session } = useContext(BlueskyContext);
  const viewerDid = session?.did || null;
  const [posts, setPosts] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [moreLoading, setMoreLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [showLogin, setShowLogin] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [showPins, setShowPins] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [ambientSlotA, setAmbientSlotA] = useState('');
  const [ambientSlotB, setAmbientSlotB] = useState('');
  const [ambientUseSlotA, setAmbientUseSlotA] = useState(true);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentsPost, setCommentsPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [mediaFitModes, setMediaFitModes] = useState({});
  const [mediaActiveIndexes, setMediaActiveIndexes] = useState({});
  const [fullscreenPostKey, setFullscreenPostKey] = useState(null);
  const [fullscreenMediaIndex, setFullscreenMediaIndex] = useState(0);

  const containerRef = useRef(null);
  const cardRefs = useRef([]);
  const loadMoreRef = useRef(null);
  const retryTimeoutRef = useRef(null);
  const hasPostsRef = useRef(false);
  const shareTimeoutRef = useRef(null);
  const showOnboardingFeed = !isAuthenticated;
  const displayPosts = showOnboardingFeed ? onboardingCards : posts;
  const displayCount = displayPosts.length;
  const activePost = displayPosts[activeIndex] || null;
  const activeKey = activePost
    ? activePost.uri || `onboarding-${activeIndex}`
    : null;
  const activeMediaIndex = activeKey ? mediaActiveIndexes[activeKey] || 0 : 0;
  const activeMediaData = useMemo(() => {
    if (!activePost || activePost.onboarding) {
      return {
        src: '',
        alt: activePost?.text || activePost?.author?.displayName || '',
        hasMedia: false,
        index: 0,
      };
    }
    const images = Array.isArray(activePost.images)
      ? activePost.images.filter(Boolean)
      : [];
    const maxIndex = images.length > 0 ? images.length - 1 : 0;
    const normalizedIndex = Math.min(
      Math.max(0, activeMediaIndex),
      maxIndex,
    );
    const selectedImage = images[normalizedIndex] || null;
    const src =
      selectedImage?.fullsize ||
      selectedImage?.thumb ||
      activePost.author?.avatar ||
      '';
    const alt =
      selectedImage?.alt ||
      activePost.text ||
      activePost.author?.displayName ||
      activePost.author?.handle ||
      'Illustration Bluesky';
    return {
      src,
      alt,
      hasMedia: Boolean(src),
      index: normalizedIndex,
    };
  }, [activePost, activeMediaIndex]);
  const activeHasMedia = activeMediaData.hasMedia;
  const activeMediaSource = activeMediaData.src;
  const activeMediaResolvedIndex = activeMediaData.index || 0;
  const activeFitMode = activeKey ? mediaFitModes[activeKey] || 'cover' : 'cover';

  useEffect(() => {
    setMediaActiveIndexes((prev) => {
      if (!prev || !Object.keys(prev).length) {
        return posts.length ? prev : {};
      }
      if (!posts.length) {
        return Object.keys(prev).length ? {} : prev;
      }
      const postsByUri = new Map(
        posts
          .filter((postItem) => postItem?.uri)
          .map((postItem) => [postItem.uri, postItem]),
      );
      if (!postsByUri.size) {
        return Object.keys(prev).length ? {} : prev;
      }
      let changed = false;
      const next = {};
      Object.entries(prev).forEach(([key, value]) => {
        const postItem = postsByUri.get(key);
        if (!postItem) {
          changed = true;
          return;
        }
        const normalizedValue = Number.isFinite(value)
          ? Math.max(0, Math.floor(value))
          : 0;
        const images = Array.isArray(postItem.images)
          ? postItem.images.filter(Boolean)
          : [];
        const maxIndex = images.length > 0 ? images.length - 1 : 0;
        const clamped = Math.min(Math.max(0, normalizedValue), maxIndex);
        if (clamped > 0) {
          next[key] = clamped;
        }
        if (!changed) {
          changed =
            clamped !== normalizedValue ||
            (clamped === 0 && normalizedValue !== 0);
        }
      });
      return changed ? next : prev;
    });
  }, [posts]);

  const fullscreenPost = useMemo(() => {
    if (!fullscreenPostKey) {
      return null;
    }
    return posts.find((item) => item?.uri === fullscreenPostKey) || null;
  }, [fullscreenPostKey, posts]);

  const fullscreenActive = Boolean(fullscreenPost);

  useEffect(() => {
    if (fullscreenPostKey && !fullscreenPost) {
      setFullscreenPostKey(null);
      setFullscreenMediaIndex(0);
    }
  }, [fullscreenPostKey, fullscreenPost]);

  useEffect(() => {
    if (!fullscreenPostKey) {
      return;
    }
    const nextIndex = mediaActiveIndexes[fullscreenPostKey] || 0;
    setFullscreenMediaIndex((prev) => (prev === nextIndex ? prev : nextIndex));
  }, [fullscreenPostKey, mediaActiveIndexes]);

  const clearRetryTimeout = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  const clearShareTimeout = useCallback(() => {
    if (shareTimeoutRef.current) {
      clearTimeout(shareTimeoutRef.current);
      shareTimeoutRef.current = null;
    }
  }, []);

  const toggleFitModeForKey = useCallback((key) => {
    if (!key) {
      return;
    }
    setMediaFitModes((prev) => {
      const previous = prev[key] || 'cover';
      const next = previous === 'cover' ? 'contain' : 'cover';
      if (next === 'cover') {
        const { [key]: _omit, ...rest } = prev;
        return rest;
      }
      return {
        ...prev,
        [key]: next,
      };
    });
  }, []);

  const handleMediaChangeForKey = useCallback((key, index) => {
    if (!key) {
      return;
    }
    const normalizedIndex = Number.isFinite(index)
      ? Math.max(0, Math.floor(index))
      : 0;
    setMediaActiveIndexes((prev) => {
      const previous = prev[key] ?? 0;
      if (previous === normalizedIndex) {
        return prev;
      }
      if (normalizedIndex === 0) {
        if (!(key in prev)) {
          return prev;
        }
        const { [key]: _omit, ...rest } = prev;
        return rest;
      }
      return {
        ...prev,
        [key]: normalizedIndex,
      };
    });
  }, []);

  const closeFullscreen = useCallback(() => {
    setFullscreenPostKey(null);
    setFullscreenMediaIndex(0);
  }, []);

  const toggleActiveFitMode = useCallback(() => {
    if (activeKey && activeHasMedia) {
      toggleFitModeForKey(activeKey);
    }
  }, [activeKey, activeHasMedia, toggleFitModeForKey]);

  const toggleActiveFullscreen = useCallback(() => {
    if (!activeHasMedia || !activeKey) {
      return;
    }
    setFullscreenPostKey((current) => {
      if (current === activeKey) {
        setFullscreenMediaIndex(0);
        return null;
      }
      setFullscreenMediaIndex(activeMediaResolvedIndex);
      return activeKey;
    });
  }, [activeHasMedia, activeKey, activeMediaResolvedIndex]);

  useEffect(() => {
    hasPostsRef.current = posts.length > 0;
    cardRefs.current.length = displayCount;
  }, [posts.length, displayCount]);

  useEffect(() => {
    if (showOnboardingFeed) {
      setActiveIndex(0);
    }
    const container = containerRef.current;
    if (container) {
      container.scrollTop = 0;
    }
  }, [showOnboardingFeed]);

  useEffect(
    () => () => {
      clearRetryTimeout();
      clearShareTimeout();
    },
    [clearRetryTimeout, clearShareTimeout],
  );

  useEffect(() => {
    if (isAuthenticated) {
      setShowChangelog(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (fullscreenPostKey && fullscreenPostKey !== activeKey) {
      setFullscreenPostKey(null);
      setFullscreenMediaIndex(0);
    }
  }, [activeKey, fullscreenPostKey]);

  const fetchInitialFeed = useCallback(
    async ({ force = false } = {}) => {
      if (!force && !client.isAuthenticated()) {
        return;
      }
      let toggledLoading = false;
      if (!hasPostsRef.current) {
        setLoading(true);
        toggledLoading = true;
      }
      setError('');
      try {
        const data = await client.fetchArtFeed();
        const initialPosts = Array.isArray(data.posts)
          ? data.posts.slice(0, FEED_BUFFER_LIMIT)
          : [];

        if (initialPosts.length) {
          const interleavedPosts = interleavePostsByAuthor(initialPosts);
          setPosts(sortPostsByDateDesc(interleavedPosts));
          setCursor(data.cursor || null);
          setHasMore(true);
          setIsRetrying(false);
          clearRetryTimeout();
        }
      } catch (err) {
        setError('Impossible de recuperer le flux Bluesky. Nouvelle tentative...');
        setIsRetrying(true);
        clearRetryTimeout();
        if (!retryTimeoutRef.current) {
          retryTimeoutRef.current = setTimeout(() => {
            retryTimeoutRef.current = null;
            fetchInitialFeed();
          }, RETRY_DELAY_MS);
        }
      } finally {
        if (toggledLoading) {
          setLoading(false);
        }
      }
    },
    [client, clearRetryTimeout],
  );

  useEffect(() => {
    if (!isAuthenticated) {
      clearRetryTimeout();
      setPosts([]);
      setCursor(null);
      setHasMore(true);
      setError('');
      setIsRetrying(false);
      setLoading(false);
      setMoreLoading(false);
      return;
    }
    fetchInitialFeed();
  }, [isAuthenticated, fetchInitialFeed, clearRetryTimeout]);

  const handleLoadMore = useCallback(async () => {
      if (!isAuthenticated || !hasMore || moreLoading) {
        return;
      }
    setMoreLoading(true);
    try {
      const canUseCursor =
        cursor && Object.values(cursor || {}).some((value) => Boolean(value));

      let looped = false;
      let data = null;

      if (canUseCursor) {
        data = await client.fetchMore({ cursor });
      }

      if (!data || !Array.isArray(data.posts) || !data.posts.length) {
        looped = true;
        data = await client.fetchArtFeed();
      }

        const incomingPosts = Array.isArray(data.posts) ? data.posts : [];
        if (!incomingPosts.length) {
          setHasMore(true);
          setIsRetrying(true);
          clearRetryTimeout();
          if (!retryTimeoutRef.current) {
            retryTimeoutRef.current = setTimeout(() => {
              retryTimeoutRef.current = null;
              fetchInitialFeed();
            }, RETRY_DELAY_MS);
          }
          return;
        }

        const postsToAppend = looped ? shufflePosts(incomingPosts) : incomingPosts;

        setCursor(data.cursor || null);
        setHasMore(true);
        clearRetryTimeout();
        setIsRetrying(false);
        setPosts((prev) => {
          const combined = [...prev, ...postsToAppend];
          const trimmed = combined.length > FEED_BUFFER_LIMIT
            ? combined.slice(combined.length - FEED_BUFFER_LIMIT)
            : combined;
          return sortPostsByDateDesc(interleavePostsByAuthor(trimmed));
        });
      } catch (_err) {
        setHasMore(true);
        setIsRetrying(true);
        clearRetryTimeout();
        if (!retryTimeoutRef.current) {
          retryTimeoutRef.current = setTimeout(() => {
            retryTimeoutRef.current = null;
            fetchInitialFeed();
          }, RETRY_DELAY_MS);
        }
      } finally {
        setMoreLoading(false);
      }
    }, [
      client,
      clearRetryTimeout,
      cursor,
      fetchInitialFeed,
      hasMore,
      isAuthenticated,
      moreLoading,
    ]);

  useEffect(() => {
    if (!loadMoreRef.current) return;
    const sentinel = loadMoreRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            handleLoadMore();
          }
        });
      },
      { threshold: 0.2 },
    );
    observer.observe(sentinel);
    return () => observer.unobserve(sentinel);
  }, [handleLoadMore]);

  useEffect(() => {
    const items = showOnboardingFeed ? onboardingCards : posts;
    if (!items.length) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.dataset.index);
            if (!Number.isNaN(index)) {
              setActiveIndex(index);
            }
          }
        });
      },
      {
        threshold: 0.6,
      },
    );

    cardRefs.current
      .slice(0, items.length)
      .filter(Boolean)
      .forEach((node) => {
        observer.observe(node);
      });

  return () => {
      observer.disconnect();
    };
  }, [showOnboardingFeed, posts, displayCount]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || displayCount <= 0) {
      return undefined;
    }

    if (typeof window === 'undefined') {
      return undefined;
    }

    const coarsePointerQuery =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(pointer: coarse)')
        : null;
    if (coarsePointerQuery && coarsePointerQuery.matches) {
      return undefined;
    }

    let pointerId = null;
    let isDragging = false;
    let startY = 0;
    let startX = 0;
    let lastY = 0;
    let lastX = 0;
    let previousSnapType = '';
    let scrollLocked = false;
    let settleTimer = null;
    let pointerCardIndex = -1;
    let pointerCardKey = null;
    let pointerCardImageCount = 0;
    let pointerCardBaseIndex = 0;
    let horizontalConsumed = false;

    const interactiveSelectors =
      'button, a, input, textarea, select, [data-prevent-desktop-swipe="true"]';

    const isInteractiveTarget = (target) => {
      if (!(target instanceof Element)) {
        return false;
      }
      return Boolean(target.closest(interactiveSelectors));
    };

    const clampScroll = (value) => {
      const maxScroll = container.scrollHeight - container.clientHeight;
      if (maxScroll <= 0) {
        return 0;
      }
      if (value < 0) {
        return 0;
      }
      if (value > maxScroll) {
        return maxScroll;
      }
      return value;
    };

    const disableSnap = () => {
      if (!container.classList.contains('swipe-active')) {
        previousSnapType = container.style.scrollSnapType;
        container.style.scrollSnapType = 'none';
        container.classList.add('swipe-active');
      }
    };

    const restoreSnap = () => {
      container.style.scrollSnapType = previousSnapType;
      container.classList.remove('swipe-active');
    };

    const clearSettleTimer = () => {
      if (settleTimer) {
        clearTimeout(settleTimer);
        settleTimer = null;
      }
    };

    const scheduleSettle = (delay = 360) => {
      clearSettleTimer();
      settleTimer = window.setTimeout(() => {
        settleTimer = null;
        scrollLocked = false;
        restoreSnap();
      }, delay);
    };

    const scrollToCard = (index) => {
      const node = cardRefs.current[index];
      if (!node) {
        return false;
      }
      container.scrollTo({
        top: node.offsetTop,
        behavior: 'smooth',
      });
      return true;
    };

    const startControlledScroll = (index, delay) => {
      disableSnap();
      scrollLocked = true;
      const didScroll = scrollToCard(index);
      scheduleSettle(delay ?? (didScroll ? 320 : 180));
    };

    const getSwipeThreshold = () =>
      Math.min(160, Math.max(80, container.clientHeight * 0.2));
    const getHorizontalThreshold = () =>
      Math.min(220, Math.max(90, container.clientWidth * 0.18));

    const handlePointerDown = (event) => {
      if (event.pointerType && event.pointerType !== 'mouse' && event.pointerType !== 'pen') {
        return;
      }
      if (event.button !== 0) {
        return;
      }
      if (isInteractiveTarget(event.target)) {
        return;
      }

      clearSettleTimer();
      scrollLocked = false;
      disableSnap();
      pointerId = event.pointerId;
      isDragging = true;
      startY = event.clientY;
      startX = event.clientX;
      lastY = event.clientY;
      lastX = event.clientX;
      horizontalConsumed = false;
      pointerCardIndex = -1;
      pointerCardKey = null;
      pointerCardImageCount = 0;
      pointerCardBaseIndex = 0;

      if (event.target instanceof Element) {
        const cardNode = event.target.closest('[data-index]');
        if (cardNode) {
          const index = Number(cardNode.dataset.index);
          if (!Number.isNaN(index)) {
            pointerCardIndex = index;
            const cardData = displayPosts[index];
            if (cardData && !cardData.onboarding) {
              const images = Array.isArray(cardData.images)
                ? cardData.images.filter(Boolean)
                : [];
              pointerCardImageCount = images.length;
              pointerCardKey = typeof cardData.uri === 'string' ? cardData.uri : null;
              if (pointerCardKey) {
                pointerCardBaseIndex =
                  pointerCardKey === activeKey
                    ? activeMediaResolvedIndex
                    : mediaActiveIndexes[pointerCardKey] || 0;
              }
            }
          }
        }
      }

      container.setPointerCapture?.(pointerId);
    };

    const handlePointerMove = (event) => {
      if (!isDragging || event.pointerId !== pointerId) {
        return;
      }
      if (horizontalConsumed) {
        return;
      }
      const totalDeltaX = event.clientX - startX;
      const totalDeltaY = event.clientY - startY;
      const deltaY = event.clientY - lastY;
      lastX = event.clientX;
      lastY = event.clientY;

      if (
        pointerCardImageCount > 1 &&
        Math.abs(totalDeltaX) > Math.abs(totalDeltaY) &&
        Math.abs(totalDeltaX) >= getHorizontalThreshold()
      ) {
        const direction = totalDeltaX < 0 ? 1 : -1;
        const maxIndex = pointerCardImageCount - 1;
        let nextIndex = pointerCardBaseIndex + direction;
        if (nextIndex < 0) {
          nextIndex = 0;
        } else if (nextIndex > maxIndex) {
          nextIndex = maxIndex;
        }
        if (pointerCardKey && nextIndex !== pointerCardBaseIndex) {
          handleMediaChangeForKey(pointerCardKey, nextIndex);
        }
        horizontalConsumed = true;
        clearSettleTimer();
        container.releasePointerCapture?.(pointerId);
        pointerId = null;
        isDragging = false;
        restoreSnap();
        return;
      }

      const nextScroll = clampScroll(container.scrollTop - deltaY);
      if (Math.abs(deltaY) > 0.5) {
        event.preventDefault();
      }
      container.scrollTop = nextScroll;
    };

    const finishDrag = (event) => {
      if (!isDragging || event.pointerId !== pointerId) {
        return;
      }
      if (horizontalConsumed) {
        horizontalConsumed = false;
        return;
      }

      const delta = startY - event.clientY;
      const threshold = getSwipeThreshold();

      container.releasePointerCapture?.(pointerId);
      isDragging = false;
      pointerId = null;

      let targetIndex = activeIndex;
      if (displayCount > 1 && Math.abs(delta) >= threshold) {
        targetIndex = delta > 0 ? activeIndex + 1 : activeIndex - 1;
      }

      if (targetIndex < 0) {
        targetIndex = 0;
      } else if (targetIndex > displayCount - 1) {
        targetIndex = displayCount - 1;
      }

      requestAnimationFrame(() => {
        startControlledScroll(targetIndex);
      });
    };

    const handleWheel = (event) => {
      if (isDragging || event.ctrlKey) {
        return;
      }
      const deltaY = event.deltaY;
      if (Math.abs(deltaY) < 8) {
        return;
      }
      if (displayCount <= 1) {
        return;
      }
      if (scrollLocked) {
        return;
      }

      event.preventDefault();
      clearSettleTimer();

      const direction = deltaY > 0 ? 1 : -1;
      let targetIndex = activeIndex + direction;
      if (targetIndex < 0) {
        targetIndex = 0;
      } else if (targetIndex > displayCount - 1) {
        targetIndex = displayCount - 1;
      }

      if (targetIndex === activeIndex) {
        return;
      }

      startControlledScroll(targetIndex, 340);
    };

    const handlePointerUp = (event) => {
      finishDrag(event);
    };

    const handlePointerCancel = (event) => {
      finishDrag(event);
    };

    container.addEventListener('pointerdown', handlePointerDown);
    container.addEventListener('pointermove', handlePointerMove, { passive: false });
    container.addEventListener('pointerup', handlePointerUp);
    container.addEventListener('pointercancel', handlePointerCancel);
    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      if (pointerId != null) {
        container.releasePointerCapture?.(pointerId);
      }
      clearSettleTimer();
      scrollLocked = false;
      restoreSnap();
      container.removeEventListener('pointerdown', handlePointerDown);
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerup', handlePointerUp);
      container.removeEventListener('pointercancel', handlePointerCancel);
      container.removeEventListener('wheel', handleWheel);
    };
  }, [
    activeIndex,
    displayCount,
    displayPosts,
    mediaActiveIndexes,
    handleMediaChangeForKey,
    activeKey,
    activeMediaResolvedIndex,
  ]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !showOnboardingFeed) {
      return undefined;
    }

    const clampScroll = () => {
      const maxScroll = container.scrollHeight - container.clientHeight;
      if (maxScroll <= 0) {
        return 0;
      }
      if (container.scrollTop > maxScroll) {
        container.scrollTop = maxScroll;
      }
      return maxScroll;
    };

    const handleWheel = (event) => {
      const maxScroll = clampScroll();
      if (maxScroll <= 0) {
        event.preventDefault();
        return;
      }
      if (event.deltaY > 0 && container.scrollTop >= maxScroll - 1) {
        event.preventDefault();
        container.scrollTop = maxScroll;
      }
    };

    let lastTouchY = null;

    const handleTouchStart = (event) => {
      if (event.touches.length === 1) {
        lastTouchY = event.touches[0].clientY;
      }
    };

    const handleTouchMove = (event) => {
      if (lastTouchY == null) {
        return;
      }
      const currentY = event.touches[0].clientY;
      const deltaY = lastTouchY - currentY;
      if (deltaY > 0) {
        const maxScroll = clampScroll();
        if (maxScroll <= 0) {
          event.preventDefault();
          return;
        }
        if (container.scrollTop >= maxScroll - 1) {
          event.preventDefault();
          container.scrollTop = maxScroll;
        }
      }
    };

    const handleTouchEnd = () => {
      lastTouchY = null;
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [showOnboardingFeed]);

  const handleLike = useCallback(
    async (post) => {
      if (!isAuthenticated) {
        setShowLogin(true);
        return;
      }
      try {
        const result = await client.toggleLike(post);
        setPosts((prev) =>
          prev.map((item) =>
            item.uri === post.uri
              ? {
                  ...item,
                  likeCount: result.likeCount,
                  viewer: {
                    ...(item.viewer || {}),
                    like: result.likeUri || undefined,
                  },
                }
              : item,
          ),
        );
        client.updateLikesCache(post.uri, result);
      } catch (err) {
        if (err.message === 'AUTH_REQUIRED') {
          setShowLogin(true);
        } else {
          setError("Une erreur est survenue lors de l'action J'aime.");
        }
      }
    },
    [client, isAuthenticated],
  );

  const handlePin = useCallback(
    (post) => {
      client.pinPost(post);
    },
    [client],
  );

  const handleFollow = useCallback(
    async (author) => {
      if (!isAuthenticated) {
        setShowLogin(true);
        return;
      }
      if (!author?.did) {
        return;
      }
      if (viewerDid && author.did === viewerDid) {
        return;
      }
      try {
        const result = await client.toggleFollow(author);
        const followingUri = result.followingUri || null;
        setPosts((prev) =>
          prev.map((item) =>
            item.author?.did === author.did
              ? {
                  ...item,
                  author: {
                    ...item.author,
                    viewer: {
                      ...(item.author.viewer || {}),
                      following: followingUri,
                    },
                  },
                }
              : item,
          ),
        );
        setCommentsPost((prev) =>
          prev?.author?.did === author.did
            ? {
                ...prev,
                author: {
                  ...prev.author,
                  viewer: {
                    ...(prev.author.viewer || {}),
                    following: followingUri,
                  },
                },
              }
            : prev,
        );
        setComments((prev) =>
          prev.map((item) =>
            item.author?.did === author.did
              ? {
                  ...item,
                  author: {
                    ...item.author,
                    viewer: {
                      ...(item.author.viewer || {}),
                      following: followingUri,
                    },
                  },
                }
              : item,
          ),
        );
        client.updateFollowCache(author.did, followingUri);
      } catch (err) {
        if (err.message === 'AUTH_REQUIRED') {
          setShowLogin(true);
        } else {
          console.error('[FRVArt] Unable to toggle follow', err);
        }
      }
    },
    [client, isAuthenticated, viewerDid],
  );

  const handleUnpin = useCallback(
    (uri) => {
      client.unpinPost(uri);
    },
    [client],
  );

  const loadComments = useCallback(
    async (targetPost) => {
      if (!targetPost?.uri) {
        setComments([]);
        return;
      }
      setCommentsLoading(true);
      setCommentsError('');
      try {
        const data = await client.fetchComments(targetPost.uri, { depth: 1 });
        setComments(Array.isArray(data.comments) ? data.comments : []);
      } catch (_err) {
        setCommentsError('Impossible de charger les commentaires.');
      } finally {
        setCommentsLoading(false);
      }
    },
    [client],
  );

  const handleOpenComments = useCallback(
    (post) => {
      setCommentsPost(post);
      setCommentsOpen(true);
      setComments([]);
      setCommentsError('');
      loadComments(post);
    },
    [loadComments],
  );

  const handleCloseComments = useCallback(() => {
    setCommentsOpen(false);
    setCommentsPost(null);
    setComments([]);
    setCommentsError('');
    setCommentsLoading(false);
  }, []);

  const handleRetryComments = useCallback(() => {
    if (commentsPost) {
      loadComments(commentsPost);
    }
  }, [commentsPost, loadComments]);

  const handleShare = useCallback(
    async (post) => {
      if (!post) {
        return;
      }
      const url = buildPostLink(post);
      clearShareTimeout();
      const scheduleClear = () => {
        shareTimeoutRef.current = setTimeout(() => {
          setShareMessage('');
        }, 2600);
      };
      if (typeof navigator === 'undefined') {
        setShareMessage(url);
        scheduleClear();
        return;
      }
      try {
        if (navigator.share) {
          await navigator.share({
            title: post.author?.displayName || 'FRVArt',
            text: post.text || '',
            url,
          });
          setShareMessage('Partagé via le menu système');
        } else if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(url);
          setShareMessage('Lien copié dans le presse-papiers');
        } else {
          setShareMessage(url);
        }
      } catch (_err) {
        if (navigator.clipboard?.writeText) {
          try {
            await navigator.clipboard.writeText(url);
            setShareMessage('Lien copié dans le presse-papiers');
          } catch (_copyErr) {
            setShareMessage("Impossible de partager l'oeuvre.");
          }
        } else {
          setShareMessage("Impossible de partager l'oeuvre.");
        }
      }
      scheduleClear();
    },
    [clearShareTimeout],
  );

  const handleOpenPostExternal = useCallback((post) => {
    const url = buildPostLink(post);
    window.open(url, '_blank', 'noopener,noreferrer');
  }, []);

  const handleOpenChangelog = useCallback(() => {
    setShowChangelog(true);
  }, []);

  const handleCloseChangelog = useCallback(() => {
    setShowChangelog(false);
  }, []);

  const handleLoginRequest = useCallback(() => {
    setLoginError('');
    setShowLogin(true);
  }, []);

  const onboardingActionHandlers = useMemo(
    () => ({
      login: handleLoginRequest,
      changelog: handleOpenChangelog,
      pins: () => setShowPins(true),
      patreon: () =>
        window.open('https://www.patreon.com/c/TakuDev', '_blank', 'noopener,noreferrer'),
      github: () =>
        window.open('https://github.com/jojo58fr/FRVArt', '_blank', 'noopener,noreferrer'),
      discord: () =>
        window.open('https://discord.gg/meyHQYWvjU', '_blank', 'noopener,noreferrer'),
    }),
    [handleLoginRequest, handleOpenChangelog],
  );

  const handleLogin = useCallback(
    async (credentials) => {
      setLoginError('');
      setLoggingIn(true);
      try {
        const shouldRemember = credentials.remember !== false;
        await client.login(credentials.identifier, credentials.password, {
          remember: shouldRemember,
        });
        setShowLogin(false);
        await fetchInitialFeed({ force: true });
      } catch (err) {
        if (err?.toString().includes('Invalid identifier or password')) {
          setLoginError('Identifiant ou mot de passe invalide.');
        } else {
          setLoginError("Impossible de te connecter. Vérifie l'app password.");
        }
      } finally {
        setLoggingIn(false);
      }
    },
    [client, fetchInitialFeed],
  );

  const handleLogout = useCallback(() => {
    clearRetryTimeout();
    setPosts([]);
    setCursor(null);
    setHasMore(true);
    setError('');
    setIsRetrying(false);
    setLoading(false);
    setMoreLoading(false);
    setActiveIndex(0);
    setShowPins(false);
    setCommentsOpen(false);
    setCommentsPost(null);
    setComments([]);
    setCommentsError('');
    client.logout();
  }, [client, clearRetryTimeout]);

  const handleCloseLogin = useCallback(() => {
    setShowLogin(false);
  }, []);

  const isPinned = useCallback(
    (uri) => pins.some((item) => item.uri === uri),
    [pins],
  );

  const feedStatus = useMemo(() => {
    if (!isAuthenticated) {
      return '';
    }
    if (loading) {
      return 'Chargement du flux FRVArt...';
    }
    if (error) {
      return error;
    }
    if (!posts.length && isRetrying) {
      return 'Recherche en continu de nouvelles oeuvres Bluesky...';
    }
    if (!posts.length) {
      return 'Aucune oeuvre trouvee pour le moment. Les hashtags #FRVArt ou #VtuberFR sont recommandes mais pas obligatoires.';
    }
      return '';
  }, [isAuthenticated, loading, error, isRetrying, posts.length]);

  useEffect(() => {
    const newImage = activeMediaSource || '';
    const currentImage = ambientUseSlotA ? ambientSlotA : ambientSlotB;
    if (newImage === currentImage) {
      return;
    }
    if (ambientUseSlotA) {
      setAmbientSlotB(newImage);
    } else {
      setAmbientSlotA(newImage);
    }
    setAmbientUseSlotA((useSlotA) => !useSlotA);
  }, [activeMediaSource, ambientUseSlotA, ambientSlotA, ambientSlotB]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (ambientUseSlotA) {
        setAmbientSlotB('');
      } else {
        setAmbientSlotA('');
      }
    }, 700);
    return () => clearTimeout(timeout);
  }, [ambientUseSlotA]);

  const showAmbient = Boolean(ambientSlotA || ambientSlotB);
  const ambientClass = [
    'app',
    showAmbient ? 'ambient-active' : '',
    showAmbient
      ? ambientUseSlotA
        ? 'ambient-phase-a'
        : 'ambient-phase-b'
      : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={ambientClass}
      style={{
        '--ambient-img-a': ambientSlotA ? `url("${ambientSlotA}")` : 'none',
        '--ambient-img-b': ambientSlotB ? `url("${ambientSlotB}")` : 'none',
      }}
    >
      <div className="blur"></div>
      <div className="container" ref={containerRef}>
        <TopNavbar
          onLoginClick={handleLoginRequest}
          onLogout={handleLogout}
          onTogglePins={() => setShowPins((value) => !value)}
          isAuthenticated={isAuthenticated}
          pinCount={pins.length}
          onToggleFitMode={toggleActiveFitMode}
          onToggleFullscreen={toggleActiveFullscreen}
          fitMode={activeFitMode}
          fullscreenActive={fullscreenActive}
          mediaAvailable={activeHasMedia}
        />
        {!showOnboardingFeed && feedStatus ? (
          <div
            className={`feed-status${loading ? ' feed-status--loading' : ''}`}
            aria-live="polite"
          >
            {loading ? (
              <>
                <div className="feed-status__dots" aria-hidden="true">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span>{feedStatus}</span>
              </>
            ) : (
              feedStatus
            )}
          </div>
        ) : null}
        {displayPosts.map((post, index) => {
          const key = post.uri || `onboarding-${index}`;
          const cardFitMode = mediaFitModes[key] || 'cover';
          const rawMediaIndex = mediaActiveIndexes[key] || 0;
          const cardImages = Array.isArray(post.images)
            ? post.images.filter(Boolean)
            : [];
          const maxCardMediaIndex =
            cardImages.length > 0 ? cardImages.length - 1 : 0;
          const cardMediaIndex = Math.min(
            Math.max(0, rawMediaIndex),
            maxCardMediaIndex,
          );
          const setRef = (node) => {
            cardRefs.current[index] = node;
            if (node) {
              node.dataset.index = String(index);
            }
          };

          if (post.onboarding) {
            return (
              <OnboardingCard
                key={key}
                card={post}
                active={index === activeIndex}
                setCardRef={setRef}
                handlers={onboardingActionHandlers}
              />
            );
          }

        return (
          <ArtCard
            key={key}
            active={index === activeIndex}
            post={post}
            setCardRef={setRef}
            onLike={() => handleLike(post)}
            onComment={() => handleOpenComments(post)}
            onShare={() => handleShare(post)}
            onPin={() => handlePin(post)}
            onFollow={handleFollow}
            viewerDid={viewerDid}
            onLoginRequest={handleLoginRequest}
            pinned={isPinned(post.uri)}
            fitMode={cardFitMode}
            mediaIndex={cardMediaIndex}
            onMediaChange={(index) => handleMediaChangeForKey(key, index)}
          />
        );
      })}
        {!showOnboardingFeed ? (
          <div ref={loadMoreRef} className="load-more-sentinel">
            {moreLoading && !loading ? 'Chargement de nouvelles oeuvres...' : ''}
          </div>
        ) : null}
        <BottomNavbar className="bottom-navbar" />
      </div>
      <LoginDialog
        open={showLogin}
        onClose={handleCloseLogin}
        onSubmit={handleLogin}
        loading={loggingIn}
        error={loginError}
      />
      <PinnedGallery
        open={showPins}
        onClose={() => setShowPins(false)}
        pins={pins}
        onUnpin={handleUnpin}
        onLike={handleLike}
        onOpenPost={handleOpenPostExternal}
        isAuthenticated={isAuthenticated}
      />
      <CommentsPanel
        open={commentsOpen}
        onClose={handleCloseComments}
        post={commentsPost}
        comments={comments}
        loading={commentsLoading}
        error={commentsError}
        onRetry={handleRetryComments}
        onOpenPost={handleOpenPostExternal}
      />
      <FullscreenViewer
        open={fullscreenActive}
        post={fullscreenPost}
        mediaIndex={fullscreenMediaIndex}
        onClose={closeFullscreen}
      />
      <ChangelogDialog
        open={showChangelog}
        onClose={handleCloseChangelog}
        version={DISPLAY_VERSION}
        entries={CHANGELOG_ENTRIES}
      />
      {shareMessage ? <div className="share-toast">{shareMessage}</div> : null}
    </div>
  );
}

export default CloneTikTok;

