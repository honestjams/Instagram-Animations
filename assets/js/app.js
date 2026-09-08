/*
 * App wiring: reads the editor form, drives the ReelChart, handles presets,
 * record mode (chrome-free stage + optional countdown), and fullscreen.
 */
(function () {
  const $ = sel => document.querySelector(sel);
  const colors = COINSTASH.colors;

  const chart = new ReelChart($('#stage-svg'));

  // ---- populate preset dropdown ----
  const presetSel = $('#preset');
  COINSTASH.presets.forEach(p => {
    const o = document.createElement('option');
    o.value = p.id; o.textContent = 'Bitcoin vs ' + p.name;
    presetSel.append(o);
  });
  const customOpt = document.createElement('option');
  customOpt.value = 'custom'; customOpt.textContent = 'Custom (enter your own)';
  presetSel.append(customOpt);

  // ---- populate theme dropdown ----
  const themeSel = $('#theme');
  Object.entries(COINSTASH.themes).forEach(([k, t]) => {
    const o = document.createElement('option');
    o.value = k; o.textContent = t.label;
    themeSel.append(o);
  });

  function parseSeries(str) {
    return str.split(/[\s,]+/).map(s => s.trim()).filter(Boolean).map(Number).filter(n => !isNaN(n));
  }

  // Build the config object from the current form state and (re)render.
  function build() {
    const btc = parseSeries($('#btc-data').value);
    const asset = parseSeries($('#asset-data').value);
    if (btc.length < 2 || asset.length < 2) return null;
    // Series must be equal length; trim to the shorter one.
    const n = Math.min(btc.length, asset.length);
    const cfg = {
      bitcoin: btc.slice(0, n),
      asset: asset.slice(0, n),
      assetName: $('#asset-name').value || 'Asset',
      title: $('#title').value,
      subtitle: $('#subtitle').value,
      theme: COINSTASH.themes[themeSel.value],
      scale: $('#scale').value,
      xMode: $('#xmode').value,
      startYear: parseInt($('#start-year').value, 10) || 2015,
      baseInvest: parseFloat($('#base-invest').value) || 100,
      showMoney: $('#value-mode').value === 'money',
      duration: (parseFloat($('#duration').value) || 5.2) * 1000,
      handle: $('#handle').value || '@coinstash',
      disclaimer: $('#disclaimer').value
    };
    chart.setConfig(cfg);
    chart.render();
    applyStageBg(cfg.theme);
    return cfg;
  }

  function applyStageBg(theme) {
    // Match the export wrapper + logo to the theme.
    const logo = $('#stage-logo');
    logo.src = COINSTASH.logoPaths[theme.logo];
  }

  // ---- preset selection ----
  function loadPreset(id) {
    if (id === 'custom') { $('#value-source').hidden = false; return; }
    const p = COINSTASH.presets.find(x => x.id === id);
    if (!p) return;
    $('#btc-data').value = COINSTASH.BITCOIN.join(', ');
    $('#asset-data').value = p.asset.join(', ');
    $('#asset-name').value = p.name;
    $('#title').value = 'Bitcoin vs ' + p.name;
    build();
  }

  presetSel.addEventListener('change', () => loadPreset(presetSel.value));

  // ---- live rebuild on any input ----
  document.querySelectorAll('.control input, .control select, .control textarea')
    .forEach(elm => elm.addEventListener('input', () => build()));

  // year-mode toggle shows the start-year field
  $('#xmode').addEventListener('change', () => {
    $('#year-row').hidden = $('#xmode').value !== 'year';
  });
  // money-mode toggle shows base-invest
  $('#value-mode').addEventListener('change', () => {
    $('#invest-row').hidden = $('#value-mode').value !== 'money';
  });

  // ---- playback ----
  const statusEl = $('#status');
  function play() {
    const cfg = build();
    if (!cfg) { statusEl.textContent = 'Enter at least 2 values per series.'; return; }
    statusEl.textContent = 'Playing…';
    chart.play(() => { statusEl.textContent = 'Done — press Replay or record.'; });
  }
  $('#play').addEventListener('click', play);

  // ---- record mode: hide chrome, center the 9:16 stage ----
  const body = document.body;
  $('#record').addEventListener('click', () => {
    body.classList.add('record-mode');
    const doIt = () => play();
    if ($('#countdown-on').checked) runCountdown(doIt); else doIt();
  });
  $('#exit-record').addEventListener('click', () => {
    body.classList.remove('record-mode');
    chart.stop();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && body.classList.contains('record-mode')) {
      body.classList.remove('record-mode'); chart.stop();
    }
    if (e.key === ' ' && body.classList.contains('record-mode')) {
      e.preventDefault(); play();
    }
  });

  // ---- fullscreen the stage ----
  $('#fullscreen').addEventListener('click', () => {
    const stage = $('#stage-wrap');
    if (!document.fullscreenElement) stage.requestFullscreen && stage.requestFullscreen();
    else document.exitFullscreen && document.exitFullscreen();
  });

  function runCountdown(done) {
    const cd = $('#countdown');
    let n = 3;
    cd.hidden = false; cd.textContent = n;
    const iv = setInterval(() => {
      n--;
      if (n <= 0) { clearInterval(iv); cd.hidden = true; done(); }
      else cd.textContent = n;
    }, 800);
  }

  // ---- init ----
  presetSel.value = COINSTASH.presets[0].id;
  themeSel.value = 'purple';
  loadPreset(presetSel.value);
})();
