/*
 * Coinstash brand tokens + curated themes.
 * Source of truth: https://design.coinstash.com.au (extracted Sep 2026).
 * Keep this file as the single place brand values live.
 */
window.COINSTASH = window.COINSTASH || {};

// Exact palette from the Coinstash design system.
COINSTASH.colors = {
  purpleBright: '#5C5BD5', // PMS 2097 — primary brand
  purpleDark:   '#373184',
  purpleLight:  '#BFBEFF',
  coral:        '#FF7262',
  mintGreen:    '#B2FFBE',
  pine:         '#527658',
  umber:        '#C46751',
  coolGreyLight:'#EAEBF6',
  coolGreyDark: '#9B9A9E',
  black:        '#000000',
  white:        '#FFFFFF',
  // Derived shades used for reel backgrounds (not in the guide, tuned for contrast).
  indigoDeep:   '#151235',
  indigoMid:    '#241F55'
};

/*
 * Reel themes. Each theme sets the stage background plus line/text colours.
 * `btc` = the Bitcoin (hero) series, `asset` = the compared asset.
 * Colours are chosen for high contrast on the given background.
 */
COINSTASH.themes = {
  purple: {
    label: 'Coinstash Purple',
    bgFrom: COINSTASH.colors.indigoDeep,
    bgTo:   COINSTASH.colors.purpleDark,
    text:   COINSTASH.colors.white,
    subtext:'#C9C7F0',
    grid:   'rgba(255,255,255,0.10)',
    axis:   'rgba(255,255,255,0.55)',
    btc:    COINSTASH.colors.purpleLight,
    asset:  COINSTASH.colors.coral,
    logo:   'white'
  },
  light: {
    label: 'Cool Grey Light',
    bgFrom: '#FFFFFF',
    bgTo:   COINSTASH.colors.coolGreyLight,
    text:   COINSTASH.colors.purpleDark,
    subtext:'#5A5680',
    grid:   'rgba(55,49,132,0.12)',
    axis:   'rgba(55,49,132,0.45)',
    btc:    COINSTASH.colors.purpleBright,
    asset:  COINSTASH.colors.coral,
    logo:   'black'
  },
  midnight: {
    label: 'Midnight',
    bgFrom: '#000000',
    bgTo:   '#141225',
    text:   COINSTASH.colors.white,
    subtext:'#B9B7D8',
    grid:   'rgba(255,255,255,0.09)',
    axis:   'rgba(255,255,255,0.5)',
    btc:    COINSTASH.colors.mintGreen,
    asset:  COINSTASH.colors.coral,
    logo:   'white'
  }
};

/*
 * Preset datasets. Bitcoin is the shared hero series (normalised index, start = 100).
 * These three come from the supplied source data (11 observations each, no dates).
 * Add more presets here as you gather the numbers.
 */
COINSTASH.BITCOIN = [100, 682, 1316, 1400, 2078, 8282, 5253, 5700, 13128, 20622, 13496];

COINSTASH.presets = [
  {
    id: 'apple',
    name: 'Apple',
    asset: [100, 147, 187, 209, 388, 577, 637, 714, 862, 971, 1197]
  },
  {
    id: 'amd',
    name: 'AMD',
    asset: [100, 236, 328, 570, 1250, 1927, 1731, 1962, 3003, 2905, 6921]
  }
];

// Inline logo markup (kept as <img> refs in the app, but paths centralised here).
COINSTASH.logoPaths = {
  white: 'assets/brand/coinstash-horizontal-white.svg',
  black: 'assets/brand/coinstash-horizontal-black.svg',
  stacked: 'assets/brand/coinstash-stacked.svg'
};
