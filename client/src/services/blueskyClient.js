import { BskyAgent } from '@atproto/api';

const BLUESKY_SERVICE = 'https://bsky.social';
const SESSION_STORAGE_KEY = 'frvart-session';
const PIN_STORAGE_KEY = 'frvart-pins';
const DEFAULT_TAGS = ['frvart', 'vtuberfr'];
const SUPPORTED_LANGS = ['fr', 'en'];
const COMMUNITY_FEEDS = [
  'at://did:plc:ixwgzhig757g7yhbb6izc3hl/app.bsky.feed.generator/aaabxq7kclvkk',
];

function ensureDebugStats(container, key) {
  if (!container[key]) {
    container[key] = {
      processed: 0,
      accepted: 0,
      replaced: 0,
      weaker: 0,
      noImage: 0,
      langMismatch: 0,
    };
  }
  return container[key];
}

const isBrowser = typeof window !== 'undefined';

function unwrapData(response) {
  if (!response) return {};
  if (response.data) {
    return response.data;
  }
  return response;
}

function loadJSON(key, fallback) {
  if (!isBrowser) {
    return fallback;
  }
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (_err) {
    return fallback;
  }
}

function saveJSON(key, value) {
  if (!isBrowser) {
    return;
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (_err) {
    // Ignore storage write errors (quota, private mode, etc.)
  }
}

function normalizeEmbedImages(embed) {
  if (!embed) return [];
  if (embed.images?.length) {
    return embed.images.map((image, idx) => ({
      thumb: image.thumb,
      fullsize: image.fullsize,
      alt: image.alt || `Artwork ${idx + 1}`,
    }));
  }
  if (embed.media?.images?.length) {
    return embed.media.images.map((image, idx) => ({
      thumb: image.thumb,
      fullsize: image.fullsize,
      alt: image.alt || `Artwork ${idx + 1}`,
    }));
  }
  if (embed.external?.thumb) {
    return [
      {
        thumb: embed.external.thumb,
        fullsize: embed.external.thumb,
        alt: embed.external.title || 'Illustration externe',
      },
    ];
  }
  if (embed.media?.external?.thumb) {
    const external = embed.media.external;
    return [
      {
        thumb: external.thumb,
        fullsize: external.thumb,
        alt: external.title || 'Illustration externe',
      },
    ];
  }
  return [];
}

function mapPost(post) {
  const record = post.record ?? {};
  const images = normalizeEmbedImages(post.embed);
  const authorViewer = post.author?.viewer ?? {};

  return {
    uri: post.uri,
    cid: post.cid,
    author: {
      did: post.author?.did,
      handle: post.author?.handle,
      displayName: post.author?.displayName || post.author?.handle || 'Artiste',
      avatar: post.author?.avatar || '',
      viewer: {
        following: authorViewer.following || null,
        followedBy: authorViewer.followedBy || null,
        muted: Boolean(authorViewer.muted),
        blockedBy: Boolean(authorViewer.blockedBy),
      },
    },
    text: record.text || '',
    indexedAt: post.indexedAt || record.createdAt,
    likeCount: post.likeCount ?? 0,
    repostCount: post.repostCount ?? 0,
    replyCount: post.replyCount ?? 0,
    viewer: post.viewer ?? {},
    images,
    tags: record.tags ?? [],
    langs: Array.isArray(record.langs) ? record.langs : [],
    tagScore: 0,
  };
}

function matchesLanguage(post) {
  if (!Array.isArray(post.langs) || post.langs.length === 0) {
    return true;
  }
  return post.langs.some((lang) => {
    if (!lang) return false;
    const normalized = String(lang).toLowerCase().slice(0, 2);
    return SUPPORTED_LANGS.includes(normalized);
  });
}

function computeTagScore(post, tags) {
  if (!Array.isArray(tags) || !tags.length) {
    return 0;
  }
  const normalizedTargets = tags
    .map((tag) => String(tag).toLowerCase())
    .filter(Boolean);
  if (!normalizedTargets.length) {
    return 0;
  }
  const recordTags = Array.isArray(post.tags)
    ? post.tags.map((tag) => String(tag).toLowerCase())
    : [];
  let score = 0;

  if (recordTags.length) {
    recordTags.forEach((tag) => {
      if (normalizedTargets.includes(tag)) {
        score = Math.max(score, 2);
      }
    });
  }

  if (score === 0 && post.text) {
    const text = String(post.text).toLowerCase();
    normalizedTargets.forEach((tag) => {
      if (text.includes(`#${tag}`) || text.includes(tag)) {
        score = Math.max(score, 1);
      }
    });
  }

  return score;
}

class BlueskyClient {
  constructor() {
    this.agent = new BskyAgent({
      service: BLUESKY_SERVICE,
      persistSession: (_evt, session) => {
        if (!this.rememberSession) {
          saveJSON(SESSION_STORAGE_KEY, null);
          return;
        }
        if (session) {
          saveJSON(SESSION_STORAGE_KEY, session);
        } else {
          saveJSON(SESSION_STORAGE_KEY, null);
        }
      },
    });
    this.session = null;
    this.initialized = false;
    this.subscribers = new Set();
    this.pinCache = loadJSON(PIN_STORAGE_KEY, []);
    this.rememberSession = true;
  }

  async init() {
    if (this.initialized) {
      return;
    }
    this.initialized = true;
    const storedSession = loadJSON(SESSION_STORAGE_KEY, null);
    if (storedSession) {
      try {
        await this.agent.resumeSession(storedSession);
        this.session = this.agent.session;
        this.notify();
      } catch (_err) {
        // Session is likely invalid/expired.
        saveJSON(SESSION_STORAGE_KEY, null);
      }
    }
  }

  subscribe(listener) {
    this.subscribers.add(listener);
    return () => this.subscribers.delete(listener);
  }

  notify() {
    for (const listener of this.subscribers) {
      listener({
        isAuthenticated: this.isAuthenticated(),
        session: this.session,
        pins: this.pinCache,
      });
    }
  }

  isAuthenticated() {
    return Boolean(this.session?.accessJwt);
  }

  async login(identifier, password, { remember = true } = {}) {
    this.rememberSession = Boolean(remember);
    if (!this.rememberSession) {
      saveJSON(SESSION_STORAGE_KEY, null);
    }
    await this.agent.login({ identifier, password });
    this.session = this.agent.session;
    this.notify();
    return this.session;
  }

  async logout() {
    this.rememberSession = true;
    this.session = null;
    saveJSON(SESSION_STORAGE_KEY, null);
    this.notify();
    try {
      await this.agent.logout();
    } catch (_err) {
      // Ignore network/logout errors
    }
  }

  async fetchArtFeed({
    cursor = {},
    tags = DEFAULT_TAGS,
    maxPagesPerTag = 50,
    feeds = COMMUNITY_FEEDS,
  } = {}) {
    await this.init();
    const effectiveTags = Array.isArray(tags) && tags.length ? tags : DEFAULT_TAGS;
    const merged = new Map();
    const nextCursor = {};
    const debug = {
      tags: {},
      feeds: {},
      totals: {
        processed: 0,
        accepted: 0,
        replaced: 0,
        weaker: 0,
        noImage: 0,
        langMismatch: 0,
      },
    };

    await Promise.all(
      effectiveTags.map(async (tag) => {
        let page = 0;
        let currentCursor = cursor?.[tag] || undefined;
        let hasAddedForTag = false;
        let keepPaging = true;

        while (keepPaging && page < maxPagesPerTag) {
          page += 1;
          let responseData = { posts: [], cursor: null };
          try {
            const response = await this.agent.app.bsky.feed.searchPosts({
              q: `#${tag}`,
              tag,
              limit: 30,
              cursor: currentCursor,
            });
            responseData = unwrapData(response);
          } catch (_err) {
            responseData = { posts: [], cursor: null };
          }

          const posts = Array.isArray(responseData.posts)
            ? responseData.posts
            : [];
          let addedThisPage = 0;
          posts.forEach((post) => {

            const mapped = mapPost(post);
            const stats = ensureDebugStats(debug.tags, tag);
            stats.processed += 1;
            debug.totals.processed += 1;
            if (!mapped.images.length) {
              stats.noImage += 1;
              debug.totals.noImage += 1;
              return;
            }
            if (!matchesLanguage(mapped)) {
              stats.langMismatch += 1;
              debug.totals.langMismatch += 1;
              return;
            }
            const tagScore = computeTagScore(mapped, effectiveTags);
            const existing = merged.get(mapped.uri);
            if (!existing) {
              merged.set(mapped.uri, { ...mapped, tagScore });
              addedThisPage += 1;
              stats.accepted += 1;
              debug.totals.accepted += 1;
              return;
            }
            if ((tagScore ?? 0) > (existing.tagScore ?? 0)) {
              merged.set(mapped.uri, { ...mapped, tagScore });
              addedThisPage += 1;
              stats.accepted += 1;
              stats.replaced += 1;
              debug.totals.accepted += 1;
              debug.totals.replaced += 1;
            } else {
              stats.weaker += 1;
              debug.totals.weaker += 1;
            }
          });

          hasAddedForTag = hasAddedForTag || addedThisPage > 0;
          nextCursor[tag] = responseData.cursor || null;

          if (!responseData.cursor) {
            keepPaging = false;
            break;
          }

          currentCursor = responseData.cursor;
          if (hasAddedForTag) {
            keepPaging = false;
          }
        }
      }),
    );

    await Promise.all(
      (Array.isArray(feeds) ? feeds : []).map(async (feedUri) => {
        if (!feedUri) return;
        let page = 0;
        let currentCursor = cursor?.feeds?.[feedUri] || undefined;
        let keepPaging = true;

        while (keepPaging && page < maxPagesPerTag) {
          page += 1;
          let responseData = { feed: [], cursor: null };
          try {
            const response = await this.agent.app.bsky.feed.getFeed({
              feed: feedUri,
              cursor: currentCursor,
              limit: 30,
            });
            responseData = unwrapData(response);
          } catch (_err) {
            responseData = { feed: [], cursor: null };
          }

          const items = Array.isArray(responseData.feed)
            ? responseData.feed
            : [];
          let addedThisPage = 0;
          items.forEach((item) => {
            const post = item.post ?? item;
            const mapped = mapPost(post);
            const stats = ensureDebugStats(debug.feeds, feedUri);
            stats.processed += 1;
            debug.totals.processed += 1;
            if (!mapped.images.length) {
              stats.noImage += 1;
              debug.totals.noImage += 1;
              return;
            }
            if (!matchesLanguage(mapped)) {
              stats.langMismatch += 1;
              debug.totals.langMismatch += 1;
              return;
            }
            const tagScore = computeTagScore(mapped, effectiveTags);
            const existing = merged.get(mapped.uri);
            if (!existing) {
              merged.set(mapped.uri, { ...mapped, tagScore });
              addedThisPage += 1;
              stats.accepted += 1;
              debug.totals.accepted += 1;
              return;
            }
            if ((tagScore ?? 0) > (existing.tagScore ?? 0)) {
              merged.set(mapped.uri, { ...mapped, tagScore });
              addedThisPage += 1;
              stats.accepted += 1;
              stats.replaced += 1;
              debug.totals.accepted += 1;
              debug.totals.replaced += 1;
            } else {
              stats.weaker += 1;
              debug.totals.weaker += 1;
            }
          });

          nextCursor.feeds = nextCursor.feeds || {};
          nextCursor.feeds[feedUri] = responseData.cursor || null;

          if (!responseData.cursor || addedThisPage > 0) {
            keepPaging = false;
          } else {
            currentCursor = responseData.cursor;
          }
        }
      }),
    );

    const posts = Array.from(merged.values()).sort((a, b) => {
      const scoreDiff = (b.tagScore ?? 0) - (a.tagScore ?? 0);
      if (scoreDiff !== 0) {
        return scoreDiff;
      }
      const tsA = a.indexedAt ? new Date(a.indexedAt).getTime() : 0;
      const tsB = b.indexedAt ? new Date(b.indexedAt).getTime() : 0;
      return tsB - tsA;
    });

    if (typeof console !== 'undefined') {
      console.log('[FRVArt] fetchArtFeed summary', {
        tags: effectiveTags,
        feeds,
        totals: debug.totals,
        perTag: debug.tags,
        perFeed: debug.feeds,
        resultCount: posts.length,
      });
    }

    return {
      posts,
      cursor: nextCursor,
    };
  }

  async fetchMore({ cursor, tags = DEFAULT_TAGS }) {
    return this.fetchArtFeed({ cursor, tags });
  }

  async toggleLike(post) {
    if (!this.isAuthenticated()) {
      throw new Error('AUTH_REQUIRED');
    }
    const viewer = post.viewer ?? {};
    if (viewer.like) {
      await this.agent.deleteLike(viewer.like);
      return {
        likeUri: null,
        likeCount: Math.max((post.likeCount || 1) - 1, 0),
      };
    } else {
      const response = await this.agent.like(post.uri, post.cid);
      return {
        likeUri: response.uri,
        likeCount: (post.likeCount || 0) + 1,
      };
    }
  }

  async toggleFollow(author) {
    if (!this.isAuthenticated()) {
      throw new Error('AUTH_REQUIRED');
    }
    await this.init();
    if (!author?.did) {
      throw new Error('INVALID_AUTHOR');
    }
    const viewerState = author.viewer ?? {};
    if (viewerState.following) {
      await this.agent.deleteFollow(viewerState.following);
      return {
        followingUri: null,
      };
    }
    const response = await this.agent.follow(author.did);
    return {
      followingUri: response.uri,
    };
  }

  updateLikesCache(uri, viewerUpdate) {
    const updatePin = (pin) => {
      if (pin.uri !== uri) return pin;
      return {
        ...pin,
        viewer: {
          ...(pin.viewer || {}),
          like: viewerUpdate.likeUri || undefined,
        },
        likeCount: viewerUpdate.likeCount,
      };
    };

    this.pinCache = this.pinCache.map(updatePin);
    saveJSON(PIN_STORAGE_KEY, this.pinCache);
    this.notify();
  }

  updateFollowCache(authorDid, followingUri) {
    if (!authorDid) {
      return;
    }
    const updatePin = (pin) => {
      if (pin.author?.did !== authorDid) {
        return pin;
      }
      return {
        ...pin,
        author: {
          ...pin.author,
          viewer: {
            ...(pin.author.viewer || {}),
            following: followingUri || null,
          },
        },
      };
    };
    this.pinCache = this.pinCache.map(updatePin);
    saveJSON(PIN_STORAGE_KEY, this.pinCache);
    this.notify();
  }

  getPinnedPosts() {
    return [...this.pinCache];
  }

  pinPost(post) {
    if (!post?.uri) return;
    if (this.pinCache.find((item) => item.uri === post.uri)) {
      return;
    }
    const cloned = {
      ...post,
      author: {
        ...(post.author || {}),
        viewer: { ...(post.author?.viewer || {}) },
      },
      images: Array.isArray(post.images) ? [...post.images] : [],
      viewer: { ...(post.viewer || {}) },
      tags: Array.isArray(post.tags) ? [...post.tags] : [],
      langs: Array.isArray(post.langs) ? [...post.langs] : [],
      tagScore: post.tagScore ?? 0,
    };
    this.pinCache = [cloned, ...this.pinCache].slice(0, 50);
    saveJSON(PIN_STORAGE_KEY, this.pinCache);
    this.notify();
  }

  unpinPost(uri) {
    this.pinCache = this.pinCache.filter((item) => item.uri !== uri);
    saveJSON(PIN_STORAGE_KEY, this.pinCache);
    this.notify();
  }

  async fetchComments(uri, { depth = 1 } = {}) {
    if (!uri) {
      return { root: null, comments: [] };
    }
    await this.init();
    try {
      const response = await this.agent.app.bsky.feed.getPostThread({
        uri,
        depth: Math.max(depth, 1) + 1,
        parentHeight: 0,
      });
      const data = unwrapData(response);
      const thread = data.thread ?? data;
      if (!thread?.post) {
        return { root: null, comments: [] };
      }
      const root = mapPost(thread.post ?? thread);
      const comments = [];
      const traverse = (nodes, level) => {
        if (!Array.isArray(nodes)) {
          return;
        }
        nodes.forEach((node) => {
          if (!node?.post) {
            return;
          }
          const mapped = mapPost(node.post);
          mapped.replyLevel = level;
          mapped.replies = node.replies?.length ?? 0;
          comments.push(mapped);
          if (level < depth) {
            traverse(node.replies, level + 1);
          }
        });
      };
      traverse(thread.replies, 1);
      return { root, comments };
    } catch (err) {
      console.error('[FRVArt] Unable to fetch comments', err);
      throw err;
    }
  }
}

const blueskyClient = new BlueskyClient();

export default blueskyClient;
