const SCALES: Record<string, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  pentatonic: [0, 2, 4, 7, 9]
};

export type MelodySettings = {
  key: string;
  scale: keyof typeof SCALES;
  lowOctave: number;
  highOctave: number;
};

const semitoneFromKey = (key: string): number => {
  const map: Record<string, number> = {
    C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11
  };
  return map[key] ?? 0;
};

const hash = (input: string): number => {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0);
};

export const generateMelody = (text: string, settings: MelodySettings) => {
  const words = text.split(/\s+/).filter(Boolean);
  const seed = hash(`${text}|${JSON.stringify(settings)}`);
  const base = semitoneFromKey(settings.key);
  const scale = SCALES[settings.scale];
  const octaves = Math.max(1, settings.highOctave - settings.lowOctave + 1);

  return words.map((word, i) => {
    const v = (seed + i * 31 + word.length * 13) % (scale.length * octaves);
    const degree = scale[v % scale.length];
    const octave = settings.lowOctave + Math.floor(v / scale.length);
    const midi = 12 * (octave + 1) + base + degree;
    const punct = /[,.!?;:]$/.test(word) ? 0.2 : 0;
    const duration = Math.max(0.18, Math.min(0.8, 0.18 + word.length * 0.03 + punct));
    return { word, midi, duration };
  });
};
