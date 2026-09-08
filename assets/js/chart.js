/*
 * ReelChart — Canvas2D renderer for 1080x1920 (9:16) animated comparison charts.
 * Canvas (not SVG) so that: (a) webfonts render correctly inside exported video,
 * and (b) the frame can be captured via canvas.captureStream() for MP4/WebM export.
 *
 * Features: N named series, dynamic "zoom-out" scaling, percentage-increase
 * framing, Instagram safe-zone insets, and legible value labels drawn on top.
 */
(function () {
  const W = 1080, H = 1920;
  // Brand fonts: PP Telegraf (headings/figures) + FK Grotesk Neue (body).
  const FH = "'PP Telegraf', system-ui, sans-serif";      // heading / display
  const FB = "'FK Grotesk Neue', system-ui, sans-serif";  // body / labels
  const easeInOutCubic = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function niceNum(range, round) {
    if (range <= 0) return 1;
    const exp = Math.floor(Math.log10(range));
    const f = range / Math.pow(10, exp);
    let nf;
    if (round) nf = f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10;
    else nf = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
    return nf * Math.pow(10, exp);
  }
  const comma = n => Math.round(n).toLocaleString('en-US');
  function compact(n) {
    const a = Math.abs(n);
    if (a >= 1e6) return (n / 1e6).toFixed(a % 1e6 ? 1 : 0) + 'M';
    if (a >= 1000) return Math.round(n / 1000) + 'K';
    return String(Math.round(n));
  }

  function pickMime() {
    const cands = [
      { type: 'video/mp4;codecs=avc1.42E01E', ext: 'mp4' },
      { type: 'video/mp4', ext: 'mp4' },
      { type: 'video/webm;codecs=vp9', ext: 'webm' },
      { type: 'video/webm;codecs=vp8', ext: 'webm' },
      { type: 'video/webm', ext: 'webm' }
    ];
    for (const c of cands) {
      if (window.MediaRecorder && MediaRecorder.isTypeSupported(c.type)) return c;
    }
    return { type: '', ext: 'webm' };
  }

  class ReelChart {
    constructor(canvas) {
      this.canvas = canvas;
      canvas.width = W; canvas.height = H;
      this.ctx = canvas.getContext('2d');
      this._raf = null;
      this._logos = {};
      this._loadLogos();
    }

    _loadLogos() {
      const src = window.COINSTASH_LOGOS || {};
      ['white', 'black'].forEach(k => {
        if (!src[k]) return;
        const img = new Image();
        img.onload = () => { this._logos[k] = img; };
        img.src = src[k];
      });
    }

    // Resolve once fonts + brand logos + uploaded series logos are ready.
    async ready() {
      try {
        if (document.fonts) {
          // explicitly kick off loading the exact faces the canvas draws with
          await Promise.all([
            "800 100px 'PP Telegraf'", "600 60px 'PP Telegraf'",
            "500 40px 'FK Grotesk Neue'", "400 30px 'FK Grotesk Neue'"
          ].map(f => document.fonts.load(f).catch(() => {})));
          if (document.fonts.ready) await document.fonts.ready;
        }
      } catch (e) {}
      const need = window.COINSTASH_LOGOS ? Object.keys(window.COINSTASH_LOGOS).filter(k => k !== 'aspect') : [];
      const assets = this._assetImgs || [];
      const start = performance.now();
      const pending = () => need.some(k => !this._logos[k]) || assets.some(im => !(im.complete && im.naturalWidth));
      while (pending() && performance.now() - start < 3000) {
        await new Promise(r => setTimeout(r, 50));
      }
    }

    setConfig(cfg) {
      this.cfg = Object.assign({
        series: [], title: '', subtitle: '',
        theme: null, valueMode: 'pct', baseInvest: 100, decimals: 0,
        scale: 'linear', zoom: true,
        xMode: 'observation', startYear: 2015,
        xAxisLabel: '', yAxisLabel: '',
        duration: 5600, endHold: 1400,
        lineWidth: 11, showGrid: true, showDots: true, glow: true, logoSize: 48,
        showLogo: true, showHandle: true, showDisclaimer: true,
        handle: '@coinstash',
        disclaimer: 'Past performance is not a reliable indicator of future results. Not financial advice.',
        safeZone: true, guides: false,
        title2: '% increase since start'
      }, cfg);

      const th = this.cfg.theme;
      // Normalise series: trim to a common length; assign palette colours.
      const s = this.cfg.series.filter(x => x && x.values && x.values.length >= 2);
      const n = Math.min.apply(null, s.map(x => x.values.length));
      this._assetImgs = [];
      this.series = s.map((x, i) => {
        const ns = {
          name: x.name || ('Series ' + (i + 1)),
          values: x.values.slice(0, n),
          color: x.color || th.palette[i % th.palette.length],
          img: null
        };
        if (x.logoSrc) {
          const img = new Image();
          img.onload = () => { ns.img = img; };
          img.src = x.logoSrc;
          this._assetImgs.push(img);
          if (img.complete && img.naturalWidth) ns.img = img;
        }
        return ns;
      });
      this.N = n;
      const all = this.series.reduce((a, x) => a.concat(x.values), []);
      this.globalMax = Math.max.apply(null, all);
      this.globalMin = Math.min.apply(null, all);
      this._layout();
    }

    _layout() {
      const safe = this.cfg.safeZone
        ? { t: 120, r: 112, b: 322, l: 60 }
        : { t: 44, r: 44, b: 64, l: 44 };
      this.safe = safe;
      const cx = { l: safe.l, r: W - safe.r, t: safe.t, b: H - safe.b };
      this.content = cx;

      // Header band (logo + title + subtitle)
      const headerH = 236;
      this.header = { t: cx.t, b: cx.t + headerH };

      // Footer band (legend + handle + disclaimer), measured bottom-up
      this.legend = this._computeLegend(cx.r - cx.l);
      const legendH = this.legend.height;
      const discH = this.cfg.showDisclaimer ? 58 : 8;
      const handleH = this.cfg.showHandle ? 52 : 0;
      this.footer = { legendH, discH, handleH, t: cx.b - (legendH + discH + handleH) };

      // Plot box. Leave a clear band under the x-axis so the axis labels never
      // collide with the legend/figures below. Reserve extra space for optional
      // custom axis titles.
      this.plot = {
        l: cx.l + 96, r: cx.r - 10,
        t: this.header.b + 18 + (this.cfg.yAxisLabel ? 34 : 0),
        b: this.footer.t - (this.cfg.xAxisLabel ? 150 : 112)
      };
      this.plot.w = this.plot.r - this.plot.l;
      this.plot.h = this.plot.b - this.plot.t;
    }

    // ---- scales for a given progress p ----
    _scales(p) {
      const eased = easeInOutCubic(clamp(p, 0, 1));
      const t = eased * (this.N - 1);           // fractional leading index
      const zoom = this.cfg.zoom;

      const xMax = zoom ? Math.max(1, t) : (this.N - 1);
      const xOf = i => this.plot.l + (i / xMax) * this.plot.w;

      // vertical domain
      let vmin = 100, vmax;
      if (zoom) {
        let mx = 100, mn = 100;
        this.series.forEach(s => {
          const full = Math.floor(t);
          for (let i = 0; i <= full && i < s.values.length; i++) { mx = Math.max(mx, s.values[i]); mn = Math.min(mn, s.values[i]); }
          const lead = this._valAt(s.values, t); mx = Math.max(mx, lead); mn = Math.min(mn, lead);
        });
        vmin = Math.min(100, mn * 0.98);
        vmax = Math.max(mx * 1.12, vmin + 15);
      } else {
        vmin = Math.min(100, this.globalMin);
        vmax = this.globalMax * 1.05;
      }

      let yOf;
      if (this.cfg.scale === 'log') {
        const lo = Math.log10(Math.max(1, vmin)), hi = Math.log10(vmax);
        yOf = v => this.plot.b - (Math.log10(Math.max(1, v)) - lo) / (hi - lo) * this.plot.h;
      } else {
        yOf = v => this.plot.b - (v - vmin) / (vmax - vmin) * this.plot.h;
      }
      return { t, xMax, vmin, vmax, xOf, yOf };
    }

    _valAt(arr, t) {
      const i = Math.floor(t), f = t - i;
      if (i >= arr.length - 1) return arr[arr.length - 1];
      return arr[i] + (arr[i + 1] - arr[i]) * f;
    }

    // ---- value formatting ----
    _fmt(indexVal, opt) {
      opt = opt || {};
      const c = this.cfg, d = c.decimals;
      const num = x => opt.compact ? compact(x) : (d ? x.toFixed(d) : comma(x));
      switch (c.valueMode) {
        case 'multiple': return num(indexVal / 100) + '×';
        case 'dollars': return '$' + num(c.baseInvest * indexVal / 100);
        case 'index': return num(indexVal);
        case 'pct':
        default: {
          const g = indexVal - 100;
          return (g >= 0 ? '+' : '') + num(g) + '%';
        }
      }
    }

    // ---- drawing ----
    _rr(ctx, x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }

    drawFrame(p) {
      const ctx = this.ctx, c = this.cfg, th = c.theme, sc = this._scales(p);

      // background
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, th.bgFrom); g.addColorStop(1, th.bgTo);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

      // safe-zone guides (preview only)
      if (c.guides) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255,120,98,0.7)'; ctx.setLineDash([14, 12]); ctx.lineWidth = 2;
        ctx.strokeRect(this.content.l, this.content.t, this.content.r - this.content.l, this.content.b - this.content.t);
        ctx.restore();
      }

      // ---- header ----
      const cw = this.content.r - this.content.l;
      const fit = (text, base, min, weight, fam) => {
        let fs = base;
        ctx.font = weight + ' ' + fs + 'px ' + fam;
        const w = ctx.measureText(text).width;
        if (w > cw * 0.99) fs = Math.max(min, Math.floor(fs * cw * 0.99 / w));
        return fs;
      };
      let hy = this.header.t;
      if (c.showLogo && this._logos[th.logo]) {
        const lh = 52, lw = lh * (window.COINSTASH_LOGOS.aspect || 5.05);
        ctx.drawImage(this._logos[th.logo], W / 2 - lw / 2, hy, lw, lh);
        hy += lh + 24;
      } else { hy += 18; }
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      if (c.title) {
        const fs = fit(c.title, 104, 52, '800', FH);
        ctx.fillStyle = th.text; ctx.font = '800 ' + fs + 'px ' + FH;
        ctx.fillText(c.title, W / 2, hy + fs * 0.9);
        hy += fs * 0.9 + 12;
      }
      if (c.subtitle) {
        const fs = fit(c.subtitle, 44, 26, '500', FB);
        ctx.fillStyle = th.subtext; ctx.font = '500 ' + fs + 'px ' + FB;
        ctx.fillText(c.subtitle, W / 2, hy + fs);
      }

      // ---- grid + y labels ----
      const ticks = this._yTicks(sc);
      ctx.textBaseline = 'middle';
      ticks.forEach(v => {
        const y = sc.yOf(v);
        if (c.showGrid) {
          ctx.strokeStyle = th.grid; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(this.plot.l, y); ctx.lineTo(this.plot.r, y); ctx.stroke();
        }
        ctx.fillStyle = th.axis; ctx.font = "500 30px " + FB; ctx.textAlign = 'right';
        ctx.fillText(this._fmt(v, { compact: true }), this.plot.l - 18, y);
      });

      // ---- custom y-axis title (above the axis, left-aligned) ----
      if (c.yAxisLabel) {
        ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
        const fs = this._fitFont(ctx, c.yAxisLabel, 32, 20, '600', FB, this.plot.w);
        ctx.fillStyle = th.subtext; ctx.font = '600 ' + fs + 'px ' + FB;
        ctx.fillText(c.yAxisLabel, this.plot.l, this.plot.t - 16);
      }

      // ---- x labels ----
      ctx.fillStyle = th.axis; ctx.font = "500 30px " + FB; ctx.textAlign = 'center';
      const maxI = Math.floor(sc.xMax + 1e-6);
      // thin labels so they never overlap: reserve label width + gap per tick
      const lw = Math.max(ctx.measureText(this._xLabel(maxI)).width, ctx.measureText(this._xLabel(0)).width);
      const maxTicks = Math.max(2, Math.floor(this.plot.w / (lw + 26)));
      const step = Math.max(1, Math.ceil((maxI + 1) / maxTicks));
      for (let i = 0; i <= maxI; i += step) {
        ctx.fillText(this._xLabel(i), sc.xOf(i), this.plot.b + 48);
      }
      // ---- custom x-axis title (centred under the tick labels) ----
      if (c.xAxisLabel) {
        const fs = this._fitFont(ctx, c.xAxisLabel, 32, 20, '600', FB, this.plot.w);
        ctx.fillStyle = th.subtext; ctx.font = '600 ' + fs + 'px ' + FB; ctx.textAlign = 'center';
        ctx.fillText(c.xAxisLabel, (this.plot.l + this.plot.r) / 2, this.plot.b + 100);
      }

      // ---- series lines ----
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      this.series.forEach(s => {
        const full = Math.floor(sc.t);
        ctx.save();
        if (c.glow) { ctx.shadowColor = s.color; ctx.shadowBlur = 20; }
        ctx.strokeStyle = s.color; ctx.lineWidth = c.lineWidth;
        ctx.beginPath();
        ctx.moveTo(sc.xOf(0), sc.yOf(s.values[0]));
        for (let i = 1; i <= full && i < s.values.length; i++) ctx.lineTo(sc.xOf(i), sc.yOf(s.values[i]));
        const lead = this._valAt(s.values, sc.t);
        ctx.lineTo(sc.xOf(sc.t), sc.yOf(lead));
        ctx.stroke();
        ctx.restore();
      });

      // ---- leading markers: uploaded logo badge, else a dot ----
      const BADGE_R = c.logoSize || 48;
      const leads = this.series.map(s => {
        const lead = this._valAt(s.values, sc.t);
        const hasLogo = !!(s.img && s.img.complete && s.img.naturalWidth);
        return { s, x: sc.xOf(sc.t), y: sc.yOf(lead), v: lead, hasLogo, r: hasLogo ? BADGE_R : 15 };
      });
      leads.forEach(L => {
        if (L.hasLogo) { this._drawBadge(ctx, L.s.img, L.x, L.y, BADGE_R, L.s.color); return; }
        if (!c.showDots) return;
        ctx.save();
        if (c.glow) { ctx.shadowColor = L.s.color; ctx.shadowBlur = 18; }
        ctx.fillStyle = L.s.color; ctx.beginPath(); ctx.arc(L.x, L.y, 15, 0, 7); ctx.fill();
        ctx.restore();
        ctx.fillStyle = th.bgTo; ctx.beginPath(); ctx.arc(L.x, L.y, 7, 0, 7); ctx.fill();
      });

      // ---- value labels (pills, drawn on top, de-collided) ----
      this._drawLabels(ctx, leads, th);

      // ---- footer ----
      this._drawFooter(ctx, th, p);
    }

    _yTicks(sc) {
      const out = [];
      if (this.cfg.scale === 'log') {
        const lo = Math.log10(Math.max(1, sc.vmin)), hi = Math.log10(sc.vmax);
        for (let i = 0; i <= 4; i++) out.push(Math.pow(10, lo + (hi - lo) * i / 4));
        return out;
      }
      const step = niceNum((sc.vmax - sc.vmin) / 4, true);
      let start = Math.ceil(sc.vmin / step) * step;
      if (sc.vmin <= 100 && start > 100) out.push(100);
      for (let v = start; v <= sc.vmax + step * 0.01 && out.length < 8; v += step) out.push(v);
      return out;
    }

    _xLabel(i) { return this.cfg.xMode === 'year' ? String(this.cfg.startYear + i) : String(i + 1); }

    // Largest font size (base→min) at which `text` fits within maxW.
    _fitFont(ctx, text, base, min, weight, fam, maxW) {
      ctx.font = weight + ' ' + base + 'px ' + fam;
      const w = ctx.measureText(text).width;
      if (w <= maxW) return base;
      return Math.max(min, Math.floor(base * maxW / w));
    }

    _drawLabels(ctx, leads, th) {
      ctx.font = "600 46px " + FH;
      const anyLogo = leads.some(L => L.hasLogo);
      const items = leads.map(L => ({
        color: L.s.color, x: L.x, dotY: L.y, r: L.r || 15,
        text: this._fmt(L.v), w: ctx.measureText(this._fmt(L.v)).width
      }));
      // desired y above the marker; de-collide downward
      items.forEach(it => { it.y = it.dotY - (it.r + 30); });
      items.sort((a, b) => a.y - b.y);
      const maxR = items.reduce((m, it) => Math.max(m, it.r), 15);
      const gap = anyLogo ? maxR * 2 + 12 : 62;
      for (let i = 1; i < items.length; i++) {
        if (items[i].y - items[i - 1].y < gap) items[i].y = items[i - 1].y + gap;
      }
      items.forEach(it => {
        it.y = clamp(it.y, this.plot.t + 30, this.plot.b - 6);
        const padX = 16, h = 58, pillW = it.w + padX * 2, off = it.r + 12;
        let x = it.x + off;
        if (x + pillW > this.plot.r) x = it.x - off - pillW; // flip to the left near the edge
        ctx.fillStyle = th.pill;
        this._rr(ctx, x, it.y - h / 2, pillW, h, 14); ctx.fill();
        ctx.fillStyle = it.color; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.font = "600 46px " + FH;
        ctx.fillText(it.text, x + padX, it.y + 2);
      });
    }

    // Circular logo badge at the front of a line (white coin + coloured ring).
    _drawBadge(ctx, img, x, y, R, ring) {
      ctx.save();
      if (this.cfg.glow) { ctx.shadowColor = ring; ctx.shadowBlur = 16; }
      ctx.fillStyle = ring; ctx.beginPath(); ctx.arc(x, y, R, 0, 7); ctx.fill();
      ctx.restore();
      ctx.save();
      const inner = R - 5;
      ctx.beginPath(); ctx.arc(x, y, inner, 0, 7); ctx.closePath(); ctx.clip();
      ctx.fillStyle = '#fff'; ctx.fillRect(x - inner, y - inner, inner * 2, inner * 2);
      // contain the image within the circle, preserving aspect ratio
      const box = inner * 1.9, iw = img.naturalWidth, ih = img.naturalHeight;
      const scale = Math.min(box / iw, box / ih);
      const dw = iw * scale, dh = ih * scale;
      ctx.drawImage(img, x - dw / 2, y - dh / 2, dw, dh);
      ctx.restore();
    }

    // Pre-compute legend layout: columns, per-item font sizing, wrapped name
    // lines, and total height. Runs in _layout so the footer can be sized.
    _computeLegend(cw) {
      const ctx = this.ctx;
      const n = this.series.length;
      const dotGap = 44, nameBase = 42, nameMin = 26, nameLH = 46;
      const valBase = 62, valMin = 40;
      // names in body font (FK Grotesk 500), figures in heading font (Telegraf 600)
      const measure = (txt, weight, fs, fam) => { ctx.font = weight + ' ' + fs + 'px ' + fam; return ctx.measureText(txt).width; };

      // 2 columns only if every name fits one line (at the min size) in a half cell.
      const cellW2 = cw / 2 - dotGap - 14;
      const fits2 = n >= 2 && this.series.every(s => measure(s.name, '500', nameMin, FB) <= cellW2);
      const cols = fits2 ? 2 : 1;
      const cellW = cols === 2 ? cellW2 : (cw - dotGap - 14);

      const items = this.series.map(s => {
        let nf = nameBase;
        while (nf > nameMin && measure(s.name, '500', nf, FB) > cellW) nf -= 2;
        let lines = [s.name];
        if (measure(s.name, '500', nf, FB) > cellW) lines = this._wrap(s.name, '500 ' + nf + 'px ' + FB, cellW, 2);
        let vf = valBase;
        const finalText = this._fmt(s.values[this.N - 1]);
        while (vf > valMin && measure(finalText, '600', vf, FH) > cellW) vf -= 2;
        const blockH = 24 + (lines.length - 1) * nameLH + 66 + 30;
        return { s, nf, lines, vf, nameLH, blockH };
      });

      const rows = cols === 2 ? Math.ceil(n / 2) : n;
      const rowHeights = [];
      for (let r = 0; r < rows; r++) {
        let h = 0;
        for (let c = 0; c < cols; c++) { const i = cols === 2 ? r * 2 + c : r; if (i < n) h = Math.max(h, items[i].blockH); }
        rowHeights.push(h);
      }
      const height = rowHeights.reduce((a, b) => a + b, 0) + 6;
      return { cols, dotGap, nameLH, items, rows, rowHeights, height };
    }

    _wrap(text, font, maxW, maxLines) {
      const ctx = this.ctx; ctx.font = font;
      const words = text.split(/\s+/).filter(Boolean);
      const lines = []; let cur = '';
      for (let i = 0; i < words.length; i++) {
        const test = cur ? cur + ' ' + words[i] : words[i];
        if (ctx.measureText(test).width <= maxW || !cur) cur = test;
        else {
          lines.push(cur); cur = words[i];
          if (lines.length === maxLines - 1) { cur = words.slice(i).join(' '); break; }
        }
      }
      if (cur) lines.push(cur);
      return lines.slice(0, maxLines).map(l => this._ellipsize(l, font, maxW));
    }

    _ellipsize(text, font, maxW) {
      const ctx = this.ctx; ctx.font = font;
      if (ctx.measureText(text).width <= maxW) return text;
      let s = text;
      while (s.length > 1 && ctx.measureText(s + '…').width > maxW) s = s.slice(0, -1);
      return s + '…';
    }

    _drawFooter(ctx, th, p) {
      const eased = easeInOutCubic(clamp(p, 0, 1));
      const t = eased * (this.N - 1);
      const f = this.footer, cx = this.content, leg = this.legend;
      const colW = (cx.r - cx.l) / leg.cols;
      ctx.textBaseline = 'alphabetic';
      let rowY = f.t;
      for (let r = 0; r < leg.rows; r++) {
        for (let c = 0; c < leg.cols; c++) {
          const idx = leg.cols === 2 ? r * 2 + c : r;
          if (idx >= this.series.length) continue;
          const it = leg.items[idx], s = it.s, x = cx.l + c * colW;
          ctx.fillStyle = s.color; ctx.beginPath(); ctx.arc(x + 14, rowY + 12, 15, 0, 7); ctx.fill();
          ctx.fillStyle = th.text; ctx.textAlign = 'left'; ctx.font = '500 ' + it.nf + 'px ' + FB;
          it.lines.forEach((ln, li) => ctx.fillText(ln, x + leg.dotGap, rowY + 24 + li * it.nameLH));
          const curV = this._valAt(s.values, t);
          ctx.fillStyle = s.color; ctx.font = '600 ' + it.vf + 'px ' + FH;
          ctx.fillText(this._fmt(curV), x + leg.dotGap, rowY + 24 + (it.lines.length - 1) * it.nameLH + 66);
        }
        rowY += leg.rowHeights[r];
      }
      // handle
      let by = cx.b;
      if (this.cfg.showDisclaimer) {
        ctx.fillStyle = th.subtext; ctx.font = "400 24px " + FB; ctx.textAlign = 'center';
        ctx.fillText(this.cfg.disclaimer, W / 2, by); by -= 40;
      }
      if (this.cfg.showHandle) {
        ctx.fillStyle = th.text; ctx.font = "600 40px " + FH; ctx.textAlign = 'center';
        ctx.fillText(this.cfg.handle, W / 2, by - (this.cfg.showDisclaimer ? 6 : 8));
      }
    }

    // ---- playback ----
    play(onDone) {
      this.stop();
      const dur = this.cfg.duration, hold = this.cfg.endHold;
      const start = performance.now();
      const tick = now => {
        const el = now - start;
        this.drawFrame(Math.min(1, el / dur));
        if (el < dur + hold) this._raf = requestAnimationFrame(tick);
        else { this._raf = null; if (onDone) onDone(); }
      };
      this._raf = requestAnimationFrame(tick);
    }
    stop() { if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null; } }

    // ---- video export ----
    async exportVideo(opt) {
      opt = opt || {};
      await this.ready();
      if (!window.MediaRecorder || !this.canvas.captureStream) throw new Error('This browser cannot record canvas video. Use screen recording instead.');
      const mime = pickMime();
      const stream = this.canvas.captureStream(60);
      const rec = new MediaRecorder(stream, mime.type ? { mimeType: mime.type, videoBitsPerSecond: 14000000 } : { videoBitsPerSecond: 14000000 });
      const chunks = [];
      rec.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
      const stopped = new Promise(res => { rec.onstop = res; });
      rec.start();
      const dur = this.cfg.duration, hold = this.cfg.endHold;
      const start = performance.now();
      await new Promise(resolve => {
        const loop = now => {
          const el = now - start;
          this.drawFrame(Math.min(1, el / dur));
          if (opt.onProgress) opt.onProgress(Math.min(1, el / (dur + hold)));
          if (el < dur + hold) requestAnimationFrame(loop); else resolve();
        };
        requestAnimationFrame(loop);
      });
      rec.stop();
      await stopped;
      return { blob: new Blob(chunks, { type: mime.type || 'video/webm' }), ext: mime.ext };
    }
  }

  window.ReelChart = ReelChart;
})();
