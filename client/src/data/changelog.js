import changelogRaw from '../../CHANGELOG.md?raw';

const normalizeLineBreaks = (text) => text.replace(/\r\n/g, '\n').trim();

const parseChangelog = (source) => {
  const normalized = normalizeLineBreaks(source);
  const pattern = /^## \[(.+?)\]\s*-\s*(.+?)\s*\n([\s\S]*?)(?=^## |\Z)/gm;
  const entries = [];
  pattern.lastIndex = 0;
  let match;
  // Iterate over each changelog section
  // eslint-disable-next-line no-cond-assign
  while ((match = pattern.exec(normalized)) !== null) {
    const [, version, date, body] = match;
    const changes = body
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.startsWith('- '))
      .map((line) => line.replace(/^-+\s*/, '').trim());
    if (changes.length) {
      entries.push({
        version: version.trim(),
        date: date.trim(),
        changes,
      });
    }
  }
  return entries;
};

const entries = parseChangelog(changelogRaw);

export const latestVersion = entries.length ? entries[0].version : '0.0.0';

export default entries;
