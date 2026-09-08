/*
 * ReelChart — renders a 1080x1920 (9:16) animated comparison chart into an SVG.
 * Framework-free. Static chrome is drawn once; only the dynamic layer (lines,
 * leading dots, live value labels) updates each animation frame.
 */
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const W = 1080, H = 1920;

  // Plot box within the 1080x1920 stage.
  const M = { t: markT(), r: 70, b: 470, l: 104 };
  function markT() { return 640; }
  const plot = {
    l: M.l, r: W - M.r, t: M.t, b: H - M.b,
    get w() { return this.r - this.l; },
    get h() { return this.b - this.t; }
  };

  const easeInOutCubic = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  function el(tag, attrs, text) {
    const n = document.createElementNS(NS, tag);
    if (attrs) for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (text != null) n.textContent = text;
    return n;
  }

  function niceCeil(v) {
    if (v <= 0) return 1;
    const mag = Math.pow(10, Math.floor(Math.log10(v)));
    const n = v / mag;
    const step = n <= 1 ? 1 : n <= 1.5 ? 1.5 : n <= 2 ? 2 : n <= 2.5 ? 2.5
      : n <= 3 ? 3 : n <= 4 ? 4 : n <= 5 ? 5 : n <= 7.5 ? 7.5 : 10;
    return step * mag;
  }

  const fmtInt = n => Math.round(n).toLocaleString('en-US');
  // Compact form for axis ticks: 25000 -> 25K, 1.2e6 -> 1.2M.
  function fmtCompact(n) {
    n = Math.round(n);
    const a = Math.abs(n);
    if (a >= 1e6) return (n / 1e6).toFixed(a % 1e6 ? 1 : 0) + 'M';
    if (a >= 1000) return Math.round(n / 1000) + 'K';
    return String(n);
  }

  class ReelChart {
    constructor(svg) {
      this.svg = svg;
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      this.cfg = null;
      this._raf = null;
    }

    setConfig(cfg) {
      // cfg: {bitcoin[], asset[], assetName, title, subtitle, theme, scale,
      //       xMode, startYear, baseInvest, showMoney, duration, handle, disclaimer}
      this.cfg = Object.assign({
        scale: 'linear',
        xMode: 'observation',
        startYear: 2015,
        baseInvest: 100,
        showMoney: true,
        duration: 5200,
        handle: '@coinstash',
        disclaimer: 'Past performance is not a reliable indicator of future results. Not financial advice.'
      }, cfg);
      this._computeScale();
    }

    _computeScale() {
      const c = this.cfg;
      const all = c.bitcoin.concat(c.asset).filter(v => typeof v === 'number');
      const rawMax = Math.max(...all);
      if (c.scale === 'log') {
        this.vmin = 100;                        // series start at 100
        this.vmax = niceCeil(rawMax);
        this._y = v => plot.b - (Math.log10(Math.max(v, 1)) - Math.log10(this.vmin)) /
          (Math.log10(this.vmax) - Math.log10(this.vmin)) * plot.h;
      } else {
        this.vmin = 0;
        this.vmax = niceCeil(rawMax);
        this._y = v => plot.b - (v - this.vmin) / (this.vmax - this.vmin) * plot.h;
      }
      this.N = c.bitcoin.length;
      this._x = i => plot.l + i * plot.w / (this.N - 1);
    }

    _xLabel(i) {
      return this.cfg.xMode === 'year' ? String(this.cfg.startYear + i) : String(i + 1);
    }

    _bigValue(indexVal) {
      // Returns the number shown as the "live" figure for a series.
      return this.cfg.showMoney ? (this.cfg.baseInvest * indexVal / 100) : indexVal;
    }

    _fmtBig(n) {
      return (this.cfg.showMoney ? '$' : '') + fmtInt(n);
    }

    // Compact label for the y-axis (keeps big numbers from clipping the edge).
    _fmtAxis(n) {
      return (this.cfg.showMoney ? '$' : '') + fmtCompact(n);
    }

    // Value at fractional index t (linear interpolation between observations).
    _valAt(arr, t) {
      const i = Math.floor(t), f = t - i;
      if (i >= arr.length - 1) return arr[arr.length - 1];
      return arr[i] + (arr[i + 1] - arr[i]) * f;
    }

    render() {
      const svg = this.svg, c = this.cfg, th = c.theme;
      svg.replaceChildren();

      // ---- defs: background gradient + line glow ----
      const defs = el('defs');
      const grad = el('linearGradient', { id: 'bg', x1: '0', y1: '0', x2: '0', y2: '1' });
      grad.append(el('stop', { offset: '0', 'stop-color': th.bgFrom }));
      grad.append(el('stop', { offset: '1', 'stop-color': th.bgTo }));
      defs.append(grad);
      const glow = el('filter', { id: 'glow', x: '-50%', y: '-50%', width: '200%', height: '200%' });
      glow.append(el('feGaussianBlur', { stdDeviation: '9', result: 'b' }));
      const merge = el('feMerge');
      merge.append(el('feMergeNode', { in: 'b' }));
      merge.append(el('feMergeNode', { in: 'SourceGraphic' }));
      glow.append(merge);
      defs.append(glow);
      svg.append(defs);

      svg.append(el('rect', { x: 0, y: 0, width: W, height: H, fill: 'url(#bg)' }));

      // ---- static chrome layer ----
      const S = el('g');
      svg.append(S);

      // Header: title + subtitle
      if (c.title) S.append(el('text', {
        x: W / 2, y: 300, 'text-anchor': 'middle', fill: th.text,
        'font-size': 108, 'font-weight': 700, class: 'r-head', 'letter-spacing': '-2'
      }, c.title));
      if (c.subtitle) S.append(el('text', {
        x: W / 2, y: 392, 'text-anchor': 'middle', fill: th.subtext,
        'font-size': 46, 'font-weight': 500, class: 'r-head'
      }, c.subtitle));

      // Y grid + labels
      for (let i = 0; i <= 4; i++) {
        let v, yy;
        if (c.scale === 'log') {
          const lo = Math.log10(this.vmin), hi = Math.log10(this.vmax);
          v = Math.pow(10, lo + (hi - lo) * i / 4);
          yy = this._y(v);
        } else {
          v = this.vmin + (this.vmax - this.vmin) * i / 4;
          yy = this._y(v);
        }
        S.append(el('line', { x1: plot.l, y1: yy, x2: plot.r, y2: yy, stroke: th.grid, 'stroke-width': 2 }));
        S.append(el('text', {
          x: plot.l - 22, y: yy + 12, 'text-anchor': 'end', fill: th.axis,
          'font-size': 32, class: 'r-mono'
        }, this._fmtAxis(this._bigValue(v))));
      }

      // X axis ticks + labels (thin out if many observations)
      const stepX = this.N > 8 ? 2 : 1;
      for (let i = 0; i < this.N; i += stepX) {
        S.append(el('text', {
          x: this._x(i), y: plot.b + 56, 'text-anchor': 'middle', fill: th.axis,
          'font-size': 32, class: 'r-mono'
        }, this._xLabel(i)));
      }
      // x axis caption
      S.append(el('text', {
        x: W / 2, y: plot.b + 118, 'text-anchor': 'middle', fill: th.axis,
        'font-size': 30, class: 'r-head'
      }, c.xMode === 'year' ? 'Year' : 'Observation'));

      // ---- footer chrome ----
      // Legend chips with final multiples
      const btcFinal = c.bitcoin[c.bitcoin.length - 1] / 100;
      const assetFinal = c.asset[c.asset.length - 1] / 100;
      this._legend(S, th, c, btcFinal, assetFinal);

      // Handle + disclaimer
      S.append(el('text', {
        x: W / 2, y: H - 132, 'text-anchor': 'middle', fill: th.text,
        'font-size': 40, 'font-weight': 700, class: 'r-head'
      }, c.handle));
      S.append(el('text', {
        x: W / 2, y: H - 70, 'text-anchor': 'middle', fill: th.subtext,
        'font-size': 24, class: 'r-head'
      }, c.disclaimer));

      // ---- dynamic layer (updated each frame) ----
      this.dyn = el('g');
      svg.append(this.dyn);
      this.drawFrame(0);
    }

    _legend(S, th, c, btcFinal, assetFinal) {
      const y = H - 300;
      const mk = (cx, colour, name) => {
        const g = el('g');
        g.append(el('circle', { cx: cx, cy: y - 12, r: 15, fill: colour }));
        g.append(el('text', { x: cx + 30, y: y, fill: th.text, 'font-size': 44, 'font-weight': 600, class: 'r-head' }, name));
        g.append(el('text', { x: cx + 30, y: y + 62, fill: colour, 'font-size': 72, 'font-weight': 700, class: 'r-mono', 'data-mult': '1' }, ''));
        S.append(g);
        return g;
      };
      // Two columns
      this._legBtc = mk(plot.l + 8, th.btc, 'Bitcoin');
      this._legAsset = mk(W / 2 + 40, th.asset, c.assetName || 'Asset');
      this._legBtcVal = this._legBtc.querySelector('[data-mult]');
      this._legAssetVal = this._legAsset.querySelector('[data-mult]');
    }

    drawFrame(p) {
      const c = this.cfg, th = c.theme, dyn = this.dyn;
      dyn.replaceChildren();
      const eased = easeInOutCubic(Math.max(0, Math.min(1, p)));
      const t = eased * (this.N - 1); // fractional leading index

      const series = [
        { key: 'bitcoin', colour: th.btc, name: 'Bitcoin' },
        { key: 'asset', colour: th.asset, name: c.assetName || 'Asset' }
      ];

      series.forEach(s => {
        const arr = c[s.key];
        const full = Math.floor(t);
        const pts = [];
        for (let i = 0; i <= full; i++) pts.push(this._x(i) + ',' + this._y(arr[i]));
        const lead = this._valAt(arr, t);
        const lx = this._x(t), ly = this._y(lead);
        pts.push(lx + ',' + ly);

        dyn.append(el('polyline', {
          points: pts.join(' '), fill: 'none', stroke: s.colour,
          'stroke-width': 10, 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
          filter: 'url(#glow)'
        }));
        // leading dot
        dyn.append(el('circle', { cx: lx, cy: ly, r: 16, fill: s.colour, filter: 'url(#glow)' }));
        dyn.append(el('circle', { cx: lx, cy: ly, r: 9, fill: th.bgTo }));

        // live value label near leading dot
        const val = this._bigValue(lead);
        const above = s.key === 'bitcoin';
        dyn.append(el('text', {
          x: Math.min(lx, plot.r - 10),
          y: above ? Math.max(plot.t + 40, ly - 34) : Math.min(plot.b - 12, ly + 60),
          'text-anchor': lx > plot.r - 220 ? 'end' : 'middle',
          fill: s.colour, 'font-size': 48, 'font-weight': 700, class: 'r-mono'
        }, this._fmtBig(val)));
      });

      // update legend multiples (count up with progress)
      if (this._legBtcVal) {
        const bm = 1 + (c.bitcoin[this.N - 1] / 100 - 1) * eased;
        const am = 1 + (c.asset[this.N - 1] / 100 - 1) * eased;
        this._legBtcVal.textContent = fmtInt(bm) + '×';
        this._legAssetVal.textContent = fmtInt(am) + '×';
      }
    }

    play(onDone) {
      this.stop();
      const dur = this.cfg.duration;
      const start = performance.now();
      const tick = now => {
        const p = Math.min(1, (now - start) / dur);
        this.drawFrame(p);
        if (p < 1) this._raf = requestAnimationFrame(tick);
        else { this._raf = null; if (onDone) onDone(); }
      };
      this._raf = requestAnimationFrame(tick);
    }

    stop() {
      if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null; }
    }
  }

  window.ReelChart = ReelChart;
})();
