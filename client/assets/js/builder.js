/* ============================================================
   ShubhBiodata — SUPER PREMIUM Builder Studio v3.0
   Wizard + Live Preview + Premium Exports + Enhanced UX + Transliteration
   ============================================================ */
(function () {
  'use strict';

  // ---------- DOM Helpers ----------
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const el = (tag, attrs = {}, ...children) => {
    const node = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'class') node.className = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
      else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v);
    });
    children.flat().forEach(c => {
      if (c == null) return;
      node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return node;
  };

  // ---------- Constants ----------
  const DRAFT_KEY = 'shubhbiodata.draft.v3';
  const PRO_KEY = 'shubhbiodata.pro.v3';
  const THEME_KEY = 'shubhbiodata.ui.theme.v3';
  const TOTAL_STEPS = 5;

  // ---------- State ----------
  function defaultState(lang = 'mr') {
    const t = window.$t ? window.$t(lang) : null;
    const B = (t && t.biodata) || { invocation: '॥ श्री गणेशाय नमः ॥', docTitle: 'बायोडाटा' };
    return {
      lang: lang || 'mr',
      step: 1,
      theme: 6,
      ink: 'classic',
      invocation: B.invocation,
      docTitle: B.docTitle,
      photo: null,
      premium: proUnlocked(),
      zoomLevel: 100,
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

  function proUnlocked() {
    return localStorage.getItem(PRO_KEY) === '1' || localStorage.getItem('shubhbiodata.pro.v2') === '1';
  }

  function sampleFields(lang) {
    if (window.SampleData) return window.SampleData.sampleFields(lang);
    return {};
  }

  let state = defaultState('mr');
  let isTranslating = false;
  let hasDraft = false;

  // Load draft
  try {
    const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || localStorage.getItem('shubhbiodata.draft.v2') || 'null');
    if (d && d.fields) {
      hasDraft = true;
      state = Object.assign(defaultState(d.lang || 'mr'), d);
      // Never restore premium from a draft — only from PRO_KEY
      state.premium = proUnlocked();
      if (state.theme < 1 || state.theme > (window.TEMPLATES ? window.TEMPLATES.length : 20)) state.theme = 6;
    }
  } catch (e) { /* fresh start */ }

  // Prefill sample biodata + pro photo on fresh visits (no draft yet)
  if (!hasDraft) {
    Object.assign(state.fields, sampleFields(state.lang));
    if (window.SampleData && !state.photo) state.photo = window.SampleData.PHOTO;
  }

  // URL theme override (supports both numbers 1-20 and named theme slugs)
  const themeNameMap = {
    'rajmudra': 6, 'paramparik': 1, 'soneri': 5, 'morpankh': 4,
    'kashi': 7, 'velbutti': 8, 'gulabi': 10, 'rajnila': 14,
    'jhendu': 3, 'nirajan': 9, 'minimal': 2, 'hastidanti': 11
  };
  const themeParam = (new URLSearchParams(location.search).get('theme') || '').toLowerCase().trim();
  if (themeNameMap[themeParam]) {
    state.theme = themeNameMap[themeParam];
  } else {
    const urlTheme = parseInt(themeParam, 10);
    const maxTheme = window.TEMPLATES ? window.TEMPLATES.length : 20;
    if (urlTheme >= 1 && urlTheme <= maxTheme) state.theme = urlTheme;
  }

  // ---------- i18n helpers ----------
  function ui(key) {
    const t = window.$t && window.$t(state.lang);
    return (t && t.builder && t.builder[key]) || key;
  }
  function T() { return window.$t ? window.$t(state.lang) : {}; }

  // ---------- Toast Notifications ----------
  const TOAST_ICONS = {
    success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>',
    error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
    warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
  };

  function toast(msg, type = 'success', duration = 3000) {
    const zone = $('#toastZone');
    if (!zone) return;

    const t = el('div', { class: `toast toast-${type}` });
    t.innerHTML = `${TOAST_ICONS[type] || TOAST_ICONS.success}<span>${msg}</span>`;
    zone.appendChild(t);

    setTimeout(() => {
      t.classList.add('out');
      setTimeout(() => t.remove(), 400);
    }, duration);
  }

  // ---------- Save System ----------
  let saveTimer = null;
  function scheduleSave() {
    const chip = $('#saveChip');
    const txt = $('#saveChipTxt');
    if (chip) chip.classList.add('saving');
    if (txt) txt.textContent = ui('saving') || 'Saving...';

    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        const saveState = { ...state };
        delete saveState.premium; // premium lives only in PRO_KEY, never in drafts
        if (saveState.photo && saveState.photo.length > 500000) {
          saveState.photo = null;
          if (txt) txt.textContent = 'Photo too large for draft';
          console.warn('Photo exceeds 500KB draft limit — not persisted.');
        }
        localStorage.setItem(DRAFT_KEY, JSON.stringify(saveState));
        if (chip) chip.classList.remove('saving');
        if (txt) {
          const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          txt.textContent = `${ui('saved') || 'Saved'} · ${time}`;
        }
      } catch (e) {
        console.warn('Save failed:', e);
        if (txt) txt.textContent = 'Save failed';
      }
    }, 600);
  }

  // ---------- Progress Bar ----------
  function updateProgress() {
    const fill = $('#progressFill');
    const cur = $('#progressCurrent');
    const total = $('#progressTotal');
    if (fill) fill.style.width = `${(state.step / TOTAL_STEPS) * 100}%`;
    if (cur) cur.textContent = state.step;
    if (total) total.textContent = TOTAL_STEPS;
  }

  // ---------- Character Counters ----------
  function initCounters() {
    const pairs = [
      ['fInvocation', 'fInvocationCount', 48],
      ['fDocTitle', 'fDocTitleCount', 30],
      ['fExpect', 'fExpectCount', 150]
    ];
    pairs.forEach(([inputId, counterId, max]) => {
      const input = $(`#${inputId}`);
      const counter = $(`#${counterId}`);
      if (!input || !counter) return;
      const update = () => {
        const len = input.value.length;
        counter.textContent = len;
        const wrap = counter.closest('.char-count');
        if (wrap) wrap.classList.toggle('warn', len > max * 0.9);
      };
      input.addEventListener('input', update);
      update();
    });
  }

  // ---------- Render Preview Channel ----------
  const canvas = $('#bioCanvas');
  let renderTimer = null;

  function scheduleRender() {
    clearTimeout(renderTimer);
    renderTimer = setTimeout(() => {
      if (window.BioRender && canvas) {
        window.BioRender.renderBiodata(canvas, state);
      }
      scheduleSave();
    }, 120);
  }

  // ---------- Theme picker filled thumbs (sample + photo) ----------
  const thumbCache = new Map();
  const thumbQueue = [];
  let thumbBusy = false;
  let thumbFonts = null;
  let thumbIO = null;

  function ensureThumbFonts() {
    if (!window.BioRender) return Promise.resolve();
    if (!thumbFonts) thumbFonts = window.BioRender.ensureFonts().catch(() => {});
    return thumbFonts;
  }

  function renderThumbUrl(id, lg) {
    const key = id + ':' + lg;
    if (thumbCache.has(key)) return Promise.resolve(thumbCache.get(key));
    if (!window.BioRender || !window.SampleData) return Promise.resolve(null);
    return ensureThumbFonts().then(() => {
      const c = document.createElement('canvas');
      const st = window.SampleData.stateFor(id, lg);
      return window.BioRender.renderBiodata(c, st).then(() => {
        let url = null;
        try { url = c.toDataURL('image/jpeg', 0.82); } catch (e) { /* tainted */ }
        if (url) thumbCache.set(key, url);
        return url;
      });
    }).catch(() => null);
  }

  function queueThemeThumb(img) {
    if (!img) return;
    if (!thumbIO) {
      thumbIO = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          thumbIO.unobserve(e.target);
          thumbQueue.push(e.target);
          if (!thumbBusy) drainThumbs();
        });
      }, { rootMargin: '200px 0px' });
    }
    thumbIO.observe(img);
  }

  function drainThumbs() {
    if (!thumbQueue.length) { thumbBusy = false; return; }
    thumbBusy = true;
    const img = thumbQueue.shift();
    if (!img.isConnected) { requestAnimationFrame(() => drainThumbs()); return; }
    const id = parseInt(img.dataset.themeId, 10);
    const lg = img.dataset.lang || state.lang;
    if (!id) { requestAnimationFrame(() => drainThumbs()); return; }
    if (thumbCache.has(id + ':' + lg)) {
      img.src = thumbCache.get(id + ':' + lg);
      img.classList.add('loaded');
      requestAnimationFrame(() => drainThumbs());
      return;
    }
    renderThumbUrl(id, lg).then((url) => {
      if (url && img.isConnected) {
        img.src = url;
        img.classList.add('loaded');
      }
      requestAnimationFrame(() => drainThumbs());
    });
  }

  // ---------- Theme Picker ----------
  function buildThemePicker() {
    const grid = $('#themeGrid');
    if (!grid || !window.TEMPLATES) return;
    grid.innerHTML = '';

    window.TEMPLATES.forEach(t => {
      const unlocked = state.premium || t.free;
      const name = t.name[state.lang] || t.name.en;
      const cell = el('div', {
        class: `tmpl-pick ${state.theme === t.id ? 'sel' : ''}`,
        role: 'radio',
        'aria-checked': state.theme === t.id,
        tabindex: '0'
      });
      cell.innerHTML = `
        <img loading="lazy" data-theme-id="${t.id}" data-lang="${state.lang}" src="${window.themeSrc ? window.themeSrc(t.id) : 'theme/t-' + t.id + '.png'}" alt="${name}" />
        <span class="tp-check">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </span>
        ${!unlocked ? '<span class="tp-lock">✦ PRO</span>' : ''}
      `;
      cell.title = name + (unlocked ? '' : ' (PRO)');
      queueThemeThumb(cell.querySelector('img'));

      const selectTheme = () => {
        if (!state.premium && !t.free) {
          openPremium();
          return;
        }
        state.theme = t.id;
        $$('.tmpl-pick', grid).forEach(x => {
          x.classList.remove('sel');
          x.setAttribute('aria-checked', 'false');
        });
        cell.classList.add('sel');
        cell.setAttribute('aria-checked', 'true');
        scheduleRender();
        toast(`✓ ${name}`, 'success', 1500);
      };

      cell.addEventListener('click', selectTheme);
      cell.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectTheme(); }
      });
      grid.appendChild(cell);
    });
  }

  // ---------- Select helpers ----------
  function fillSelect(sel, options, placeholder) {
    const cur = sel.value;
    sel.innerHTML = `<option value="">— ${placeholder || ''} —</option>` +
      options.map(o => `<option>${o}</option>`).join('');
    sel.value = cur || '';
    if (!sel.value) sel.selectedIndex = 0;
  }

  function buildSelects() {
    if (!window.$t) return;
    const B = T().biodata, lc = T().code;

    // Heights
    const heights = [];
    for (let ft = 4; ft <= 6; ft++) {
      for (let inch = 0; inch <= 11; inch++) {
        if (ft === 6 && inch > 5) break;
        const v = `${ft}'${inch}"`;
        heights.push(lc === 'en' ? v : (window.BioRender ? window.BioRender.devDigits(v) : v));
      }
    }
    const heightSel = $('#fHeight');
    if (heightSel) {
      fillSelect(heightSel, heights, ui('height'));
      if (state.fields.height) heightSel.value = state.fields.height;
    }

    // Dropdowns
    const dropdowns = [
      ['fComplexion', 'complexion'],
      ['fBlood', 'blood'],
      ['fRashi', 'rashi'],
      ['fNadi', 'nadi'],
      ['fGan', 'gan'],
      ['fMangal', 'mangal']
    ];
    dropdowns.forEach(([selId, key]) => {
      const sel = $(`#${selId}`);
      if (!sel || !B.opt[key]) return;
      fillSelect(sel, B.opt[key], ui(key));
      if (state.fields[key]) sel.value = state.fields[key];
    });
  }

  // ---------- Digit Utilities ----------
  function devToAsciiDigits(str) {
    if (!str) return '';
    const map = { '०':'0','१':'1','२':'2','३':'3','४':'4','५':'5','६':'6','७':'7','८':'8','९':'9' };
    return String(str).replace(/[०-९]/g, (c) => map[c] || c);
  }

  // ---------- Phonetic Transliteration Engine ----------
  let phoneticEnabled = true;
  const translitWordCache = {};
  const translitFullCache = {};

  function offlineTransliterate(text, lang) {
    if (!text) return '';
    const vowels = { 'aa':'आ','a':'अ','ee':'ई','i':'इ','oo':'ऊ','u':'उ','ai':'ऐ','e':'ए','au':'औ','o':'ओ' };
    const matras = { 'aa':'ा','ee':'ी','i':'ि','oo':'ू','u':'ु','ai':'ै','e':'े','au':'ौ','o':'ो' };
    const consonants = {
      'k':'क','kh':'ख','g':'ग','gh':'घ','ch':'च','chh':'छ','j':'ज','jh':'झ',
      't':'त','th':'थ','d':'द','dh':'ध','n':'न','p':'प','ph':'फ','b':'ब','bh':'भ','m':'म',
      'y':'य','r':'र','l':'ल','v':'व','w':'व','sh':'श','s':'स','h':'ह','gy':'ज्ञ','dny':'ज्ञ'
    };
    let res = '', i = 0;
    const lower = text.toLowerCase();
    while (i < lower.length) {
      let sub3 = lower.slice(i, i + 3), sub2 = lower.slice(i, i + 2), sub1 = lower.slice(i, i + 1);
      let cMatch = consonants[sub3] ? sub3 : (consonants[sub2] ? sub2 : (consonants[sub1] ? sub1 : null));
      if (cMatch) {
        let devCons = consonants[cMatch];
        i += cMatch.length;
        let next2 = lower.slice(i, i + 2), next1 = lower.slice(i, i + 1);
        let vMatch = matras[next2] ? next2 : (matras[next1] ? next1 : (next1 === 'a' ? 'a' : null));
        if (vMatch) {
          if (vMatch !== 'a') res += devCons + matras[vMatch];
          else res += devCons;
          i += (vMatch === 'a' ? 1 : vMatch.length);
        } else {
          if (i < lower.length && consonants[lower.slice(i, i + 1)]) res += devCons + '्';
          else res += devCons;
        }
      } else {
        let vMatch = vowels[sub2] ? sub2 : (vowels[sub1] ? sub1 : null);
        if (vMatch) {
          res += vowels[vMatch];
          i += vMatch.length;
        } else {
          res += text[i];
          i++;
        }
      }
    }
    return res;
  }

  async function transliterateWord(word, lang = state.lang) {
    if (!word || !word.trim()) return '';
    const key = `${lang || 'mr'}:${word.toLowerCase().trim()}`;
    if (translitWordCache[key]) return translitWordCache[key];

    const hasBackend = (location.hostname === 'localhost' || location.hostname === '127.0.0.1');
    if (hasBackend) {
      try {
        const resp = await fetch(`/api/transliterate?text=${encodeURIComponent(word.trim())}&lang=${lang || 'mr'}`);
        const data = await resp.json();
        if (data && data.success && data.result) {
          translitWordCache[key] = data.result;
          return data.result;
        }
      } catch (e) { /* fallback below */ }
    }

    // Direct Google Input Tools (works both on Firebase static hosting and locally)
    try {
      const itc = lang === 'hi' ? 'hi-t-i0-und' : 'mr-t-i0-und';
      const url = `https://inputtools.google.com/request?text=${encodeURIComponent(word.trim())}&itc=${itc}&num=1&cp=0&cs=1&ie=utf-8&oe=utf-8`;
      const r = await fetch(url);
      const d = await r.json();
      if (d && d[0] === 'SUCCESS' && Array.isArray(d[1])) {
        const res = d[1].map(x => (x && x[1] && x[1][0]) ? x[1][0] : x[0]).join('');
        if (res) {
          translitWordCache[key] = res;
          return res;
        }
      }
    } catch (err2) { /* offline fallback below */ }

    const fallback = offlineTransliterate(word, lang);
    translitWordCache[key] = fallback || word;
    return fallback || word;
  }

  async function transliterateFull(text, lang = state.lang) {
    if (!text || !text.trim()) return text;
    const key = `${lang || 'mr'}:${text.trim()}`;
    if (translitFullCache[key]) return translitFullCache[key];

    const hasBackend = (location.hostname === 'localhost' || location.hostname === '127.0.0.1');
    if (hasBackend) {
      try {
        const resp = await fetch(`/api/transliterate?text=${encodeURIComponent(text.trim())}&lang=${lang || 'mr'}`);
        const data = await resp.json();
        if (data && data.success && data.result) {
          translitFullCache[key] = data.result;
          return data.result;
        }
      } catch (e) { /* fallback below */ }
    }

    try {
      const itc = lang === 'hi' ? 'hi-t-i0-und' : 'mr-t-i0-und';
      const url = `https://inputtools.google.com/request?text=${encodeURIComponent(text.trim())}&itc=${itc}&num=1&cp=0&cs=1&ie=utf-8&oe=utf-8`;
      const r = await fetch(url);
      const d = await r.json();
      if (d && d[0] === 'SUCCESS' && Array.isArray(d[1])) {
        const res = d[1].map(x => (x && x[1] && x[1][0]) ? x[1][0] : x[0]).join('');
        if (res) {
          translitFullCache[key] = res;
          return res;
        }
      }
    } catch (e) {
      const parts = text.split(/(\s+|[,.-])/);
      const translatedParts = await Promise.all(parts.map(async p => {
        if (/^[a-zA-Z]+$/.test(p)) {
          return await transliterateWord(p, lang);
        }
        return p;
      }));
      const res = translatedParts.join('');
      translitFullCache[key] = res;
      return res;
    }
    return text;
  }

  async function translateBatch(fields, from, to) {
    const hasBackend = (location.hostname === 'localhost' || location.hostname === '127.0.0.1');
    if (hasBackend) {
      try {
        const res = await fetch('/api/translate-fields', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fields, from, to })
        });
        const data = await res.json();
        if (data && data.success && data.fields) {
          return data.fields;
        }
      } catch (e) {
        console.warn('Batch translation server call error:', e.message);
      }
    }

    // Client-side fallback using Google GTX and Google Input Tools (works on Firebase static hosting)
    try {
      const properNounFields = new Set([
        'name', 'caste', 'birthPlace', 'fatherName', 'motherName',
        'mama', 'relatives', 'devak', 'gotra'
      ]);
      const entries = Object.entries(fields);
      const results = await Promise.all(entries.map(async ([k, v]) => {
        if (!v || typeof v !== 'string' || !v.trim()) return [k, v];
        const rawVal = v.trim();

        if (from === 'en' && (to === 'mr' || to === 'hi') && properNounFields.has(k)) {
          try {
            const translit = await transliterateFull(rawVal, to);
            if (translit) return [k, translit];
          } catch (e) {}
        }

        try {
          const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(rawVal)}`;
          const r = await fetch(url);
          const d = await r.json();
          const text = (d && d[0] || []).map(seg => seg[0]).join('').trim() || rawVal;
          return [k, text];
        } catch (err) {
          return [k, rawVal];
        }
      }));
      return Object.fromEntries(results);
    } catch (err) {
      return fields;
    }
  }

  function syncPhoneticUI() {
    const btn = $('#btnPhoneticToggle');
    const dot = $('#phoneticDot');
    const txt = $('#phoneticToggleTxt');
    if (!btn) return;
    if (state.lang === 'en') {
      btn.style.display = 'none';
      return;
    }
    btn.style.display = 'inline-flex';
    if (phoneticEnabled) {
      if (dot) { dot.style.background = '#22c55e'; dot.style.boxShadow = '0 0 6px rgba(34,197,94,0.6)'; }
      if (txt) txt.textContent = '🔤 ' + (state.lang === 'hi' ? 'हिंदी टाइप ON' : 'मराठी टाइप ON');
      btn.style.opacity = '1';
    } else {
      if (dot) { dot.style.background = '#94a3b8'; dot.style.boxShadow = 'none'; }
      if (txt) txt.textContent = '🔤 ऑटो-टाइप OFF';
      btn.style.opacity = '0.65';
    }
  }

  const btnPhonetic = $('#btnPhoneticToggle');
  if (btnPhonetic) {
    btnPhonetic.addEventListener('click', () => {
      phoneticEnabled = !phoneticEnabled;
      syncPhoneticUI();
      toast(phoneticEnabled ? '✓ ' + (state.lang === 'hi' ? 'हिंदी' : 'मराठी') + ' ऑटो-टाइपिंग चालू' : 'ऑटो-टाइपिंग बंद (English Type)', 'info');
    });
  }

  const PHONETIC_FIELD_IDS = new Set([
    'fName', 'fCaste', 'fBirthTime', 'fBirthPlace', 'fDevak', 'fGotra',
    'fEdu', 'fOcc', 'fIncome', 'fFather', 'fFatherOcc', 'fMother', 'fMotherOcc',
    'fMama', 'fRelatives', 'fAddress', 'fExpect', 'fInvocation', 'fDocTitle'
  ]);

  function attachPhonetic(elem, fieldKey) {
    if (!elem || elem.dataset.phoneticAttached) return;
    elem.dataset.phoneticAttached = 'true';

    // Prefetch transliteration as user types
    let prefetchTimer = null;
    elem.addEventListener('keyup', (e) => {
      if (!phoneticEnabled || state.lang === 'en') return;
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Shift', 'Control', 'Alt'].includes(e.key)) return;
      const pos = elem.selectionStart;
      const before = elem.value.slice(0, pos);
      const match = before.match(/([a-zA-Z]+)$/);
      if (match && match[1].length >= 2) {
        clearTimeout(prefetchTimer);
        prefetchTimer = setTimeout(() => {
          transliterateWord(match[1], state.lang);
        }, 100);
      }
    });

    // Handle Space or Enter for instant word-by-word transliteration
    elem.addEventListener('keydown', async (e) => {
      if (!phoneticEnabled || state.lang === 'en') return;
      const isSpace = (e.key === ' ' || e.code === 'Space');
      const isEnter = (e.key === 'Enter');
      if (!isSpace && !isEnter) return;

      const pos = elem.selectionStart;
      const text = elem.value;
      const before = text.slice(0, pos);
      const match = before.match(/([a-zA-Z]+)$/);
      if (!match) return;

      const word = match[1];
      // Skip uppercase acronyms like MBA, TCS, BE, IT
      if (word.length >= 2 && word === word.toUpperCase() && !['A', 'I'].includes(word)) {
        return;
      }

      e.preventDefault();
      const start = pos - word.length;
      const after = text.slice(pos);
      const sep = isEnter ? (elem.tagName === 'TEXTAREA' ? '\n' : '') : ' ';

      const cacheKey = `${state.lang}:${word.toLowerCase().trim()}`;
      const cached = translitWordCache[cacheKey];

      if (cached) {
        elem.value = text.slice(0, start) + cached + sep + after;
        const newPos = start + cached.length + sep.length;
        elem.setSelectionRange(newPos, newPos);
        if (fieldKey) state.fields[fieldKey] = elem.value.trim();
        scheduleRender();
      } else {
        const trans = await transliterateWord(word, state.lang);
        const curText = elem.value;
        const curPos = elem.selectionStart;
        if (trans && trans !== word) {
          elem.value = curText.slice(0, start) + trans + sep + curText.slice(pos);
          const shift = trans.length - word.length + sep.length;
          const targetPos = Math.max(0, curPos + shift);
          elem.setSelectionRange(targetPos, targetPos);
        } else {
          elem.value = curText.slice(0, pos) + sep + curText.slice(pos);
          elem.setSelectionRange(pos + sep.length, pos + sep.length);
        }
        if (fieldKey) state.fields[fieldKey] = elem.value.trim();
        scheduleRender();
      }
    });

    // Handle blur: convert any remaining English text in field
    elem.addEventListener('blur', async () => {
      if (!phoneticEnabled || state.lang === 'en') return;
      const val = elem.value;
      if (/[a-zA-Z]/.test(val)) {
        const converted = await transliterateFull(val, state.lang);
        if (converted && converted !== val) {
          elem.value = converted;
          if (fieldKey) state.fields[fieldKey] = converted.trim();
          else if (elem.id === 'fInvocation') state.invocation = converted.trim();
          else if (elem.id === 'fDocTitle') state.docTitle = converted.trim();
          scheduleRender();
        }
      }
    });
  }

  // ---------- Form Bindings ----------
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
      const elem = document.getElementById(id);
      if (!elem) return;
      if (state.fields[key]) elem.value = state.fields[key];
      const handler = () => {
        state.fields[key] = elem.value.trim();
        scheduleRender();
      };
      elem.addEventListener('input', handler);
      elem.addEventListener('change', handler);
      if (PHONETIC_FIELD_IDS.has(id)) attachPhonetic(elem, key);
    });

    const inv = $('#fInvocation'), doc = $('#fDocTitle');
    if (inv) {
      inv.value = state.invocation;
      inv.addEventListener('input', e => { state.invocation = e.target.value; scheduleRender(); });
      attachPhonetic(inv, null);
    }
    if (doc) {
      doc.value = state.docTitle;
      doc.addEventListener('input', e => { state.docTitle = e.target.value; scheduleRender(); });
      attachPhonetic(doc, null);
    }

    // Ink swatches
    $$('.ink-dot').forEach(d => {
      d.classList.toggle('sel', d.dataset.ink === state.ink);
      d.addEventListener('click', () => {
        state.ink = d.dataset.ink;
        $$('.ink-dot').forEach(x => x.classList.remove('sel'));
        d.classList.add('sel');
        scheduleRender();
        toast('✓ रंग बदलला', 'success', 1500);
      });
    });

    // Sibling steppers
    [['brothers', 'brothersMarried'], ['sisters', 'sistersMarried']].forEach(([k, km]) => {
      const val = $(`#cv-${k}`), mval = $(`#cv-${km}`), mrow = $(`#row-${km}`);
      const paint = () => {
        if (val && window.BioRender) val.textContent = window.BioRender.devDigits(String(state.fields[k]));
        if (mval && window.BioRender) mval.textContent = window.BioRender.devDigits(String(state.fields[km]));
        if (mrow) {
          mrow.style.display = state.fields[k] > 0 ? 'flex' : 'none';
        }
      };
      $$(`[data-count="${k}"]`).forEach(b => b.addEventListener('click', () => {
        const dir = b.dataset.dir === '+' ? 1 : -1;
        state.fields[k] = Math.min(9, Math.max(0, state.fields[k] + dir));
        if (state.fields[k] < state.fields[km]) state.fields[km] = state.fields[k];
        paint(); scheduleRender();
      }));
      $$(`[data-count="${km}"]`).forEach(b => b.addEventListener('click', () => {
        const dir = b.dataset.dir === '+' ? 1 : -1;
        state.fields[km] = Math.min(state.fields[k], Math.max(0, state.fields[km] + dir));
        paint(); scheduleRender();
      }));
      paint();
    });

    initCounters();
  }

  // ---------- Apply Language to UI ----------
  function applyLang() {
    if (!window.$t) return;
    const B = T().builder;
    document.documentElement.lang = T().code;

    const map = {
      s1Title: 's1t', s1Sub: 's1p', s2Title: 's2t', s2Sub: 's2p',
      s3Title: 's3t', s3Sub: 's3p', s4Title: 's4t', s4Sub: 's4p',
      s5Title: 's5t', s5Sub: 's5p'
    };
    Object.keys(map).forEach(id => {
      const e = document.getElementById(id);
      if (e && B[map[id]]) e.textContent = B[map[id]];
    });

    const back = $('#brandStepBack');
    if (back) back.textContent = '← ' + B.back;

    $$('#stepper .stepper-btn').forEach((b, i) => {
      const lbl = b.querySelector('.s-lbl');
      if (lbl && B.steps && B.steps[i]) lbl.textContent = B.steps[i];
    });

    $$('[data-bui]').forEach(elem => {
      const k = elem.getAttribute('data-bui');
      const v = B[k];
      if (typeof v === 'string') elem.innerHTML = v;
    });

    // Reset default headers if they match untouched defaults of another lang
    const BD = T().biodata;
    const otherLangs = ['mr', 'hi', 'en'].filter(l => l !== state.lang);
    if (otherLangs.some(l => state.invocation === window.$t(l).biodata.invocation)) {
      state.invocation = BD.invocation;
      if ($('#fInvocation')) $('#fInvocation').value = BD.invocation;
    }
    if (otherLangs.some(l => state.docTitle === window.$t(l).biodata.docTitle)) {
      state.docTitle = BD.docTitle;
      if ($('#fDocTitle')) $('#fDocTitle').value = BD.docTitle;
    }

    $$('.lang-toggle button').forEach(b => {
      const isActive = b.dataset.lang === state.lang;
      b.classList.toggle('active', isActive);
      b.setAttribute('aria-pressed', isActive);
    });

    buildSelects();
    buildThemePicker();
    updatePlanUI();
    syncPhoneticUI();
    scheduleRender();
  }

  // ---------- Language Switch & Auto-Translate ----------
  async function switchLanguage(targetLang) {
    if (state.lang === targetLang || isTranslating) return;
    isTranslating = true;
    const oldLang = state.lang;

    const loadingMsg = targetLang === 'en'
      ? 'Translating details to English…'
      : (targetLang === 'hi' ? 'हिंदी में अनुवाद हो रहा है…' : 'मराठीत भाषांतर होत आहे…');
    toast('🔄 ' + loadingMsg, 'info', 2000);

    try {
      // Snapshot current language so round-trips (mr→en→mr) restore originals exactly
      if (!state.langCache) state.langCache = {};
      state.langCache[oldLang] = {
        fields: JSON.parse(JSON.stringify(state.fields)),
        invocation: state.invocation,
        docTitle: state.docTitle
      };

      if (state.langCache[targetLang]) {
        // Exact restore — no re-translation drift
        state.fields = JSON.parse(JSON.stringify(state.langCache[targetLang].fields));
        state.invocation = state.langCache[targetLang].invocation;
        state.docTitle = state.langCache[targetLang].docTitle;
      } else {
        // 1. Translate dropdowns by matching option index
        ['complexion', 'blood', 'rashi', 'nadi', 'gan', 'mangal'].forEach(cat => {
          const cur = state.fields[cat];
          if (!cur) return;
          const oldOpts = window.$t(oldLang).biodata.opt[cat] || [];
          const idx = oldOpts.indexOf(cur);
          if (idx !== -1) {
            const newOpts = window.$t(targetLang).biodata.opt[cat] || [];
            if (newOpts[idx]) state.fields[cat] = newOpts[idx];
          }
        });

        // 2. Height translation (devanagari digits vs ascii)
        if (state.fields.height) {
          state.fields.height = targetLang === 'en'
            ? devToAsciiDigits(state.fields.height)
            : (window.BioRender ? window.BioRender.devDigits(devToAsciiDigits(state.fields.height)) : state.fields.height);
        }

        // 3. Prepare text fields for batch translation
        const toTranslate = {};
        const textKeys = [
          'name', 'caste', 'birthTime', 'birthPlace', 'devak', 'gotra',
          'education', 'occupation', 'income', 'fatherName', 'fatherOcc',
          'motherName', 'motherOcc', 'mama', 'relatives', 'address', 'expectations'
        ];
        textKeys.forEach(k => {
          if (state.fields[k] && typeof state.fields[k] === 'string' && state.fields[k].trim()) {
            toTranslate[k] = state.fields[k].trim();
          }
        });

        const oldBD = window.$t(oldLang).biodata;
        const newBD = window.$t(targetLang).biodata;
        if (state.invocation === oldBD.invocation) {
          state.invocation = newBD.invocation;
        } else if (state.invocation) {
          toTranslate['invocation'] = state.invocation.trim();
        }

        if (state.docTitle === oldBD.docTitle) {
          state.docTitle = newBD.docTitle;
        } else if (state.docTitle) {
          toTranslate['docTitle'] = state.docTitle.trim();
        }

        // 4. Batch translate
        if (Object.keys(toTranslate).length > 0) {
          const translated = await translateBatch(toTranslate, oldLang, targetLang);
          if (translated) {
            Object.keys(translated).forEach(k => {
              if (k === 'invocation') state.invocation = translated[k];
              else if (k === 'docTitle') state.docTitle = translated[k];
              else if (state.fields[k] !== undefined) state.fields[k] = translated[k];
            });
          }
        }

        // Cache the translated snapshot for exact round-trip later
        state.langCache[targetLang] = {
          fields: JSON.parse(JSON.stringify(state.fields)),
          invocation: state.invocation,
          docTitle: state.docTitle
        };
      }

      state.lang = targetLang;
      applyLang();

      // 5. Update input values in DOM
      FIELD_MAP.forEach(([id, key]) => {
        const e = document.getElementById(id);
        if (e && state.fields[key] !== undefined) e.value = state.fields[key];
      });
      if ($('#fInvocation')) $('#fInvocation').value = state.invocation;
      if ($('#fDocTitle')) $('#fDocTitle').value = state.docTitle;

      syncPhoneticUI();
      scheduleRender();

      const successMsg = targetLang === 'en'
        ? '✓ All fields translated to English'
        : (targetLang === 'hi' ? '✓ सभी जानकारी हिंदी में अनुवादित' : '✓ सर्व माहिती मराठीत भाषांतरित');
      toast(successMsg, 'success');
    } catch (err) {
      console.error('Language switch error:', err);
      state.lang = targetLang;
      applyLang();
    } finally {
      isTranslating = false;
    }
  }

  $$('.lang-toggle button').forEach(b => b.addEventListener('click', () => switchLanguage(b.dataset.lang)));

  // ---------- Wizard Navigation ----------
  function gotoStep(n) {
    state.step = Math.min(TOTAL_STEPS, Math.max(1, n));

    $$('.step-panel').forEach(p => {
      const isActive = +p.dataset.step === state.step;
      p.classList.toggle('active', isActive);
      if (isActive) p.style.animation = 'fadeInUp 0.35s ease';
    });

    $$('#stepper .stepper-btn').forEach((b, i) => {
      const num = i + 1;
      b.classList.toggle('active', num === state.step);
      b.classList.toggle('done', num < state.step);
      const numEl = b.querySelector('.s-num');
      if (numEl) {
        numEl.innerHTML = num < state.step
          ? '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>'
          : num;
      }
    });

    const prevBtn = $('#btnPrev'), nextBtn = $('#btnNext');
    if (prevBtn) prevBtn.style.visibility = state.step === 1 ? 'hidden' : 'visible';
    if (nextBtn) {
      nextBtn.innerHTML = state.step === TOTAL_STEPS
        ? `<span class="shine"></span>${ui('finish') || 'Finish'}`
        : `<span class="shine"></span>${ui('next') || 'पुढे'} <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;display:inline-block;vertical-align:middle;margin-left:4px;"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`;
    }

    updateProgress();
    const pc = $('#panelCard');
    if (pc) pc.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    scheduleSave();
  }

  const btnPrev = $('#btnPrev'), btnNext = $('#btnNext');
  if (btnPrev) btnPrev.addEventListener('click', () => gotoStep(state.step - 1));
  if (btnNext) btnNext.addEventListener('click', () => {
    if (state.step === 2 && !state.fields.name.trim()) {
      toast(ui('fillName') || 'कृपया नाव भरा', 'warning');
      $('#fName')?.focus();
      return;
    }
    if (state.step === TOTAL_STEPS) return;
    gotoStep(state.step + 1);
  });
  $$('#stepper .stepper-btn').forEach(b => b.addEventListener('click', () => gotoStep(+b.dataset.step)));

  // ---------- Photo Upload & Cropper ----------
  const crop = { img: null, scale: 1, minScale: 1, x: 0, y: 0, drag: null };
  const cropStage = $('#cropStage'), cropImg = $('#cropImg');

  function openCropper(file) {
    const reader = new FileReader();
    reader.onload = e => {
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
    if (!crop.img) return;
    const g = cropGeom();
    crop.minScale = Math.max(g.fw / crop.img.width, g.fh / crop.img.height);
    crop.scale = crop.minScale;
    crop.x = g.fx + (g.fw - crop.img.width * crop.scale) / 2;
    crop.y = g.fy + (g.fh - crop.img.height * crop.scale) / 2;
    const zoomSlider = $('#cropZoom');
    if (zoomSlider) zoomSlider.value = 1;
    const zoomVal = $('#cropZoomValue');
    if (zoomVal) zoomVal.textContent = '1.0x';
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
    cropImg.style.transform = `translate(${crop.x}px,${crop.y}px) scale(${crop.scale})`;
  }

  if (cropStage) {
    cropStage.addEventListener('pointerdown', e => {
      crop.drag = { sx: e.clientX, sy: e.clientY, ox: crop.x, oy: crop.y };
      cropStage.setPointerCapture(e.pointerId);
    });
    cropStage.addEventListener('pointermove', e => {
      if (!crop.drag) return;
      crop.x = crop.drag.ox + (e.clientX - crop.drag.sx);
      crop.y = crop.drag.oy + (e.clientY - crop.drag.sy);
      cropPaint();
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev =>
      cropStage.addEventListener(ev, () => { crop.drag = null; }));
  }

  const zoomSlider = $('#cropZoom');
  if (zoomSlider) {
    zoomSlider.addEventListener('input', e => {
      const k = parseFloat(e.target.value);
      const g = cropGeom();
      const cx = g.fx + g.fw / 2, cy = g.fy + g.fh / 2;
      const ns = crop.minScale * k;
      crop.x = cx - (cx - crop.x) * (ns / crop.scale);
      crop.y = cy - (cy - crop.y) * (ns / crop.scale);
      crop.scale = ns;
      cropPaint();
      const zoomValue = $('#cropZoomValue');
      if (zoomValue) zoomValue.textContent = `${k.toFixed(1)}x`;
    });
  }

  $('#cropCancel')?.addEventListener('click', () => $('#cropModal').classList.remove('open'));
  $('#cropApply')?.addEventListener('click', () => {
    const g = cropGeom();
    const out = document.createElement('canvas');
    out.width = 704; out.height = 892;
    const ctx = out.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, out.width, out.height);
    const sx = (g.fx - crop.x) / crop.scale, sy = (g.fy - crop.y) / crop.scale;
    const sw = g.fw / crop.scale, sh = g.fh / crop.scale;
    ctx.drawImage(crop.img, sx, sy, sw, sh, 0, 0, out.width, out.height);
    state.photo = out.toDataURL('image/jpeg', 0.9);
    $('#cropModal').classList.remove('open');
    renderPhotoChip();
    scheduleRender();
    toast(ui('toastPhoto') || '✓ फोटो सेट झाला', 'success');
  });

  function renderPhotoChip() {
    const drop = $('#photoDrop'), chip = $('#photoChip'), img = $('#photoChipImg');
    if (drop) drop.style.display = state.photo ? 'none' : 'block';
    if (chip) chip.style.display = state.photo ? 'flex' : 'none';
    if (img && state.photo) img.src = state.photo;
  }

  $('#photoDrop')?.addEventListener('click', () => $('#photoInput').click());
  $('#photoChangeBtn')?.addEventListener('click', () => $('#photoInput').click());
  $('#photoRemoveBtn')?.addEventListener('click', () => {
    state.photo = null; renderPhotoChip(); scheduleRender();
    toast('फोटो काढला', 'info', 1500);
  });
  $('#photoInput')?.addEventListener('change', e => {
    const f = e.target.files && e.target.files[0];
    if (f) openCropper(f);
    e.target.value = '';
  });

  // Drag & drop on photo dropzone
  const dropZone = $('#photoDrop');
  if (dropZone) {
    ['dragover', 'dragenter'].forEach(ev => dropZone.addEventListener(ev, e => {
      e.preventDefault();
      dropZone.classList.add('drag-over');
    }));
    ['dragleave', 'drop'].forEach(ev => dropZone.addEventListener(ev, e => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
    }));
    dropZone.addEventListener('drop', e => {
      const f = e.dataTransfer.files && e.dataTransfer.files[0];
      if (f && f.type.startsWith('image/')) openCropper(f);
    });
  }

  // ---------- Premium System ----------
  function updatePlanUI() {
    const pro = state.premium;
    const chip = $('#planChip');
    if (chip) {
      chip.innerHTML = pro
        ? '<span class="badge badge-pro wm-chip">✦ ' + (ui('proPlan') || 'PRO') + '</span>'
        : '<span class="badge badge-soft wm-chip">' + (ui('freePlan') || 'FREE') + '</span>';
    }
    $$('#btnUnlock, .btn-unlock-step').forEach(e => { if (e) e.style.display = pro ? 'none' : 'inline-flex'; });
    $$('.dl-lock').forEach(e => e.style.display = pro ? 'none' : 'inline');
    const wmNote = $('#wmNote');
    if (wmNote) wmNote.style.display = pro ? 'none' : 'block';
    buildThemePicker();
  }

  function openPremium() {
    const modal = $('#premiumModal');
    if (!modal) return;
    // Hide demo unlock outside local development
    const isLocal = (location.hostname === 'localhost' || location.hostname === '127.0.0.1' || location.hostname === '');
    const demoBtn = $('#pmDemo');
    if (demoBtn) demoBtn.style.display = isLocal ? '' : 'none';
    modal.classList.add('open');
  }
  function closePremium() { $('#premiumModal').classList.remove('open'); }

  $$('#btnUnlock, .btn-unlock-step').forEach(b => b?.addEventListener('click', openPremium));
  $('#pmClose')?.addEventListener('click', closePremium);

  $$('.dl-pro').forEach(b => b.addEventListener('click', () => {
    if (!state.premium) { openPremium(); return; }
    download(b.dataset.fmt);
  }));

  $$('.btn-dl-jpg, #btnJpg').forEach(b => b?.addEventListener('click', () => download('jpg')));

  $('#pmPay')?.addEventListener('click', () => {
    const upi = 'upi://pay?pa=shubhbiodata@upi&pn=ShubhBiodata&am=49&cu=INR&tn=PremiumHD';
    window.location.href = upi;
    // Do NOT auto-unlock: premium is granted only after server verifies payment
    // (POST /api/premium/verify with orderId + paymentStatus).
    toast('UPI app उघडला — पेमेंट नंतर verify होईल.', 'info', 4000);
  });

  // Demo unlock only in local development — never in production
  $('#pmDemo')?.addEventListener('click', () => {
    const isLocal = (location.hostname === 'localhost' || location.hostname === '127.0.0.1' || location.hostname === '');
    if (!isLocal) {
      toast('Demo unlock disabled in production', 'warning');
      return;
    }
    unlockPro();
  });

  function unlockPro() {
    state.premium = true;
    localStorage.setItem(PRO_KEY, '1');
    closePremium();
    updatePlanUI();
    scheduleRender();
    toast('🎉 ' + (ui('toastPro') || 'Premium unlocked!'), 'success');
    launchConfetti();
  }

  // ---------- Confetti Celebration ----------
  function launchConfetti() {
    const container = el('div', {
      class: 'confetti-container',
      style: { position: 'fixed', inset: '0', pointerEvents: 'none', zIndex: '9999', overflow: 'hidden' }
    });
    document.body.appendChild(container);
    const colors = ['#e9bb63', '#d9a23c', '#5f1533', '#f3d28e', '#761c40', '#22c55e'];
    for (let i = 0; i < 70; i++) {
      const piece = el('div', {
        class: 'confetti-piece',
        style: {
          position: 'absolute',
          width: `${6 + Math.random() * 8}px`,
          height: `${6 + Math.random() * 8}px`,
          background: colors[Math.floor(Math.random() * colors.length)],
          left: `${Math.random() * 100}%`,
          top: '-20px',
          borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          transform: `rotate(${Math.random() * 360}deg)`,
          animation: `confettiFall ${2 + Math.random() * 2}s ease-out ${Math.random() * 0.5}s forwards`
        }
      });
      container.appendChild(piece);
    }
    setTimeout(() => container.remove(), 5000);
  }

  // Inject confetti animation if not present
  if (!document.getElementById('confetti-style')) {
    const style = el('style', { id: 'confetti-style' });
    style.textContent = `
      @keyframes confettiFall {
        to { transform: translateY(110vh) rotate(720deg); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  // ---------- Mobile Tabs ----------
  $$('.pv-tab').forEach(t => t.addEventListener('click', () => {
    $$('.pv-tab').forEach(x => {
      x.classList.remove('active');
      x.setAttribute('aria-selected', 'false');
    });
    t.classList.add('active');
    t.setAttribute('aria-selected', 'true');
    const pc = $('#panelCard'), ps = $('#previewSide');
    if (pc) pc.style.display = t.dataset.view === 'form' ? '' : 'none';
    if (ps) ps.style.display = t.dataset.view === 'preview' ? '' : 'none';
    if (t.dataset.view === 'preview') scheduleRender();
  }));

  function syncMobileTabs() {
    if (window.innerWidth > 1080) {
      const pc = $('#panelCard'), ps = $('#previewSide');
      if (pc) pc.style.display = '';
      if (ps) ps.style.display = '';
    } else {
      const active = $('.pv-tab.active');
      const view = active ? active.dataset.view : 'form';
      const pc = $('#panelCard'), ps = $('#previewSide');
      if (pc) pc.style.display = view === 'form' ? '' : 'none';
      if (ps) ps.style.display = view === 'preview' ? '' : 'none';
    }
  }
  window.addEventListener('resize', syncMobileTabs);

  // ---------- Zoom Controls ----------
  function initZoom() {
    const zoomIn = $('#zoomIn'), zoomOut = $('#zoomOut'), zoomLevel = $('#zoomLevel');
    if (!zoomIn || !zoomOut || !zoomLevel) return;

    const update = delta => {
      state.zoomLevel = Math.max(50, Math.min(200, state.zoomLevel + delta));
      zoomLevel.textContent = `${state.zoomLevel}%`;
      const shell = $('.canvas-shell');
      if (shell) shell.style.transform = `scale(${state.zoomLevel / 100})`;
    };

    zoomIn.addEventListener('click', () => update(10));
    zoomOut.addEventListener('click', () => update(-10));
    zoomLevel.textContent = `${state.zoomLevel}%`;
  }

  // ---------- Fullscreen ----------
  $('#btnFullscreen')?.addEventListener('click', () => {
    const stage = $('.preview-stage') || $('.canvas-shell');
    if (!stage) return;
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else {
      stage.requestFullscreen?.();
    }
  });

  // ---------- Dark/Light Theme Toggle ----------
  function initThemeToggle() {
    const toggle = $('#themeToggle');
    if (!toggle) return;
    const saved = localStorage.getItem(THEME_KEY) || 'light';
    document.body.setAttribute('data-theme', saved);
    toggle.addEventListener('click', () => {
      const cur = document.body.getAttribute('data-theme');
      const next = cur === 'light' ? 'dark' : 'light';
      document.body.setAttribute('data-theme', next);
      localStorage.setItem(THEME_KEY, next);
      toast(next === 'dark' ? '🌙 डार्क मोड चालू' : '☀️ लाईट मोड चालू', 'info', 1500);
    });
  }

  // ---------- Scroll to Top ----------
  function initScrollTop() {
    const btn = $('#scrollTop');
    if (!btn) return;
    const toggle = () => {
      btn.style.display = window.scrollY > 400 ? 'flex' : 'none';
    };
    window.addEventListener('scroll', toggle, { passive: true });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    toggle();
  }

  // ---------- Downloads ----------
  function transliterateFilename(str) {
    if (!str) return '';
    const map = {
      'अ':'a','आ':'aa','इ':'i','ई':'ee','उ':'u','ऊ':'oo','ऋ':'ru','ए':'e','ऐ':'ai','ओ':'o','औ':'au',
      'क':'k','ख':'kh','ग':'g','घ':'gh','च':'ch','छ':'chh','ज':'j','झ':'jh',
      'ट':'t','ठ':'th','ड':'d','ढ':'dh','ण':'n',
      'त':'t','th':'th','द':'d','ध':'dh','न':'n',
      'प':'p','फ':'ph','ब':'b','भ':'bh','म':'m',
      'य':'y','र':'r','ल':'l','व':'v','श':'sh','ष':'sh','स':'s','ह':'h','ळ':'l',
      'ा':'a','ि':'i','ी':'ee','ु':'u','ू':'oo','ृ':'ru','े':'e','ै':'ai','ो':'o','ौ':'au','ं':'n','ः':'h','्':''
    };
    return str.split('').map(c => map[c] !== undefined ? map[c] : c).join('');
  }

  function fileBase() {
    const raw = (state.fields && state.fields.name ? state.fields.name : '').trim();
    const trans = transliterateFilename(raw);
    const clean = trans.replace(/[^a-zA-Z0-9\s_-]/g, '')
      .trim().replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '').toLowerCase();
    return 'shubh-biodata-' + (clean.slice(0, 30) || 'biodata');
  }

  function dataURLtoBlob(dataurl) {
    const parts = dataurl.split(',');
    const mime = (parts[0].match(/:(.*?);/) || [])[1] || 'image/jpeg';
    const bstr = atob(parts[1]);
    const u8 = new Uint8Array(bstr.length);
    for (let n = 0; n < bstr.length; n++) u8[n] = bstr.charCodeAt(n);
    return new Blob([u8], { type: mime });
  }

  function triggerDownload(dataUrl, filename, format) {
    toast(ui('toastDl') || 'बायोडाटा डाउनलोड झाला!', 'success');

    const hasBackend = (location.hostname === 'localhost' || location.hostname === '127.0.0.1');
    if (!hasBackend) {
      clientDownload(dataUrl, filename);
      return;
    }

    try {
      let frame = document.getElementById('dl_hidden_frame');
      if (!frame) {
        frame = el('iframe', { id: 'dl_hidden_frame', name: 'dl_hidden_frame', style: { display: 'none' } });
        document.body.appendChild(frame);
      }
      const form = el('form', {
        method: 'POST',
        action: '/api/download',
        target: 'dl_hidden_frame',
        style: { display: 'none' }
      });
      [['dataUrl', dataUrl], ['filename', filename], ['format', format]].forEach(([name, value]) => {
        form.appendChild(el('input', { type: 'hidden', name, value }));
      });
      document.body.appendChild(form);
      form.submit();
      setTimeout(() => form.parentNode?.removeChild(form), 2000);
    } catch (err) {
      console.warn('Server download failed, fallback:', err);
      clientDownload(dataUrl, filename);
    }
  }

  function clientDownload(dataUrl, filename) {
    try {
      const blob = dataURLtoBlob(dataUrl);
      const url = URL.createObjectURL(blob);
      const a = el('a', { href: url, download: filename, style: { display: 'none' } });
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { a.parentNode?.removeChild(a); URL.revokeObjectURL(url); }, 60000);
    } catch (e) {
      console.error('Client download failed:', e);
    }
  }

  function download(fmt) {
    const ext = fmt === 'png' ? 'png' : (fmt === 'pdf' ? 'pdf' : 'jpg');
    const filename = `${fileBase()}.${ext}`;

    if (fmt === 'pdf') {
      try {
        const { jsPDF } = window.jspdf || {};
        if (!jsPDF) throw new Error('jsPDF unavailable');
        const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'p' });
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        doc.addImage(imgData, 'JPEG', 0, 0, 210, 297);
        const pdfDataUrl = doc.output('datauristring');
        triggerDownload(pdfDataUrl, filename, 'pdf');
        return;
      } catch (err) {
        console.warn('PDF failed, falling back to JPG:', err);
        download('jpg');
        return;
      }
    }

    if (fmt === 'png') {
      triggerDownload(canvas.toDataURL('image/png'), filename, 'png');
      return;
    }

    triggerDownload(canvas.toDataURL('image/jpeg', 0.95), filename, 'jpg');
  }

  // ---------- Share ----------
  $('#btnShare')?.addEventListener('click', async () => {
    try {
      canvas.toBlob(async blob => {
        const file = new File([blob], `${fileBase()}.jpg`, { type: 'image/jpeg' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'ShubhBiodata',
            text: T().hero?.titleA || 'Biodata'
          });
        } else {
          toast('Share not supported on this browser', 'warning');
        }
      }, 'image/jpeg', 0.92);
    } catch { /* cancelled */ }
  });

  // ---------- Reset ----------
  $('#btnReset')?.addEventListener('click', () => {
    if (!confirm('नवीन बायोडाटा सुरू करायचा? भरलेली माहिती साफ होईल.')) return;
    const keep = { lang: state.lang, premium: state.premium };
    state = defaultState(keep.lang);
    state.premium = keep.premium;
    localStorage.removeItem(DRAFT_KEY);
    bindForm();
    applyLang();
    renderPhotoChip();
    gotoStep(1);
    toast('✓ ' + (ui('toastReset') || 'Reset'), 'success');
  });

  // ---------- Keyboard Shortcuts ----------
  document.addEventListener('keydown', e => {
    if (e.target.matches('input, textarea, select')) return;
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'ArrowRight') { e.preventDefault(); gotoStep(state.step + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); gotoStep(state.step - 1); }
      else if (e.key === 's') { e.preventDefault(); scheduleSave(); toast('Saved!', 'success', 1200); }
    }
  });

  // ---------- Initialization ----------
  async function init() {
    if (window.BioRender && window.BioRender.ensureFonts) {
      await window.BioRender.ensureFonts();
    }
    buildSelects();
    buildThemePicker();
    bindForm();
    applyLang();
    renderPhotoChip();
    gotoStep(state.step || 1);
    syncMobileTabs();
    initZoom();
    initThemeToggle();
    initScrollTop();
    scheduleRender();

    // Hide loading overlay smoothly
    const loader = $('#loadingOverlay');
    if (loader) {
      setTimeout(() => loader.classList.add('hidden'), 400);
    }
  }

  // Expose public API
  window.BuilderApp = { gotoStep, toast, download, openPremium };

  // Start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
