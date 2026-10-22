export const THEME_SETTING_KEY = 'themeColor';
export const THEME_MODE_SETTING_KEY = 'themeMode';
export type ThemeMode = 'light' | 'dark';
export function themeMode(value: unknown): ThemeMode {
  return value === 'dark' ? 'dark' : 'light';
}
export const THEMES: { name: string; color: string; mode: ThemeMode }[] = [
  { name: 'Mint', color: '#e8f3ed', mode: 'light' },
  { name: 'Sky', color: '#e8f0fc', mode: 'light' },
  { name: 'Lavender', color: '#f0eafb', mode: 'light' },
  { name: 'Blush', color: '#fbecef', mode: 'light' },
  { name: 'Sand', color: '#f7efdf', mode: 'light' },
  { name: 'Mist', color: '#edf0f3', mode: 'light' },
  { name: 'Forest', color: '#102820', mode: 'dark' },
  { name: 'Midnight', color: '#111f36', mode: 'dark' },
  { name: 'Plum', color: '#241a35', mode: 'dark' },
  { name: 'Wine', color: '#321c26', mode: 'dark' },
  { name: 'Bronze', color: '#302519', mode: 'dark' },
  { name: 'Graphite', color: '#1d232b', mode: 'dark' },
];
export const THEME_GROUPS = (['light', 'dark'] as const).map(mode => ({
  mode,
  label: mode === 'light' ? 'Light themes' : 'Dark themes',
  themes: THEMES.filter(theme => theme.mode === mode),
}));
export const DEFAULT_THEME = THEMES[0].color;

export function normalizeHex(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const hex = value.trim().replace(/^#/, '');
  if (/^[\da-f]{3}$/i.test(hex)) return `#${[...hex].map(char => char + char).join('').toLowerCase()}`;
  return /^[\da-f]{6}$/i.test(hex) ? `#${hex.toLowerCase()}` : null;
}

export function themeColor(value: unknown): string {
  return normalizeHex(value) ?? DEFAULT_THEME;
}

type RGB = [number, number, number];
function rgb(hex: string): RGB {
  return [1, 3, 5].map(offset => parseInt(hex.slice(offset, offset + 2), 16) / 255) as RGB;
}
export function hexToHsl(hex: string): [number, number, number] {
  const [r, g, b] = rgb(hex), max = Math.max(r, g, b), min = Math.min(r, g, b);
  const delta = max - min, lightness = (max + min) / 2;
  if (!delta) return [0, 0, lightness];
  const hue = max === r ? ((g - b) / delta + 6) % 6 : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
  return [hue * 60, delta / (1 - Math.abs(2 * lightness - 1)), lightness];
}
export function hslToHex(hue: number, saturation: number, lightness: number): string {
  const a = saturation * Math.min(lightness, 1 - lightness);
  return `#${[0, 8, 4].map(n => {
    const k = (n + hue / 30) % 12;
    const channel = lightness - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(channel * 255).toString(16).padStart(2, '0');
  }).join('')}`;
}
function luminance(hex: string): number {
  const channels = rgb(hex).map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}
export function contrastRatio(first: string, second: string): number {
  const a = luminance(first), b = luminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

// Keep the canvas exact; cards/inputs are nearly white or nearly black,
// with badges retaining a little more of the selected color.
// Each surface gets its own foregrounds so arbitrary custom colors remain
// readable even when a lighter card needs darker text than the canvas.
export function createPalette(seed: string, mode: ThemeMode = 'light') {
  const bg = themeColor(seed);
  const [hue, saturation] = hexToHsl(bg);
  const tint = (level: number, strength = 1) => hslToHex(hue, Math.min(saturation * strength, 0.85), level);
  const lighten = (amount: number) => `#${rgb(bg).map(channel =>
    Math.round((channel + (1 - channel) * amount) * 255).toString(16).padStart(2, '0')).join('')}`;
  const surface = mode === 'dark' ? tint(0.07, 0.25) : lighten(0.94);
  const pale = mode === 'dark' ? tint(0.13, 0.35) : lighten(0.86);
  const errorHue = 5 + Math.sin(hue * Math.PI / 180) * 5;
  const warningHue = 38 + Math.sin(hue * Math.PI / 180) * 6;
  function foregrounds(background: string) {
    const dark = contrastRatio(background, '#ffffff') >= contrastRatio(background, '#000000');
    const readable = (color: string, backgrounds = [background], ratio = 4.5) => {
      const [h, s, l] = hexToHsl(color);
      for (let step = 0; step <= 100; step++) {
        const candidate = hslToHex(h, s, l + ((dark ? 1 : 0) - l) * step / 100);
        if (backgrounds.every(value => contrastRatio(candidate, value) >= ratio)) return candidate;
      }
      return dark ? '#ffffff' : '#000000';
    };
    const accent = readable(tint(dark ? 0.80 : 0.24));
    const onAccent = contrastRatio(accent, '#ffffff') >= 4.5 ? '#ffffff' : '#000000';
    const [accentHue, accentSaturation, accentLightness] = hexToHsl(accent);
    // Preserve recognizable warning/destructive colors with themed warmth.
    const errorBg = hslToHex(errorHue, 0.30 + saturation * 0.1, dark ? 0.12 : 0.95);
    return {
      scheme: dark ? 'dark' : 'light',
      text: readable(tint(dark ? 0.96 : 0.08, 0.25)),
      muted: readable(tint(dark ? 0.78 : 0.30, 0.22)),
      accent,
      'on-accent': onAccent,
      'accent-hover': hslToHex(accentHue, accentSaturation, onAccent === '#ffffff' ? accentLightness * 0.85 : accentLightness + (1 - accentLightness) * 0.15),
      focus: readable(tint(dark ? 0.82 : 0.28), [background], 3),
      line: tint(dark ? 0.64 : 0.84, dark ? 0.25 : 0.18),
      error: readable(hslToHex(errorHue, 0.55 + saturation * 0.15, dark ? 0.85 : 0.26), [background, errorBg]),
      'error-bg': errorBg,
      warning: readable(hslToHex(warningHue, 0.6 + saturation * 0.15, dark ? 0.82 : 0.26)),
    };
  }
  const prefix = (name: string, colors: ReturnType<typeof foregrounds>) =>
    Object.fromEntries(Object.entries(colors).map(([token, value]) => [`${name}-${token}`, value]));
  return {
    bg, surface, pale,
    ...foregrounds(bg),
    ...prefix('surface', foregrounds(surface)),
    ...prefix('pale', foregrounds(pale)),
    destructive: hslToHex(errorHue, 0.6 + saturation * 0.1, 0.34),
    'on-destructive': '#ffffff',
    backdrop: `${tint(0.10, 0.3)}80`,
    shadow: `${tint(0.10, 0.35)}30`,
  };
}

export function applyTheme(seed: string, mode: ThemeMode = 'light', root = document.documentElement) {
  const { scheme, ...colors } = createPalette(seed, mode);
  root.style.setProperty('color-scheme', scheme);
  for (const [name, value] of Object.entries(colors)) root.style.setProperty(`--${name}`, value);
}
