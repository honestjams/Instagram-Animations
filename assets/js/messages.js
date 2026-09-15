/*
 * Boss Message Maker — live-edit a fake iMessage screen and export it as a
 * 1080x1920 PNG. Everything is user-supplied; it's a meme template.
 */
(function () {
  const $ = s => document.querySelector(s);
  const phone = $('#phone');
  const stage = $('#m-stage');

  // ---- scale the fixed 1080x1920 screen to fit the stage ----
  function fit() {
    const s = stage.clientWidth / 1080;
    phone.style.transform = 'scale(' + s + ')';
  }
  window.addEventListener('resize', fit);

  // ---- live bindings ----
  const bindText = (inputId, viewId) => {
    const inp = $('#' + inputId), view = $('#' + viewId);
    const upd = () => { view.textContent = inp.value; };
    inp.addEventListener('input', upd); upd();
  };
  bindText('m-name', 'v-name');
  bindText('m-unread', 'v-unread');
  bindText('m-time', 'v-time');
  bindText('m-received', 'v-received');
  bindText('m-reply', 'v-reply');

  // timestamp: bold the part before " at "
  const tsInp = $('#m-timestamp'), tsView = $('#v-timestamp');
  function updTs() {
    const v = tsInp.value;
    const i = v.indexOf(' at ');
    if (i > -1) tsView.innerHTML = '<b>' + esc(v.slice(0, i)) + '</b>' + esc(v.slice(i));
    else tsView.textContent = v;
  }
  function esc(s) { return s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }
  tsInp.addEventListener('input', updTs); updTs();

  // ---- show/hide toggles ----
  const toggle = (id, el) => {
    const t = $('#' + id), target = $(el);
    const upd = () => { target.hidden = !t.checked; };
    t.addEventListener('change', upd); upd();
  };
  toggle('m-show-received', '#v-received-wrap');
  toggle('m-show-timestamp', '#v-timestamp-wrap');
  toggle('m-show-reply', '#v-reply-wrap');
  toggle('m-delivered', '#v-delivered');

  // ---- avatar upload ----
  const avInput = $('#m-avatar-input'), avPrev = $('#m-avatar-preview'), avBtn = $('#m-avatar-btn'), avClear = $('#m-avatar-clear');
  const avView = $('#v-avatar');
  avBtn.addEventListener('click', () => avInput.click());
  avInput.addEventListener('change', () => {
    const f = avInput.files && avInput.files[0];
    if (!f || !/^image\//.test(f.type)) return;
    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => {
      const max = 400, sc = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.round(img.naturalWidth * sc), h = Math.round(img.naturalHeight * sc);
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      cv.getContext('2d').drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      const data = cv.toDataURL('image/png');
      avView.style.backgroundImage = 'url(' + data + ')';
      avPrev.style.backgroundImage = 'url(' + data + ')';
      avClear.hidden = false;
    };
    img.src = url;
    avInput.value = '';
  });
  avClear.addEventListener('click', () => {
    avView.style.backgroundImage = '';
    avPrev.style.backgroundImage = '';
    avClear.hidden = true;
  });

  // ---- fullscreen ----
  $('#m-fullscreen').addEventListener('click', () => {
    if (!document.fullscreenElement) stage.requestFullscreen && stage.requestFullscreen();
    else document.exitFullscreen && document.exitFullscreen();
  });

  // ---- export PNG (render the untransformed screen off-screen) ----
  $('#m-export').addEventListener('click', async () => {
    const btn = $('#m-export'), orig = btn.textContent;
    btn.disabled = true; btn.textContent = 'Rendering…';
    const host = document.createElement('div');
    host.style.cssText = 'position:fixed;left:-100000px;top:0;width:1080px;height:1920px;overflow:hidden;';
    const clone = phone.cloneNode(true);
    clone.style.transform = 'none';
    host.appendChild(clone);
    document.body.appendChild(host);
    try {
      const canvas = await html2canvas(clone, { width: 1080, height: 1920, scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false });
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = 'boss-message.png';
      document.body.append(a); a.click(); a.remove();
      $('#m-status').textContent = 'Downloaded boss-message.png (2160×3840, 9:16).';
    } catch (e) {
      $('#m-status').textContent = 'Export failed: ' + e.message + ' — you can also screenshot the preview.';
    } finally {
      host.remove(); btn.disabled = false; btn.textContent = orig;
    }
  });

  // init
  fit();
})();
