/*
 * App wiring: multi-series editor, live preview, playback, record mode,
 * and one-click video export.
 */
(function () {
  const $ = s => document.querySelector(s);
  const chart = new ReelChart($('#stage-canvas'));
  const sidebar = $('.sidebar');

  // ---- dropdowns ----
  const presetSel = $('#preset');
  COINSTASH.presets.forEach(p => {
    const o = document.createElement('option'); o.value = p.id; o.textContent = p.title; presetSel.append(o);
  });
  presetSel.append(Object.assign(document.createElement('option'), { value: 'custom', textContent: 'Custom…' }));

  const themeSel = $('#theme');
  Object.entries(COINSTASH.themes).forEach(([k, t]) =>
    themeSel.append(Object.assign(document.createElement('option'), { value: k, textContent: t.label })));

  const parseSeries = str => str.split(/[\s,]+/).map(s => s.trim()).filter(Boolean).map(Number).filter(n => !isNaN(n));

  // ---- series rows ----
  const seriesList = $('#series-list');
  function paletteColor(i) { return COINSTASH.themes[themeSel.value].palette[i % 6]; }

  function addSeriesRow(name, values, color, custom) {
    const idx = seriesList.children.length;
    const row = document.createElement('div');
    row.className = 'series-row';
    row.innerHTML =
      '<div class="series-head">' +
        '<input class="s-color" type="color" value="' + (color || paletteColor(idx)) + '"' + (custom ? ' data-custom="1"' : '') + '>' +
        '<input class="s-name" type="text" placeholder="Series name" value="' + (name || '') + '">' +
        '<div class="s-logo" title="Upload a logo shown at the front of this line">' +
          '<input class="s-logo-input" type="file" accept="image/*" hidden>' +
          '<span class="s-logo-face"></span>' +
          '<button class="s-logo-clear" type="button" title="Remove logo" hidden>×</button>' +
        '</div>' +
        '<button class="s-remove" type="button" title="Remove series">✕</button>' +
      '</div>' +
      '<textarea class="s-values" rows="2" placeholder="100, 120, 150, …">' + (values || '') + '</textarea>' +
      '<label class="checkline s-invert-row"><input class="s-invert" type="checkbox"> Invert (mirror below zero — a falling cost as the other rises)</label>';
    seriesList.append(row);
  }

  function readSeries() {
    return [...seriesList.querySelectorAll('.series-row')].map(r => ({
      name: r.querySelector('.s-name').value || 'Series',
      values: parseSeries(r.querySelector('.s-values').value),
      color: r.querySelector('.s-color').value,
      logoSrc: r._logo || null,
      invert: r.querySelector('.s-invert').checked
    })).filter(s => s.values.length >= 2);
  }

  // Load an image file, downscale to <=256px (keeps memory/export light), return data URL.
  function processImage(file) {
    return new Promise((resolve, reject) => {
      if (!file || !/^image\//.test(file.type)) { reject(new Error('Not an image')); return; }
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const max = 256, scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
        const w = Math.max(1, Math.round(img.naturalWidth * scale)), h = Math.max(1, Math.round(img.naturalHeight * scale));
        const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
        cv.getContext('2d').drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        resolve(cv.toDataURL('image/png'));
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not load image')); };
      img.src = url;
    });
  }

  function setRowLogo(row, dataUrl) {
    row._logo = dataUrl || null;
    const face = row.querySelector('.s-logo-face');
    const clear = row.querySelector('.s-logo-clear');
    if (dataUrl) { row.querySelector('.s-logo').classList.add('has'); face.style.backgroundImage = 'url(' + dataUrl + ')'; clear.hidden = false; }
    else { row.querySelector('.s-logo').classList.remove('has'); face.style.backgroundImage = ''; clear.hidden = true; }
  }

  // ---- build config + render ----
  function build(render) {
    const series = readSeries();
    if (!series.length) { $('#status').textContent = 'Add at least one series with 2+ values.'; return null; }
    const cfg = {
      series,
      title: $('#title').value,
      subtitle: $('#subtitle').value,
      theme: COINSTASH.themes[themeSel.value],
      valueMode: $('#value-mode').value,
      baseInvest: parseFloat($('#base-invest').value) || 100,
      decimals: parseInt($('#decimals').value, 10) || 0,
      scale: $('#scale').value,
      zoom: $('#zoom').checked,
      xMode: $('#xmode').value,
      startYear: parseInt($('#start-year').value, 10) || 2015,
      xAxisLabel: $('#x-axis-label').value.trim(),
      yAxisLabel: $('#y-axis-label').value.trim(),
      duration: (parseFloat($('#duration').value) || 5.6) * 1000,
      endHold: (parseFloat($('#end-hold').value) || 1.4) * 1000,
      lineWidth: parseInt($('#line-width').value, 10) || 11,
      logoSize: parseInt($('#logo-size').value, 10) || 48,
      showGrid: $('#show-grid').checked,
      showDots: $('#show-dots').checked,
      glow: $('#glow').checked,
      showLogo: $('#show-logo').checked,
      showHandle: $('#show-handle').checked,
      showDisclaimer: $('#show-disclaimer').checked,
      handle: $('#handle').value || '@coinstash',
      disclaimer: $('#disclaimer').value,
      safeZone: $('#safezone').checked,
      guides: $('#guides').checked
    };
    chart.setConfig(cfg);
    if (render !== false) {
      chart.drawFrame(1); // rest state = finished chart
      // once any uploaded logos decode, refresh the static preview
      if (cfg.series.some(s => s.logoSrc)) chart.ready().then(() => { if (!chart._raf) chart.drawFrame(1); });
    }
    return cfg;
  }

  // ---- presets ----
  function loadPreset(id) {
    const p = COINSTASH.presets.find(x => x.id === id);
    if (!p) return;
    seriesList.innerHTML = '';
    p.series.forEach((s, i) => addSeriesRow(s.name, s.values.join(', '), paletteColor(i)));
    $('#title').value = p.title;
    build();
  }
  presetSel.addEventListener('change', () => { if (presetSel.value !== 'custom') loadPreset(presetSel.value); });

  $('#add-series').addEventListener('click', () => {
    addSeriesRow('', '', paletteColor(seriesList.children.length));
    presetSel.value = 'custom'; build();
  });

  // event delegation for series edits + removal + custom-colour flag
  seriesList.addEventListener('input', e => {
    if (e.target.classList.contains('s-color')) e.target.dataset.custom = '1';
    build();
  });
  seriesList.addEventListener('click', e => {
    const row = e.target.closest('.series-row');
    if (e.target.classList.contains('s-remove')) {
      if (seriesList.children.length > 1) { row.remove(); presetSel.value = 'custom'; build(); }
    } else if (e.target.classList.contains('s-logo-face')) {
      row.querySelector('.s-logo-input').click();
    } else if (e.target.classList.contains('s-logo-clear')) {
      setRowLogo(row, null); build();
    }
  });
  // file chosen for a series logo
  seriesList.addEventListener('change', async e => {
    if (!e.target.classList.contains('s-logo-input')) return;
    const row = e.target.closest('.series-row'), file = e.target.files && e.target.files[0];
    if (!file) return;
    try { setRowLogo(row, await processImage(file)); build(); }
    catch (err) { statusEl.textContent = 'Logo: ' + err.message; }
    e.target.value = ''; // allow re-selecting the same file
  });

  // recolour non-custom rows when theme changes
  themeSel.addEventListener('change', () => {
    [...seriesList.querySelectorAll('.series-row')].forEach((r, i) => {
      const ci = r.querySelector('.s-color');
      if (!ci.dataset.custom) ci.value = paletteColor(i);
    });
    build();
  });

  // ---- generic live rebuild ----
  sidebar.addEventListener('input', e => {
    if (e.target.closest('#series-list')) return; // handled above
    if (e.target.id === 'xmode') $('#year-row').hidden = e.target.value !== 'year';
    if (e.target.id === 'value-mode') $('#invest-row').hidden = e.target.value !== 'dollars';
    if (e.target.id === 'line-width') $('#lw-val').textContent = e.target.value;
    if (e.target.id === 'logo-size') $('#ls-val').textContent = e.target.value;
    build();
  });

  // ---- playback ----
  const statusEl = $('#status');
  function play() {
    const cfg = build(false);
    if (!cfg) return;
    statusEl.textContent = 'Playing…';
    chart.play(() => { statusEl.textContent = 'Done — Replay, Record, or Export video.'; });
  }
  $('#play').addEventListener('click', play);

  // ---- record mode ----
  const body = document.body;
  $('#record').addEventListener('click', () => {
    body.classList.add('record-mode'); build(false);
    const hint = $('#record-hint'); hint.style.opacity = '1';
    setTimeout(() => { hint.style.opacity = '0'; }, 3500);
    $('#countdown-on').checked ? runCountdown(play) : play();
  });
  $('#exit-record').addEventListener('click', () => { body.classList.remove('record-mode'); chart.stop(); build(); });
  document.addEventListener('keydown', e => {
    if (!body.classList.contains('record-mode')) return;
    if (e.key === 'Escape') { body.classList.remove('record-mode'); chart.stop(); build(); }
    if (e.key === ' ') { e.preventDefault(); play(); }
  });
  $('#fullscreen').addEventListener('click', () => {
    const s = $('#stage-wrap');
    if (!document.fullscreenElement) s.requestFullscreen && s.requestFullscreen();
    else document.exitFullscreen && document.exitFullscreen();
  });
  function runCountdown(done) {
    const cd = $('#countdown'); let n = 3; cd.hidden = false; cd.textContent = n;
    const iv = setInterval(() => { n--; if (n <= 0) { clearInterval(iv); cd.hidden = true; done(); } else cd.textContent = n; }, 800);
  }

  // ---- export video ----
  const exportBtn = $('#export');
  exportBtn.addEventListener('click', async () => {
    const cfg = build(false);
    if (!cfg) return;
    exportBtn.disabled = true;
    const orig = exportBtn.textContent;
    try {
      const { blob, ext } = await chart.exportVideo({
        onProgress: pr => { exportBtn.textContent = 'Exporting… ' + Math.round(pr * 100) + '%'; }
      });
      const slug = (cfg.title || 'coinstash-reel').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = slug + '.' + ext;
      document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      statusEl.textContent = 'Exported ' + a.download + (ext === 'webm' ? ' (WebM — see note below)' : '') + '.';
    } catch (err) {
      statusEl.textContent = 'Export failed: ' + err.message;
    } finally {
      exportBtn.disabled = false; exportBtn.textContent = orig;
    }
    chart.drawFrame(1);
  });

  // ---- init ----
  chart.ready().then(() => {
    themeSel.value = 'purple';
    presetSel.value = COINSTASH.presets[0].id;
    loadPreset(presetSel.value);
  });
})();
