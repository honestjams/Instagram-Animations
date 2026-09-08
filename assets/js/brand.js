/*
 * Coinstash brand tokens, reel themes, and preset datasets.
 * Source of truth: https://design.coinstash.com.au (extracted Sep 2026).
 */
window.COINSTASH = window.COINSTASH || {};

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
  indigoDeep:   '#151235',
  indigoMid:    '#241F55'
};
const C = COINSTASH.colors;

/*
 * Reel themes. `palette` is the ordered line-colour cycle (index 0 = hero /
 * Bitcoin). Colours are picked for contrast on that theme's background.
 */
COINSTASH.themes = {
  purple: {
    label: 'Coinstash Purple',
    bgFrom: C.indigoDeep, bgTo: C.purpleDark,
    text: C.white, subtext: '#C9C7F0',
    grid: 'rgba(255,255,255,0.10)', axis: 'rgba(255,255,255,0.60)',
    pill: 'rgba(12,10,40,0.72)', logo: 'white',
    palette: [C.purpleLight, C.coral, C.mintGreen, C.white, C.umber, C.coolGreyDark]
  },
  light: {
    label: 'Cool Grey Light',
    bgFrom: '#FFFFFF', bgTo: C.coolGreyLight,
    text: C.purpleDark, subtext: '#5A5680',
    grid: 'rgba(55,49,132,0.12)', axis: 'rgba(55,49,132,0.55)',
    pill: 'rgba(255,255,255,0.82)', logo: 'black',
    palette: [C.purpleBright, C.coral, C.pine, C.umber, C.purpleDark, C.coolGreyDark]
  },
  midnight: {
    label: 'Midnight',
    bgFrom: '#000000', bgTo: '#141225',
    text: C.white, subtext: '#B9B7D8',
    grid: 'rgba(255,255,255,0.09)', axis: 'rgba(255,255,255,0.55)',
    pill: 'rgba(0,0,0,0.72)', logo: 'white',
    palette: [C.mintGreen, C.coral, C.purpleLight, C.white, C.umber, C.coolGreyDark]
  }
};

// Shared Bitcoin (hero) series — normalised index, start = 100.
COINSTASH.BITCOIN = [100, 682, 1316, 1400, 2078, 8282, 5253, 5700, 13128, 20622, 13496];

// Preset comparisons. Each is one or more named series (all indexed to 100).
COINSTASH.presets = [
  {
    id: 'apple', title: 'Bitcoin vs Apple',
    series: [
      { name: 'Bitcoin', values: COINSTASH.BITCOIN.slice() },
      { name: 'Apple',   values: [100, 147, 187, 209, 388, 577, 637, 714, 862, 971, 1197] }
    ]
  },
  {
    id: 'amd', title: 'Bitcoin vs AMD',
    series: [
      { name: 'Bitcoin', values: COINSTASH.BITCOIN.slice() },
      { name: 'AMD',     values: [100, 236, 328, 570, 1250, 1927, 1731, 1962, 3003, 2905, 6921] }
    ]
  },
  {
    id: 'tech', title: 'Bitcoin vs Big Tech',
    series: [
      { name: 'Bitcoin', values: COINSTASH.BITCOIN.slice() },
      { name: 'AMD',     values: [100, 236, 328, 570, 1250, 1927, 1731, 1962, 3003, 2905, 6921] },
      { name: 'Apple',   values: [100, 147, 187, 209, 388, 577, 637, 714, 862, 971, 1197] }
    ]
  }
];

COINSTASH.logoPaths = { white: 'assets/brand/coinstash-horizontal-white.svg', black: 'assets/brand/coinstash-horizontal-black.svg' };
