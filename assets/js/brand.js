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

/*
 * Preset comparisons. Each is one or more named series, all indexed to 100 at
 * the first observation. Optional per-preset fields:
 *   subtitle  — overrides the subtitle field
 *   startYear — first year on the x-axis; also switches X-axis to Year
 *   scale     — 'linear' | 'log'
 * Optional per-series field:
 *   invert    — mirror the series below the baseline (a running cost)
 *
 * IMPORTANT: series are trimmed to the shortest series, so every series in a
 * preset must start at the same year. Presets based after 2016 (altcoins 2018,
 * lego 2017) are kept separate for this reason.
 */
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
  },

  /* ── Everyday Australia ─────────────────────────────────────────────── */
  {
    id: 'everyday-aus', title: 'Bitcoin vs Everyday Australia',
    subtitle: '% increase since 2016 · indexed to 100',
    startYear: 2016, scale: 'log',
    series: [
      { name: 'Bitcoin',       values: COINSTASH.BITCOIN.slice() },
      { name: 'House deposit', values: [100, 106, 112, 118, 125, 132, 139, 147, 155, 164, 173] },
      { name: 'Speeding fine', values: [100, 104, 107, 110, 110, 113, 118, 127, 132, 137, 142] },
      { name: 'Tim Tams',      values: [100, 99, 101, 105, 106, 107, 116, 130, 135, 137, 139] },
      { name: 'Schooner',      values: [100, 103, 108, 110, 112, 114, 117, 124, 131, 136, 138] },
      { name: 'Smashed avo',   values: [100, 102, 104, 105, 108, 110, 115, 122, 126, 130, 134] }
    ]
  },
  {
    id: 'house-deposit', title: 'Bitcoin vs a House Deposit',
    subtitle: '20% deposit, national mean dwelling · indexed to 100',
    startYear: 2016, scale: 'log',
    series: [
      { name: 'Bitcoin',       values: COINSTASH.BITCOIN.slice() },
      { name: 'House deposit', values: [100, 106, 112, 118, 125, 132, 139, 147, 155, 164, 173] }
    ]
  },
  {
    id: 'bus-fare', title: 'Bitcoin vs the 50c Bus Fare',
    subtitle: 'Brisbane fares went the other way',
    startYear: 2016, scale: 'log',
    series: [
      { name: 'Bitcoin',  values: COINSTASH.BITCOIN.slice() },
      { name: 'Bus fare', values: [100, 100, 100, 100, 100, 100, 100, 100, 58, 15, 15] }
    ]
  },
  {
    id: 'smashed-avo', title: 'Bitcoin vs Smashed Avo',
    subtitle: 'Since the $22 brunch column, October 2016',
    startYear: 2016, scale: 'log',
    series: [
      { name: 'Bitcoin',     values: COINSTASH.BITCOIN.slice() },
      { name: 'Smashed avo', values: [100, 102, 104, 105, 108, 110, 115, 122, 126, 130, 134] }
    ]
  },
  {
    id: 'netflix', title: 'Bitcoin vs Netflix',
    subtitle: 'Netflix AU Premium plan · indexed to 100',
    startYear: 2016, scale: 'log',
    series: [
      { name: 'Bitcoin', values: COINSTASH.BITCOIN.slice() },
      { name: 'Netflix', values: [100, 120, 120, 133, 133, 153, 153, 153, 153, 193, 193] }
    ]
  },
  {
    id: 'snag-running-cost', title: 'A Snag a Week vs Buying Bitcoin',
    subtitle: 'Same money, two destinations · 558 Saturdays',
    startYear: 2016, scale: 'log',
    series: [
      { name: 'Bitcoin bought', values: [184, 3170, 985, 2010, 7638, 13028, 5052, 13095, 32099, 27994, 23295] },
      { name: 'Spent on snags', values: [100, 198, 296, 394, 493, 591, 709, 846, 983, 1121, 1216], invert: true }
    ]
  },

  /* ── Crypto ──────────────────────────────────────────────────────────── */
  {
    id: 'altcoins', title: 'Bitcoin vs the Altcoins',
    subtitle: '% increase since 2018 · indexed to 100',
    startYear: 2018, scale: 'log',
    series: [
      { name: 'Bitcoin',   values: [100, 106, 158, 629, 399, 433, 997, 1567, 1025] },
      { name: 'Ethereum',  values: [100, 41, 69, 588, 445, 426, 729, 747, 487] },
      { name: 'XRP',       values: [100, 51, 42, 132, 84, 88, 129, 441, 224] },
      { name: 'Cardano',   values: [100, 29, 45, 736, 333, 191, 295, 405, 127] },
      { name: 'Dogecoin',  values: [100, 64, 68, 4729, 2418, 1949, 4305, 5649, 2337] },
      { name: 'Chainlink', values: [100, 411, 1929, 6520, 2707, 2290, 4319, 4903, 2488] }
    ]
  },
  {
    id: 'stablecoin', title: 'Bitcoin vs Tether',
    subtitle: 'The most-traded crypto in the world',
    startYear: 2018, scale: 'log',
    series: [
      { name: 'Bitcoin', values: [100, 106, 158, 629, 399, 433, 997, 1567, 1025] },
      { name: 'Tether',  values: [100, 108, 109, 100, 108, 112, 113, 116, 106] }
    ]
  },

  /* ── Stocks & benchmarks ─────────────────────────────────────────────── */
  {
    id: 'chip-makers', title: 'Bitcoin vs the Chip Makers',
    subtitle: '% increase since 2016 · total return',
    startYear: 2016, scale: 'log',
    series: [
      { name: 'Nvidia',   values: [100, 280, 436, 329, 747, 1476, 1405, 2768, 8165, 11658, 15106] },
      { name: 'Bitcoin',  values: COINSTASH.BITCOIN.slice() },
      { name: 'AMD',      values: [100, 236, 328, 570, 1249, 1925, 1730, 1961, 3000, 2902, 6914] },
      { name: 'Micron',   values: [100, 227, 336, 300, 367, 569, 471, 473, 761, 995, 4850] },
      { name: 'Broadcom', values: [100, 153, 160, 200, 235, 373, 420, 627, 1244, 2263, 3072] },
      { name: 'TSMC',     values: [100, 138, 162, 182, 301, 522, 406, 426, 746, 1086, 1843] }
    ]
  },
  {
    id: 'aus-blue-chips', title: 'Bitcoin vs Australian Blue Chips',
    subtitle: '% increase since 2016 · total return',
    startYear: 2016, scale: 'log',
    series: [
      { name: 'Bitcoin', values: COINSTASH.BITCOIN.slice() },
      { name: 'BHP',     values: [100, 134, 176, 228, 235, 311, 365, 434, 432, 425, 617] },
      { name: 'CBA',     values: [100, 113, 107, 121, 117, 163, 176, 187, 249, 326, 338] },
      { name: 'Telstra', values: [100, 84, 67, 80, 77, 91, 104, 112, 110, 139, 157] },
      { name: 'CSL',     values: [100, 125, 176, 220, 295, 288, 283, 286, 302, 246, 149] },
      { name: 'ASX 200', values: [100, 110, 114, 122, 116, 136, 134, 137, 150, 161, 168] }
    ]
  },
  {
    id: 'super-fund', title: 'Bitcoin vs Your Super Fund',
    subtitle: '% increase since 2016 · total return',
    startYear: 2016, scale: 'log',
    series: [
      { name: 'Bitcoin', values: COINSTASH.BITCOIN.slice() },
      { name: 'Gold',    values: [100, 101, 101, 111, 142, 144, 144, 156, 191, 276, 365] },
      { name: 'S&P 500', values: [100, 117, 131, 139, 154, 204, 196, 205, 259, 297, 344] },
      { name: 'ASX 200', values: [100, 110, 114, 122, 116, 136, 134, 137, 150, 161, 168] }
    ]
  },

  /* ── Collectibles ────────────────────────────────────────────────────── */
  {
    id: 'collectibles', title: 'Bitcoin vs Collectibles',
    subtitle: 'Contains modelled years — see README',
    startYear: 2016, scale: 'log',
    series: [
      { name: 'Bitcoin',    values: COINSTASH.BITCOIN.slice() },
      { name: 'Charizard',  values: [100, 108, 122, 155, 612, 2019, 1965, 2488, 2505, 2814, 2940] },
      { name: 'R34 GT-R',   values: [100, 117, 167, 179, 256, 342, 401, 461, 661, 476, 523] },
      { name: 'Honda NSX',  values: [100, 104, 108, 113, 135, 174, 184, 122, 130, 138, 149] }
    ]
  },
  {
    id: 'lego', title: 'Bitcoin vs LEGO',
    subtitle: 'UCS Millennium Falcon 75192, from its 2017 launch',
    startYear: 2017, scale: 'log',
    series: [
      { name: 'Bitcoin', values: [100, 193, 205, 305, 1214, 770, 836, 1925, 3024, 1979] },
      { name: 'LEGO',    values: [100, 104, 108, 112, 116, 120, 109, 99, 90, 82] }
    ]
  }
];

COINSTASH.logoPaths = { white: 'assets/brand/coinstash-horizontal-white.svg', black: 'assets/brand/coinstash-horizontal-black.svg' };
