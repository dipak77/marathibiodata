/* ============================================================
   ShubhBiodata — Biodata Render Engine (Canvas 2x HD)
   Renders a 1224×1584 biodata over the selected theme frame
   with smart adaptive layout (single → compact → two-column).
   ============================================================ */
(function () {
  const W = 1224, H = 1584;                 // 2x of classic 612×792
  const MARGIN = 108;

  const INKS = {
    classic: { text: '#251a16', label: '#3a2420', accent: '#8a6a1f', head: '#5b1230' },
    maroon:  { text: '#4a1220', label: '#5f1730', accent: '#a17c22', head: '#701a38' },
    green:   { text: '#122b22', label: '#173c2e', accent: '#8a6a1f', head: '#175240' }
  };

  const FONT_HEAD = '"Tiro Devanagari Marathi","Noto Sans Devanagari","Mukta",serif';
  const FONT_BODY = '"Noto Sans Devanagari","Mukta","Tiro Devanagari Marathi",sans-serif';

  /* ---------- asset helpers ---------- */
  const themeCache = {};
  function themeExt(id) {
    const t = (window.TEMPLATES || []).find((x) => x.id === id);
    return (t && t.ext) || 'png';
  }
  function loadTheme(id) {
    return new Promise((resolve) => {
      const key = String(id);
      if (themeCache[key]) return resolve(themeCache[key]);
      const img = new Image();
      img.onload = () => { themeCache[key] = img; resolve(img); };
      img.onerror = () => resolve(null);
      img.src = 'theme/t-' + id + '.' + themeExt(id);
    });
  }
  function loadPhoto(dataUrl) {
    return new Promise((resolve) => {
      if (!dataUrl) return resolve(null);
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = dataUrl;
    });
  }

  /* ---------- text utilities ---------- */
  function devDigits(str) {
    if (str == null) return '';
    const d = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
    return String(str).replace(/[0-9]/g, (c) => d[+c]);
  }
  function formatDate(iso, B, lc) {
    if (!iso) return '';
    const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return iso;
    const out = parseInt(m[3], 10) + ' ' + (B.months[parseInt(m[2], 10) - 1] || '') + ' ' + m[1];
    return lc === 'en' ? out : devDigits(out);
  }
  function fmtNum(n, lc) {
    const s = String(n == null ? '' : n);
    return lc === 'en' ? s : devDigits(s);
  }
  function siblingStr(count, married, B, lc) {
    count = parseInt(count || 0, 10); married = parseInt(married || 0, 10);
    if (!count || isNaN(count)) return '';
    let s = fmtNum(count, lc);
    if (married > 0) s += ' (' + fmtNum(married, lc) + ' ' + B.marriedWord + ')';
    return s;
  }
  function wrap(ctx, text, maxWidth) {
    const words = String(text).split(/\s+/).filter(Boolean);
    const lines = [];
    let line = '';
    for (const w of words) {
      const t = line ? line + ' ' + w : w;
      if (ctx.measureText(t).width <= maxWidth || !line) line = t;
      else { lines.push(line); line = w; }
    }
    if (line) lines.push(line);
    return lines;
  }
  function fitFont(ctx, text, base, min, weight, family, maxWidth) {
    let size = base;
    ctx.font = weight + ' ' + size + 'px ' + family;
    while (size > min && ctx.measureText(text).width > maxWidth) {
      size -= 1;
      ctx.font = weight + ' ' + size + 'px ' + family;
    }
    return size;
  }

  /* ---------- decorations ---------- */
  function drawOrnament(ctx, cx, y, color) {
    ctx.save();
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 1.8;
    ctx.globalAlpha = .85;
    ctx.beginPath();
    ctx.moveTo(cx, y - 8); ctx.lineTo(cx + 8, y); ctx.lineTo(cx, y + 8); ctx.lineTo(cx - 8, y);
    ctx.closePath(); ctx.fill();
    // side wings with end dots (reference title rule)
    [-1, 1].forEach((s) => {
      ctx.beginPath(); ctx.moveTo(cx + s * 18, y); ctx.lineTo(cx + s * 96, y); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx + s * 108, y, 3, 0, Math.PI * 2); ctx.fill();
      // small flanking diamonds
      ctx.beginPath();
      const mx = cx + s * 128;
      ctx.moveTo(mx, y - 5); ctx.lineTo(mx + 5, y); ctx.lineTo(mx, y + 5); ctx.lineTo(mx - 5, y);
      ctx.closePath(); ctx.fill();
    });
    ctx.restore();
  }
  function sectionHeader(ctx, text, x, y, w, fonts, ink, s) {
    ctx.save();
    // Wine bar accent + label (reference style)
    ctx.font = '700 ' + Math.round(27 * s) + 'px ' + fonts.head;
    ctx.fillStyle = ink.head;
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    // small square marker
    ctx.fillStyle = ink.accent;
    ctx.fillRect(x, y - Math.round(22 * s), Math.round(5 * s), Math.round(24 * s));
    ctx.fillStyle = ink.head;
    ctx.fillText(text, x + Math.round(14 * s), y);
    const tw = ctx.measureText(text).width;
    ctx.strokeStyle = ink.accent; ctx.lineWidth = 2.4 * s;
    const lx = x + Math.min(w, tw + 150 * s);
    ctx.beginPath();
    ctx.moveTo(x + Math.round(14 * s), y + Math.round(13 * s));
    ctx.lineTo(lx, y + Math.round(13 * s));
    ctx.stroke();
    ctx.fillStyle = ink.accent;
    // end diamond + outer dot
    const dx = lx + Math.round(11 * s), dy = y + Math.round(13 * s), dr = Math.round(7.5 * s);
    ctx.beginPath();
    ctx.moveTo(dx, dy - dr); ctx.lineTo(dx + dr, dy); ctx.lineTo(dx, dy + dr); ctx.lineTo(dx - dr, dy);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.arc(dx + dr + Math.round(10 * s), dy, Math.round(3 * s), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return y + Math.round(42 * s);
  }
  function drawRow(ctx, label, value, x, y, labelW, valueMaxW, fonts, ink, s) {
    const fS = Math.round(26 * s);
    ctx.save();
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    const lSize = fitFont(ctx, label, fS, 15, '700', fonts.body, labelW - 6);
    ctx.font = '700 ' + lSize + 'px ' + fonts.body;
    ctx.fillStyle = ink.label;
    ctx.fillText(label, x, y);
    ctx.font = '700 ' + fS + 'px ' + fonts.body;
    ctx.fillStyle = ink.accent;
    ctx.fillText(':', x + labelW, y);
    let extra = 0;
    if (value) {
      const valueX = x + labelW + 26;
      ctx.fillStyle = ink.text;
      let vSize = fitFont(ctx, value, fS, Math.round(18 * s), '500', fonts.body, valueMaxW - 26);
      ctx.font = '500 ' + vSize + 'px ' + fonts.body;
      if (ctx.measureText(value).width > valueMaxW - 26) {
        const lines = wrap(ctx, value, valueMaxW - 26).slice(0, 2);
        lines.forEach((ln, i) => ctx.fillText(ln, valueX, y + i * Math.round(32 * s)));
        extra = (lines.length - 1) * Math.round(32 * s);
      } else {
        ctx.fillText(value, valueX, y);
      }
    }
    ctx.restore();
    return extra;
  }
  function roundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function drawPhoto(ctx, img, x, y, fw, fh) {
    // Outer drop + white mat + double gold rails + diamond accents (reference style)
    ctx.save();
    ctx.shadowColor = 'rgba(60,20,30,.38)'; ctx.shadowBlur = 28; ctx.shadowOffsetY = 12;
    roundedRect(ctx, x, y, fw, fh, 16);
    ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.shadowColor = 'transparent';
    const pad = 14;
    const iw = fw - pad * 2, ih = fh - pad * 2;
    const scale = Math.max(iw / img.width, ih / img.height);
    const sw = img.width * scale, sh = img.height * scale;
    roundedRect(ctx, x + pad, y + pad, iw, ih, 10);
    ctx.clip();
    ctx.drawImage(img, x + pad + (iw - sw) / 2, y + pad + (ih - sh) / 2, sw, sh);
    // Soft vignette inside photo for pro studio look
    const vg = ctx.createRadialGradient(x + fw / 2, y + fh / 2, Math.min(iw, ih) * 0.35, x + fw / 2, y + fh / 2, Math.max(iw, ih) * 0.72);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(40,10,20,.22)');
    ctx.fillStyle = vg;
    ctx.fillRect(x + pad, y + pad, iw, ih);
    ctx.restore();
    ctx.save();
    // Outer thick gold
    ctx.lineWidth = 5; ctx.strokeStyle = '#c79a3a';
    roundedRect(ctx, x, y, fw, fh, 16); ctx.stroke();
    // Inner thin gold
    ctx.lineWidth = 1.6; ctx.strokeStyle = 'rgba(236,207,130,.95)';
    roundedRect(ctx, x + 8, y + 8, fw - 16, fh - 16, 10); ctx.stroke();
    // Mid hairline
    ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(138,106,31,.45)';
    roundedRect(ctx, x + 12, y + 12, fw - 24, fh - 24, 8); ctx.stroke();
    // Corner + edge diamonds (reference)
    const diamond = (cx, cy, r, fill) => {
      ctx.fillStyle = fill || '#c79a3a';
      ctx.beginPath();
      ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r, cy); ctx.lineTo(cx, cy + r); ctx.lineTo(cx - r, cy);
      ctx.closePath(); ctx.fill();
    };
    const gold = '#c79a3a', gold2 = '#eccf82';
    diamond(x + fw / 2, y - 2, 9, gold);
    diamond(x + fw / 2, y + fh + 2, 9, gold);
    diamond(x - 2, y + fh / 2, 7, gold);
    diamond(x + fw + 2, y + fh / 2, 7, gold);
    diamond(x, y, 6, gold2);
    diamond(x + fw, y, 6, gold2);
    diamond(x, y + fh, 6, gold2);
    diamond(x + fw, y + fh, 6, gold2);
    // Small accent dots on edge diamonds
    [[x + fw / 2, y - 14], [x + fw / 2, y + fh + 14]].forEach(([cx, cy]) => {
      ctx.fillStyle = gold;
      ctx.beginPath(); ctx.arc(cx, cy, 3.2, 0, Math.PI * 2); ctx.fill();
    });
    ctx.restore();
  }
  function drawWatermark(ctx) {
    ctx.save();
    ctx.font = '800 34px ' + FONT_BODY;
    ctx.fillStyle = 'rgba(95,21,51,.10)';
    ctx.textAlign = 'center';
    ctx.translate(W / 2, H / 2);
    ctx.rotate(-Math.PI / 6.5);
    for (let y = -H; y < H; y += 130) {
      for (let x = -W; x < W; x += 640) {
        ctx.fillText('SHUBHBIODATA.COM', x + ((y / 130) % 2) * 320, y);
      }
    }
    ctx.restore();
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = '600 21px ' + FONT_BODY;
    ctx.fillStyle = 'rgba(95,21,51,.55)';
    ctx.fillText('✦  Created FREE on ShubhBiodata.com — remove watermark ₹49  ✦', W / 2, H - 52);
    ctx.restore();
  }

  /* ============ MAIN RENDER ============ */
  async function renderBiodata(canvas, state) {
    const T = window.$t(state.lang || 'mr');
    const B = T.biodata, lc = T.code;
    const ctx = canvas.getContext('2d');
    canvas.width = W; canvas.height = H;
    const ink = INKS[state.ink] || INKS.classic;
    const fonts = { head: FONT_HEAD, body: FONT_BODY };

    // 1 · background + theme frame
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H);
    const theme = await loadTheme(state.theme || 1);
    if (theme) ctx.drawImage(theme, 0, 0, W, H);
    const photo = await loadPhoto(state.photo);

    // 2 · header
    ctx.textAlign = 'center';
    const headCX = W / 2;
    const inv = (state.invocation || B.invocation).trim();
    if (inv) {
      ctx.fillStyle = ink.head;
      ctx.font = '600 30px ' + fonts.head;
      ctx.fillText(inv, headCX, 124);
    }
    const docT = (state.docTitle || B.docTitle).trim();
    if (docT) {
      fitFont(ctx, docT, 52, 34, '700', fonts.head, W - MARGIN * 2 - 120);
      ctx.fillStyle = ink.text;
      ctx.fillText(docT, headCX, 188);
    }
    drawOrnament(ctx, headCX, 216, ink.accent);

    // 3 · build content model
    const f = state.fields || {};
    const L = B.lbl, S = B.sec;
    const items = [];   // {type:'sec'|'row'|'para', ...}
    const addSection = (title, rows) => {
      const filled = rows.filter((r) => r[1]);
      if (!filled.length) return;
      items.push({ type: 'sec', text: title });
      filled.forEach((r) => items.push({ type: 'row', label: r[0], value: r[1] }));
    };

    addSection(S.personal, [
      [L.name, f.name], [L.caste, f.caste], [L.dob, formatDate(f.dob, B, lc)],
      [L.birthTime, f.birthTime], [L.birthPlace, f.birthPlace], [L.height, f.height],
      [L.weight, f.weight ? (lc === 'en' ? f.weight + ' ' + B.kg : fmtNum(f.weight, lc) + ' ' + B.kg) : ''],
      [L.complexion, f.complexion], [L.blood, f.blood]
    ]);
    addSection(S.astro, [
      [L.rashi, f.rashi], [L.nadi, f.nadi], [L.gan, f.gan],
      [L.mangal, f.mangal], [L.devak, f.devak], [L.gotra, f.gotra]
    ]);
    addSection(S.edu, [
      [L.education, f.education], [L.occupation, f.occupation], [L.income, f.income]
    ]);
    addSection(S.family, [
      [L.fatherName, f.fatherName], [L.fatherOcc, f.fatherOcc],
      [L.motherName, f.motherName], [L.motherOcc, f.motherOcc],
      [L.brothers, siblingStr(f.brothers, f.brothersMarried, B, lc)],
      [L.sisters, siblingStr(f.sisters, f.sistersMarried, B, lc)],
      [L.mama, f.mama], [L.relatives, f.relatives]
    ]);
    addSection(S.contact, [[L.contact, f.contact], [L.address, f.address]]);
    if (f.expectations) { items.push({ type: 'sec', text: S.expect }); items.push({ type: 'para', text: f.expectations }); }

    // 4 · layout constants
    const y0 = 292;
    const maxY = state.premium ? H - 84 : H - 112;
    const PHOTO_W = 352, PHOTO_H = 446;
    const photoX = W - MARGIN - PHOTO_W, photoY = y0, photoBottom = photoY + PHOTO_H;

    // measure item heights at scale s
    function itemHeight(it, s, colW) {
      if (it.type === 'sec') return Math.round(94 * s);
      if (it.type === 'para') {
        ctx.font = '500 ' + Math.round(25 * s) + 'px ' + fonts.body;
        const rows = Math.min(4, wrap(ctx, it.text, colW).length);
        it._lines = rows;
        return rows * Math.round(40 * s) + Math.round(18 * s);
      }
      return Math.round(52 * s);
    }
    function totalFor(list, s, colW) {
      let t = 0;
      list.forEach((it) => { t += itemHeight(it, s, colW); });
      return t;
    }

    // draw a column
    function drawColumn(list, x, y, colW, s, avoidPhotoRight) {
      const labelW = colW > 700 ? 236 : Math.round(colW * 0.42);
      list.forEach((it, idx) => {
        if (it.type === 'sec') {
          if (idx > 0) y += Math.round(26 * s);
          y = sectionHeader(ctx, it.text, x, y + Math.round(26 * s), colW, fonts, ink, s);
          return;
        }
        if (it.type === 'para') {
          ctx.save();
          ctx.textAlign = 'left';
          ctx.font = '500 ' + Math.round(25 * s) + 'px ' + fonts.body;
          ctx.fillStyle = ink.text;
          let pw = colW;
          if (avoidPhotoRight && photo && y < photoBottom + 6) pw = photoX - x - 40;
          const lines = wrap(ctx, it.text, pw).slice(0, it._lines || 4);
          lines.forEach((ln) => { y += Math.round(42 * s); ctx.fillText(ln, x, y); });
          y += Math.round(16 * s);
          ctx.restore();
          return;
        }
        y += Math.round(50 * s);
        let vw = colW;
        if (avoidPhotoRight && photo && y < photoBottom + 6) vw = photoX - x - 40;
        y += drawRow(ctx, it.label, it.value, x, y, labelW, vw, fonts, ink, s);
      });
      return y;
    }

    const contentW = W - MARGIN * 2;
    let mode = 'single', sTier = 1;

    // try single column with shrinking tiers
    const tiers = [1, 0.94, 0.88, 0.82, 0.76, 0.70];
    for (const s of tiers) {
      if (totalFor(items, s, contentW) <= (maxY - y0)) { mode = 'single'; sTier = s; break; }
    }
    if (totalFor(items, 0.70, contentW) > (maxY - y0)) {
      // two-column fallback: split at section boundaries (balanced)
      mode = 'two';
      const gutter = 44;
      const colW = (contentW - gutter) / 2;
      // find split index: prefer after edu section
      let splitIdx = -1;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type === 'sec' && (items[i].text === S.family || items[i].text === S.contact)) { splitIdx = i; break; }
      }
      if (splitIdx <= 0) splitIdx = Math.ceil(items.length / 2);
      const left = items.slice(0, splitIdx), right = items.slice(splitIdx);
      sTier = 0.9;
      for (const s of [0.9, 0.84, 0.78, 0.72, 0.66, 0.60, 0.55]) {
        const leftH = totalFor(left, s, colW);
        const rightH = totalFor(right, s, colW);
        const rightStart = photo ? photoBottom + 30 : y0;
        if (leftH <= (maxY - y0) && rightH <= (maxY - rightStart)) { sTier = s; break; }
        sTier = s;
      }
      // Draw with best-effort tier; clip anything past maxY so nothing bleeds off-page
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, W, maxY + 24);
      ctx.clip();
      drawColumn(left, MARGIN, y0, colW, sTier, false);
      drawColumn(right, MARGIN + colW + gutter, photo ? photoBottom + 30 : y0, colW, sTier, false);
      ctx.restore();
    } else {
      drawColumn(items, MARGIN, y0, contentW, sTier, true);
    }

    // 5 · photo
    if (photo) drawPhoto(ctx, photo, photoX, photoY, PHOTO_W, PHOTO_H);

    // 6 · watermark for free plan
    if (!state.premium) drawWatermark(ctx);

    return canvas;
  }

  /* Preload fonts used by the canvas */
  function ensureFonts() {
    const specs = [
      '600 30px "Tiro Devanagari Marathi"',
      '700 52px "Tiro Devanagari Marathi"',
      '700 27px "Noto Sans Devanagari"',
      '500 27px "Noto Sans Devanagari"',
      '800 34px "Mukta"'
    ];
    specs.forEach((s) => { try { document.fonts.load(s, '॥ श्री गणेशाय नमः ॥ बायोडाटा 0123456789'); } catch (e) {} });
    return document.fonts.ready;
  }

  window.BioRender = { renderBiodata, ensureFonts, W, H, devDigits };
})();
