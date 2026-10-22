import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeHex, themeColor, themeMode, createPalette, contrastRatio, applyTheme, hexToHsl, hslToHex, THEMES, DEFAULT_THEME } from '../src/theme.ts';

test('custom colors accept short and full hex and reject invalid stored values', () => {
  assert.equal(normalizeHex(' #AbC '), '#aabbcc');
  assert.equal(normalizeHex('aBc123'), '#abc123');
  for (const invalid of [undefined, null, {}, 123, '', '#12', '#1234', '#12345678', 'blue', '#gggggg', 'red; color: red']) {
    assert.equal(normalizeHex(invalid), null);
    assert.equal(themeColor(invalid), DEFAULT_THEME);
  }
});

const samples = [...THEMES.map(theme => theme.color), '#ffffff', '#000000', '#777777'];
// Cover bright primaries, low saturation, and the hue/lightness extremes
// that tend to break palettes derived from arbitrary user colors.
for (const r of ['00', '33', '88', 'cc', 'ff']) {
  for (const g of ['00', '33', '88', 'cc', 'ff']) {
    for (const b of ['00', '33', '88', 'cc', 'ff']) samples.push(`#${r}${g}${b}`);
  }
}
test('picker conversion preserves hex colors and handles hue endpoints', () => {
  for (const color of samples) assert.equal(hslToHex(...hexToHsl(color)), color);
  assert.equal(hslToHex(0, 1, 0.5), '#ff0000');
  assert.equal(hslToHex(360, 1, 0.5), '#ff0000');
  assert.equal(hslToHex(120, 1, 0.5), '#00ff00');
  assert.equal(hslToHex(240, 1, 0.5), '#0000ff');
});
for (const mode of ['light', 'dark']) test(`the exact chosen background has readable text and controls in ${mode} mode`, () => {
  for (const seed of samples) {
    const palette = createPalette(seed, mode);
    assert.equal(palette.bg, seed);
    for (const background of ['bg', 'surface', 'pale']) {
      const prefix = background === 'bg' ? '' : `${background}-`;
      for (const foreground of ['text', 'muted', 'accent', 'warning']) {
        assert.ok(contrastRatio(palette[`${prefix}${foreground}`], palette[background]) >= 4.5, `${seed}: ${foreground} on ${background}`);
      }
      for (const state of ['accent', 'accent-hover']) {
        assert.ok(contrastRatio(palette[`${prefix}on-accent`], palette[`${prefix}${state}`]) >= 4.5, `${seed}: button text on ${prefix}${state}`);
      }
      assert.ok(contrastRatio(palette[`${prefix}error`], palette[`${prefix}error-bg`]) >= 4.5, `${seed}: error text on ${background}`);
      assert.ok(contrastRatio(palette[`${prefix}focus`], palette[background]) >= 3, `${seed}: focus ring on ${background}`);
    }
    assert.ok(contrastRatio(palette['on-destructive'], palette.destructive) >= 4.5, `${seed}: destructive button`);
  }
});

for (const mode of ['light', 'dark']) test(`applying a ${mode} theme updates every color and chooses the canvas appearance from the background`, () => {
  const values = new Map();
  applyTheme('#abc', mode, { style: { setProperty(name, value) { values.set(name, value); } } });
  const { scheme, ...palette } = createPalette('#aabbcc', mode);
  assert.equal(values.get('color-scheme'), scheme);
  for (const [name, value] of Object.entries(palette)) {
    assert.equal(values.get(`--${name}`), value);
  }
  assert.equal(createPalette('#fff').bg, '#ffffff');
  assert.equal(createPalette('#fff').scheme, 'light');
  assert.equal(createPalette('#000').scheme, 'dark');
  assert.equal(createPalette('#777777').scheme, 'light');
  assert.equal(createPalette('#737373').scheme, 'dark');
  assert.notEqual(createPalette('#2563eb').surface, createPalette('#be185d').surface);
});

test('mode defaults to light and controls surface brightness independently of the canvas', () => {
  assert.equal(themeMode('dark'), 'dark');
  for (const value of [undefined, null, {}, 'light', 'auto', 'DARK']) assert.equal(themeMode(value), 'light');
  for (const seed of samples) {
    const light = createPalette(seed, 'light'), dark = createPalette(seed, 'dark');
    assert.deepEqual(createPalette(seed), light);
    assert.equal(light.bg, dark.bg);
    assert.equal(light['surface-scheme'], 'light');
    assert.equal(dark['surface-scheme'], 'dark');
    for (const surface of ['surface', 'pale']) {
      assert.ok(hexToHsl(light[surface])[2] >= 0.85);
      assert.ok(hexToHsl(dark[surface])[2] <= 0.14);
    }
  }
});
