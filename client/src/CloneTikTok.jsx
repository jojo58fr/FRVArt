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

  const containerRef = useRef(null);
  const cardRefs = useRef([]);
  const loadMoreRef = useRef(null);
  const retryTimeoutRef = useRef(null);
  const hasPostsRef = useRef(false);
  const shareTimeoutRef = useRef(null);
  const showOnboardingFeed = !isAuthenticated;
  const displayPosts = showOnboardingFeed ? onboardingCards : posts;
  const displayCount = displayPosts.length;

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
          setPosts(initialPosts);
          setCursor(data.cursor || null);
          setHasMore(true);
          setIsRetrying(false);
          clearRetryTimeout();
        } else {
          setPosts([]);
          setCursor(data.cursor || null);
          setHasMore(true);
          setIsRetrying(true);
          clearRetryTimeout();
          if (!retryTimeoutRef.current) {
            retryTimeoutRef.current = setTimeout(() => {
              retryTimeoutRef.current = null;
              fetchInitialFeed();
            }, RETRY_DELAY_MS);
          }
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
          if (combined.length > FEED_BUFFER_LIMIT) {
            return combined.slice(combined.length - FEED_BUFFER_LIMIT);
          }
          return combined;
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
    const activePost = posts[activeIndex];
    const primary = activePost?.images?.[0];
    const newImage =
      primary?.fullsize ||
      primary?.thumb ||
      activePost?.author?.avatar ||
      '';
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
  }, [posts, activeIndex, ambientUseSlotA, ambientSlotA, ambientSlotB]);

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
        />
        {!showOnboardingFeed && feedStatus ? (
          <div className="feed-status">{feedStatus}</div>
        ) : null}
        {displayPosts.map((post, index) => {
          const key = post.uri || `onboarding-${index}`;
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

