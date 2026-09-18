/* ============================================================
   ShubhBiodata — Builder Studio (wizard + live preview + exports)
   ============================================================ */
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const DRAFT_KEY = 'shubhbiodata.draft.v2';
  const PRO_KEY = 'shubhbiodata.pro.v2';

  /* ---------------- State ---------------- */
  function defaultState(lang) {
    const B = window.$t(lang).biodata;
    return {
      lang: lang || 'mr',
      step: 1,
      theme: 6,
      ink: 'classic',
      invocation: B.invocation,
      docTitle: B.docTitle,
      photo: null,
      premium: proUnlocked(),
      fields: {
        name: '', caste: '', dob: '', birthTime: '', birthPlace: '',
        height: '', weight: '', complexion: '', blood: '',
        rashi: '', nadi: '', gan: '', mangal: '', devak: '', gotra: '',
        education: '', occupation: '', income: '',
        fatherName: '', fatherOcc: '', motherName: '', motherOcc: '',
        brothers: 0, brothersMarried: 0, sisters: 0, sistersMarried: 0,
        mama: '', relatives: '', contact: '', address: '', expectations: ''
      }
    };
  }
  function proUnlocked() { return localStorage.getItem(PRO_KEY) === '1'; }

  let state = defaultState('mr');
  try {
    const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
    if (d && d.fields) { state = Object.assign(defaultState(d.lang || 'mr'), d); }
  } catch (e) { /* fresh */ }

  // theme via url param
  const urlTheme = parseInt(new URLSearchParams(location.search).get('theme') || '', 10);
  if (urlTheme >= 1 && urlTheme <= 20) state.theme = urlTheme;

  /* ---------------- Toasts ---------------- */
  function toast(msg) {
    const zone = $('#toastZone');
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M20 6L9 17l-5-5"/></svg>' + msg;
    zone.appendChild(el);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 350); }, 2600);
  }

  /* ---------------- Persistence ---------------- */
  let saveTimer = null;
  function scheduleSave() {
    const chip = $('#saveChip');
    chip.classList.add('saving');
    $('#saveChipTxt').textContent = ui('saving');
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify(state)); } catch (e) { /* photo too big */ }
      chip.classList.remove('saving');
      $('#saveChipTxt').textContent = ui('saved') + ' · ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }, 500);
  }

  /* ---------------- i18n helpers ---------------- */
  function ui(key) { return ($('#builderRoot') && window.$t(state.lang).builder[key]) || key; }
  function T() { return window.$t(state.lang); }

  /* ---------------- Channel: render preview ---------------- */
  const canvas = $('#bioCanvas');
  let renderTimer = null;
  function scheduleRender() {
    clearTimeout(renderTimer);
    renderTimer = setTimeout(() => {
      window.BioRender.renderBiodata(canvas, state);
      scheduleSave();
    }, 120);
  }

  /* ---------------- Theme picker ---------------- */
  function buildThemePicker() {
    const grid = $('#themeGrid');
    grid.innerHTML = '';
    window.TEMPLATES.forEach((t) => {
      const isFree = t.free, unlocked = state.premium || isFree;
      const name = t.name[state.lang] || t.name.en;
      const cell = document.createElement('div');
      cell.className = 'tmpl-pick' + (state.theme === t.id ? ' sel' : '');
      cell.innerHTML =
        '<img loading="lazy" src="theme/t-' + t.id + '.png" alt="' + name + '">' +
        '<span class="tp-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4"><path d="M20 6L9 17l-5-5"/></svg></span>' +
        (unlocked ? '' : '<span class="tp-lock">✦ PRO</span>');
      cell.title = name + (unlocked ? '' : ' (PRO)');
      cell.addEventListener('click', () => {
        if (!state.premium && !t.free) { openPremium(); return; }
        state.theme = t.id;
        $$('.tmpl-pick', grid).forEach((x) => x.classList.remove('sel'));
        cell.classList.add('sel');
        scheduleRender();
      });
      grid.appendChild(cell);
    });
  }

  /* ---------------- Select options ---------------- */
  function fillSelect(sel, options, placeholder) {
    const cur = sel.value;
    sel.innerHTML = '<option value="">— ' + (placeholder || '') + ' —</option>' +
      options.map((o) => '<option>' + o + '</option>').join('');
    if (cur) sel.value = cur;
    else sel.selectedIndex = 0;
  }
  function buildSelects() {
    const B = T().biodata, lc = T().code;
    const heights = [];
    for (let ft = 4; ft <= 6; ft++) for (let inch = 0; inch <= 11; inch++) {
      if (ft === 6 && inch > 5) break;
      const v = ft + "'" + inch + '"';
      heights.push(lc === 'en' ? v : window.BioRender.devDigits(v));
    }
    fillSelect($('#fHeight'), heights, ui('height'));
    if (state.fields.height) $('#fHeight').value = state.fields.height;
    fillSelect($('#fComplexion'), B.opt.complexion, ui('complexion'));
    fillSelect($('#fBlood'), B.opt.blood, ui('blood'));
    fillSelect($('#fRashi'), B.opt.rashi, ui('rashi'));
    fillSelect($('#fNadi'), B.opt.nadi, ui('nadi'));
    fillSelect($('#fGan'), B.opt.gan, ui('gan'));
    fillSelect($('#fMangal'), B.opt.mangal, ui('mangal'));
    ['complexion', 'blood', 'rashi', 'nadi', 'gan', 'mangal'].forEach((k, i) => {
      const sel = [null, $('#fComplexion'), $('#fBlood'), $('#fRashi'), $('#fNadi'), $('#fGan'), $('#fMangal')][i + 1];
      if (sel && state.fields[k]) sel.value = state.fields[k];
    });
  }

  /* ---------------- Form bindings ---------------- */
  const FIELD_MAP = [
    ['fName', 'name'], ['fCaste', 'caste'], ['fDob', 'dob'], ['fBirthTime', 'birthTime'],
    ['fBirthPlace', 'birthPlace'], ['fHeight', 'height'], ['fWeight', 'weight'],
    ['fComplexion', 'complexion'], ['fBlood', 'blood'], ['fRashi', 'rashi'], ['fNadi', 'nadi'],
    ['fGan', 'gan'], ['fMangal', 'mangal'], ['fDevak', 'devak'], ['fGotra', 'gotra'],
    ['fEdu', 'education'], ['fOcc', 'occupation'], ['fIncome', 'income'],
    ['fFather', 'fatherName'], ['fFatherOcc', 'fatherOcc'], ['fMother', 'motherName'],
    ['fMotherOcc', 'motherOcc'], ['fMama', 'mama'], ['fRelatives', 'relatives'],
    ['fContact', 'contact'], ['fAddress', 'address'], ['fExpect', 'expectations']
  ];
  function bindForm() {
    FIELD_MAP.forEach(([id, key]) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (state.fields[key]) el.value = state.fields[key];
      el.addEventListener('input', () => { state.fields[key] = el.value.trim(); scheduleRender(); });
      el.addEventListener('change', () => { state.fields[key] = el.value.trim(); scheduleRender(); });
    });
    $('#fInvocation').value = state.invocation;
    $('#fDocTitle').value = state.docTitle;
    $('#fInvocation').addEventListener('input', (e) => { state.invocation = e.target.value; scheduleRender(); });
    $('#fDocTitle').addEventListener('input', (e) => { state.docTitle = e.target.value; scheduleRender(); });

    // ink swatches
    $$('.ink-dot').forEach((d) => {
      d.classList.toggle('sel', d.dataset.ink === state.ink);
      d.addEventListener('click', () => {
        state.ink = d.dataset.ink;
        $$('.ink-dot').forEach((x) => x.classList.remove('sel'));
        d.classList.add('sel');
        scheduleRender();
      });
    });

    // sibling steppers
    [['brothers', 'brothersMarried'], ['sisters', 'sistersMarried']].forEach(([k, km]) => {
      const val = $('#cv-' + k), mval = $('#cv-' + km), mrow = $('#row-' + km);
      const paint = () => {
        val.textContent = window.BioRender.devDigits(String(state.fields[k]));
        mval.textContent = window.BioRender.devDigits(String(state.fields[km]));
        mrow.style.display = state.fields[k] > 0 ? 'flex' : 'none';
      };
      $$('[data-count="' + k + '"]').forEach((b) => b.addEventListener('click', () => {
        state.fields[k] = Math.min(9, Math.max(0, state.fields[k] + (b.dataset.dir === '+' ? 1 : -1)));
        if (state.fields[k] < state.fields[km]) state.fields[km] = state.fields[k];
        paint(); scheduleRender();
      }));
      $$('[data-count="' + km + '"]').forEach((b) => b.addEventListener('click', () => {
        state.fields[km] = Math.min(state.fields[k], Math.max(0, state.fields[km] + (b.dataset.dir === '+' ? 1 : -1)));
        paint(); scheduleRender();
      }));
      paint();
    });
  }

  /* ---------------- Apply language to static UI ---------------- */
  function applyLang() {
    const B = T().builder;
    document.documentElement.lang = T().code;
    const map = {
      s1Title: 's1t', s1Sub: 's1p', s2Title: 's2t', s2Sub: 's2p',
      s3Title: 's3t', s3Sub: 's3p', s4Title: 's4t', s4Sub: 's4p', s5Title: 's5t', s5Sub: 's5p'
    };
    Object.keys(map).forEach((id) => { const el = document.getElementById(id); if (el) el.textContent = B[map[id]]; });
    $('#brandStepBack').textContent = '← ' + B.back;
    $$('#stepper .stepper-btn').forEach((b, i) => { b.querySelector('.s-lbl').textContent = B.steps[i]; });
    $$('[data-bui]').forEach((el) => {
      const k = el.getAttribute('data-bui');
      const v = B[k];
      if (typeof v === 'string') el.innerHTML = v;
    });
    $$('.ink-dot').forEach((d) => { d.title = B['ink' + d.dataset.ink.charAt(0).toUpperCase() + d.dataset.ink.slice(1)]; });
    // defaults for lang-specific headers if untouched defaults of another lang
    const BD = T().biodata;
    const otherLangs = ['mr', 'hi', 'en'].filter((l) => l !== state.lang);
    if (otherLangs.some((l) => state.invocation === window.$t(l).biodata.invocation)) {
      state.invocation = BD.invocation; $('#fInvocation').value = BD.invocation;
    }
    if (otherLangs.some((l) => state.docTitle === window.$t(l).biodata.docTitle)) {
      state.docTitle = BD.docTitle; $('#fDocTitle').value = BD.docTitle;
    }
    $$('.lang-toggle button').forEach((b) => b.classList.toggle('active', b.dataset.lang === state.lang));
    buildSelects();
    buildThemePicker();
    updatePlanUI();
    scheduleRender();
  }

  $$('.lang-toggle button').forEach((b) => b.addEventListener('click', () => {
    if (state.lang === b.dataset.lang) return;
    state.lang = b.dataset.lang;
    applyLang();
  }));

  /* ---------------- Wizard ---------------- */
  function gotoStep(n) {
    state.step = Math.min(5, Math.max(1, n));
    $$('.step-panel').forEach((p) => p.classList.toggle('active', +p.dataset.step === state.step));
    $$('#stepper .stepper-btn').forEach((b, i) => {
      b.classList.toggle('active', i + 1 === state.step);
      b.classList.toggle('done', i + 1 < state.step);
    });
    $$('#stepper .stepper-btn .s-num').forEach((nEl, i) => {
      nEl.innerHTML = (i + 1 < state.step)
        ? '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="3.4"><path d="M20 6L9 17l-5-5"/></svg>'
        : (i + 1);
    });
    $('#btnPrev').style.visibility = state.step === 1 ? 'hidden' : 'visible';
    $('#btnNext').innerHTML = state.step === 5 ? ui('finish') : ui('next');
    $('#panelCard').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    scheduleSave();
  }
  $('#btnPrev').addEventListener('click', () => gotoStep(state.step - 1));
  $('#btnNext').addEventListener('click', () => {
    if (state.step === 2 && !state.fields.name.trim()) { toast(ui('fillName')); $('#fName').focus(); return; }
    if (state.step === 5) { gotoStep(5); return; }
    gotoStep(state.step + 1);
  });
  $$('#stepper .stepper-btn').forEach((b) => b.addEventListener('click', () => gotoStep(+b.dataset.step)));

  /* ---------------- Photo upload & cropper ---------------- */
  const crop = { img: null, scale: 1, minScale: 1, x: 0, y: 0, drag: null };
  const cropStage = $('#cropStage'), cropImg = $('#cropImg');

  function openCropper(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        crop.img = img;
        cropImg.src = e.target.result;
        $('#cropModal').classList.add('open');
        requestAnimationFrame(() => requestAnimationFrame(cropFit));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
  function cropGeom() {
    const w = cropStage.clientWidth, h = cropStage.clientHeight;
    return { fx: w * 0.08, fy: h * 0.08, fw: w * 0.84, fh: h * 0.84 };
  }
  function cropFit() {
    const g = cropGeom();
    crop.minScale = Math.max(g.fw / crop.img.width, g.fh / crop.img.height);
    crop.scale = crop.minScale;
    crop.x = g.fx + (g.fw - crop.img.width * crop.scale) / 2;
    crop.y = g.fy + (g.fh - crop.img.height * crop.scale) / 2;
    $('#cropZoom').value = 1;
    cropPaint();
  }
  function cropClamp() {
    const g = cropGeom();
    const iw = crop.img.width * crop.scale, ih = crop.img.height * crop.scale;
    crop.x = Math.min(g.fx, Math.max(g.fx + g.fw - iw, crop.x));
    crop.y = Math.min(g.fy, Math.max(g.fy + g.fh - ih, crop.y));
  }
  function cropPaint() {
    cropClamp();
    cropImg.style.transform = 'translate(' + crop.x + 'px,' + crop.y + 'px) scale(' + crop.scale + ')';
  }
  cropStage.addEventListener('pointerdown', (e) => {
    crop.drag = { sx: e.clientX, sy: e.clientY, ox: crop.x, oy: crop.y };
    cropStage.setPointerCapture(e.pointerId);
  });
  cropStage.addEventListener('pointermove', (e) => {
    if (!crop.drag) return;
    crop.x = crop.drag.ox + (e.clientX - crop.drag.sx);
    crop.y = crop.drag.oy + (e.clientY - crop.drag.sy);
    cropPaint();
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach((ev) =>
    cropStage.addEventListener(ev, () => { crop.drag = null; }));
  $('#cropZoom').addEventListener('input', (e) => {
    const k = parseFloat(e.target.value);
    const g = cropGeom();
    const cx = g.fx + g.fw / 2, cy = g.fy + g.fh / 2;
    const ns = crop.minScale * k;
    crop.x = cx - (cx - crop.x) * (ns / crop.scale);
    crop.y = cy - (cy - crop.y) * (ns / crop.scale);
    crop.scale = ns;
    cropPaint();
  });
  $('#cropCancel').addEventListener('click', () => $('#cropModal').classList.remove('open'));
  $('#cropApply').addEventListener('click', () => {
    const g = cropGeom();
    const out = document.createElement('canvas');
    out.width = 704; out.height = 892;
    const ctx = out.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, out.width, out.height);
    // map frame rect to output
    const sx = (g.fx - crop.x) / crop.scale, sy = (g.fy - crop.y) / crop.scale;
    const sw = g.fw / crop.scale, sh = g.fh / crop.scale;
    ctx.drawImage(crop.img, sx, sy, sw, sh, 0, 0, out.width, out.height);
    state.photo = out.toDataURL('image/jpeg', 0.9);
    $('#cropModal').classList.remove('open');
    renderPhotoChip();
    scheduleRender();
    toast(ui('toastPhoto'));
  });

  function renderPhotoChip() {
    $('#photoDrop').style.display = state.photo ? 'none' : 'block';
    $('#photoChip').style.display = state.photo ? 'flex' : 'none';
    if (state.photo) $('#photoChipImg').src = state.photo;
  }
  $('#photoDrop').addEventListener('click', () => $('#photoInput').click());
  $('#photoChangeBtn').addEventListener('click', () => $('#photoInput').click());
  $('#photoRemoveBtn').addEventListener('click', () => { state.photo = null; renderPhotoChip(); scheduleRender(); });
  $('#photoInput').addEventListener('change', (e) => {
    const f = e.target.files && e.target.files[0];
    if (f) openCropper(f);
    e.target.value = '';
  });
  // drag & drop
  $('#photoDrop').addEventListener('dragover', (e) => { e.preventDefault(); });
  $('#photoDrop').addEventListener('drop', (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    if (f && f.type.startsWith('image/')) openCropper(f);
  });

  /* ---------------- Premium ---------------- */
  function updatePlanUI() {
    const pro = state.premium;
    $('#planChip').innerHTML = pro
      ? '<span class="badge badge-pro wm-chip">✦ ' + ui('proPlan') + '</span>'
      : '<span class="badge badge-soft wm-chip">' + ui('freePlan') + '</span>';
    $('#btnUnlock').style.display = pro ? 'none' : 'inline-flex';
    $$('.dl-lock').forEach((el) => el.style.display = pro ? 'none' : 'inline');
    $('#wmNote').style.display = pro ? 'none' : 'block';
    buildThemePicker();
  }
  function openPremium() { $('#premiumModal').classList.add('open'); }
  function closePremium() { $('#premiumModal').classList.remove('open'); }
  $('#btnUnlock').addEventListener('click', openPremium);
  $('#pmClose').addEventListener('click', closePremium);
  $$('.dl-pro').forEach((b) => b.addEventListener('click', () => {
    if (!state.premium) { openPremium(); return; }
    download(b.dataset.fmt);
  }));
  $('#btnJpg').addEventListener('click', () => download('jpg'));
  $('#pmPay').addEventListener('click', () => {
    // UPI intent (works on mobile devices with a UPI app); falls through to demo
    const upi = 'upi://pay?pa=shubhbiodata@upi&pn=ShubhBiodata&am=49&cu=INR&tn=PremiumHD';
    window.location.href = upi;
    setTimeout(unlockPro, 1500);
  });
  $('#pmDemo').addEventListener('click', unlockPro);
  function unlockPro() {
    state.premium = true;
    localStorage.setItem(PRO_KEY, '1');
    closePremium();
    updatePlanUI();
    scheduleRender();
    toast(ui('toastPro'));
  }

  /* ---------------- Mobile preview toggle ---------------- */
  $$('.pv-tab').forEach((t) => t.addEventListener('click', () => {
    $$('.pv-tab').forEach((x) => x.classList.remove('active'));
    t.classList.add('active');
    $('#panelCard').style.display = t.dataset.view === 'form' ? '' : 'none';
    $('#previewSide').style.display = t.dataset.view === 'preview' ? '' : 'none';
    if (t.dataset.view === 'preview') scheduleRender();
  }));
  function syncMobileTabs() {
    if (window.innerWidth > 1080) {
      $('#panelCard').style.display = ''; $('#previewSide').style.display = '';
    } else {
      const active = $('.pv-tab.active');
      const view = active ? active.dataset.view : 'form';
      $('#panelCard').style.display = view === 'form' ? '' : 'none';
      $('#previewSide').style.display = view === 'preview' ? '' : 'none';
    }
  }
  window.addEventListener('resize', syncMobileTabs);

  /* ---------------- Downloads ---------------- */
  function fileBase() { return 'shubh-biodata-' + (state.fields.name || 'marathi').toString().replace(/\s+/g, '-').toLowerCase().slice(0, 40); }

  function download(fmt) {
    window.BioRender.renderBiodata(canvas, state).then(() => {
      const url = fmt === 'png'
        ? canvas.toDataURL('image/png')
        : canvas.toDataURL('image/jpeg', 0.94);
      if (fmt === 'pdf') {
        try {
          const { jsPDF } = window.jspdf || {};
          const doc = jsPDF ? new jsPDF({ unit: 'mm', format: 'a4', orientation: 'p' })
            : new window.jsPDF('p', 'mm', 'a4');
          doc.addImage(url, 'JPEG', 0, 0, 210, 297);
          doc.save(fileBase() + '.pdf');
        } catch (e) {
          // fallback: save as image if jsPDF unavailable
          trigger(url, fileBase() + '.jpg');
        }
      } else {
        trigger(url, fileBase() + '.' + (fmt === 'png' ? 'png' : 'jpg'));
      }
      toast(ui('toastDl'));
    });
  }
  function trigger(url, name) {
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
  }

  /* ---------------- Share ---------------- */
  $('#btnShare').addEventListener('click', async () => {
    try {
      const isPro = state.premium;
      canvas.toBlob(async (blob) => {
        const file = new File([blob], fileBase() + '.jpg', { type: 'image/jpeg' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: 'ShubhBiodata', text: T().hero.titleA + ' ' + (isPro ? '⭐' : '') });
        } else {
          toast(ui('wmNote').split('।')[0]);
        }
      }, 'image/jpeg', 0.92);
    } catch (e) { /* cancelled */ }
  });

  /* ---------------- Reset ---------------- */
  $('#btnReset').addEventListener('click', () => {
    const keep = { lang: state.lang, premium: state.premium };
    state = defaultState(keep.lang);
    state.premium = keep.premium;
    localStorage.removeItem(DRAFT_KEY);
    bindForm(); applyLang(); renderPhotoChip(); gotoStep(1);
    toast(ui('toastReset'));
  });

  /* ---------------- Init ---------------- */
  window.BioRender.ensureFonts().then(() => scheduleRender());
  buildSelects();
  buildThemePicker();
  bindForm();
  applyLang();
  renderPhotoChip();
  gotoStep(state.step || 1);
  syncMobileTabs();

  // expose tiny api for modals in template
  window.BuilderApp = { gotoStep, toast };
})();
