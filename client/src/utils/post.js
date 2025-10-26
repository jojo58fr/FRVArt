export const buildPostLink = (post) => {
  if (!post?.uri) {
    return 'https://bsky.app/';
  }
  const handle = post.author?.handle;
  if (!handle) {
    return 'https://bsky.app/';
  }
  const segments = post.uri.split('/');
  const rkey = segments[segments.length - 1];
  return `https://bsky.app/profile/${handle}/post/${rkey}`;
};
