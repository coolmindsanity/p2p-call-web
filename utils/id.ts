const adjectives = [
  'quick', 'happy', 'bright', 'calm', 'brave', 'eager', 'fancy', 'giant', 
  'jolly', 'kind', 'lively', 'magic', 'noble', 'proud', 'silly', 'sunny',
  'tiny', 'wise', 'zesty', 'vivid'
];
const nouns = [
  'river', 'ocean', 'cloud', 'forest', 'meadow', 'comet', 'star', 'dream',
  'wave', 'glade', 'haven', 'light', 'peak', 'spirit', 'storm', 'stream',
  'world', 'vista', 'zephyr', 'echo'
];
const verbs = [
  'sings', 'dances', 'jumps', 'flies', 'runs', 'glows', 'shines', 'soars',
  'glides', 'floats', 'beams', 'drifts', 'wanders', 'rises', 'falls', 'spins',
  'weaves', 'blooms', 'thrives', 'starts'
];

/**
 * Generates a random, human-readable ID in the format "adjective-noun-verb".
 * Example: "happy-river-sings"
 */
export const generateCallId = (): string => {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const verb = verbs[Math.floor(Math.random() * verbs.length)];
  return `${adj}-${noun}-${verb}`;
};

/**
 * A simple RFC4122 version 4 compliant UUID generator.
 * This is used to create a unique anonymous ID for each user without
 * requiring external dependencies.
 */
export const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};
