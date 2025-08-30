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
