/* ============================================================
   ShubhBiodata — Landing page interactions
   ============================================================ */
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const LANG_KEY = 'shubhbiodata.lang';
  let lang = localStorage.getItem(LANG_KEY) || 'mr';
  const T = () => window.$t(lang);

  function get(obj, path) {
    return path.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), obj);
  }

  /* ---------------- Apply language ---------------- */
  function applyLang() {
    const dict = T();
    document.documentElement.lang = dict.code;
    $$('[data-i18n]').forEach((el) => {
      const v = get(dict, el.getAttribute('data-i18n'));
      if (typeof v === 'string') el.innerHTML = v;
    });
    $$('.lang-toggle button').forEach((b) => b.classList.toggle('active', b.dataset.lang === lang));
    buildMarquee();
    buildFilters();
    renderGallery(currentCat);
    buildTestimonials();
    buildFaq();
    renderHeroShowpiece();
  }
  $$('.lang-toggle button').forEach((b) => b.addEventListener('click', () => {
    lang = b.dataset.lang;
    localStorage.setItem(LANG_KEY, lang);
    applyLang();
  }));

  /* ---------------- Mobile nav ---------------- */
  $('#burger').addEventListener('click', () => $('#mobileMenu').classList.toggle('open'));
  $$('#mobileMenu a').forEach((a) => a.addEventListener('click', () => $('#mobileMenu').classList.remove('open')));

  /* ---------------- Marquee ---------------- */
  function buildMarquee() {
    const items = T().marquee;
    const half = items.map((t) => '<span><i>✦</i>' + t + '</span>').join('');
    $('#marquee').innerHTML = half + half;
  }

  /* ---------------- Draft banner ---------------- */
  if (localStorage.getItem('shubhbiodata.draft.v3') || localStorage.getItem('shubhbiodata.draft.v2')) {
    $('#draftBanner').classList.add('show');
  }

  /* ---------------- Gallery ---------------- */
  const CATS = ['all', 'traditional', 'royal', 'minimal', 'floral', 'regional', 'community', 'luxury', 'modern', 'festive'];
  let currentCat = 'all';

  /* Filled preview: sample biodata + pro photo rendered over each theme */
  const previewCache = new Map();
  const previewQueue = [];
  let previewBusy = false;
  let fontsReady = null;

  function ensurePreviewFonts() {
    if (!window.BioRender) return Promise.resolve();
    if (!fontsReady) fontsReady = window.BioRender.ensureFonts().catch(() => {});
    return fontsReady;
  }

  function renderPreviewDataUrl(id, lg) {
    const key = id + ':' + lg;
    if (previewCache.has(key)) return Promise.resolve(previewCache.get(key));
    if (!window.BioRender || !window.SampleData) return Promise.resolve(null);
    return ensurePreviewFonts().then(() => {
      const canvas = document.createElement('canvas');
      const state = window.SampleData.stateFor(id, lg);
      return window.BioRender.renderBiodata(canvas, state).then(() => {
        let url;
        try { url = canvas.toDataURL('image/jpeg', 0.86); } catch (e) { url = null; }
        if (url) previewCache.set(key, url);
        return url;
      });
    }).catch(() => null);
  }

  function enqueuePreview(id, imgEl, lg) {
    previewQueue.push({ id, imgEl, lg });
    if (!previewBusy) drainPreviewQueue();
  }

  /* Hero showpiece: live filled render of a premium theme */
  const HERO_THEME = 148;
  function renderHeroShowpiece() {
    const img = document.querySelector('.hero-frame img');
    if (!img || !window.BioRender || !window.SampleData) return;
    const frame = document.querySelector('.hero-frame');
    if (frame) frame.classList.add('hero-loading');
    renderPreviewDataUrl(HERO_THEME, lang).then((url) => {
      if (!url || !img.isConnected) return;
      img.classList.add('hero-live');
      img.src = url;
      img.classList.add('loaded');
      if (frame) frame.classList.remove('hero-loading');
    });
  }

  function drainPreviewQueue() {
    if (!previewQueue.length) { previewBusy = false; return; }
    previewBusy = true;
    const job = previewQueue.shift();
    renderPreviewDataUrl(job.id, job.lg).then((url) => {
      if (url && job.imgEl && job.imgEl.isConnected) {
        job.imgEl.src = url;
        job.imgEl.classList.add('loaded');
      }
      requestAnimationFrame(() => drainPreviewQueue());
    });
  }

  const thumbIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const img = e.target;
      thumbIO.unobserve(img);
      const id = parseInt(img.dataset.themeId, 10);
      if (!id) return;
      const lg = img.dataset.lang || lang;
      if (previewCache.has(id + ':' + lg)) {
        img.src = previewCache.get(id + ':' + lg);
        img.classList.add('loaded');
      } else {
        enqueuePreview(id, img, lg);
      }
    });
  }, { rootMargin: '240px 0px' });

  function buildFilters() {
    const g = T().gallery;
    const bar = $('#filterBar');
    bar.innerHTML = '';
    CATS.forEach((c) => {
      const b = document.createElement('button');
      b.className = 'fchip' + (c === currentCat ? ' active' : '');
      b.textContent = g[c];
      b.addEventListener('click', () => { currentCat = c; buildFilters(); renderGallery(c); });
      bar.appendChild(b);
    });
  }
  function renderGallery(cat) {
    const g = T().gallery;
    const grid = $('#tmplGrid');
    grid.innerHTML = '';
    window.TEMPLATES.filter((t) => cat === 'all' || t.cat === cat).forEach((t, i) => {
      const name = t.name[lang] || t.name.en;
      const card = document.createElement('div');
      card.className = 'tmpl-card rv in';
      card.style.transitionDelay = (i % 8) * 40 + 'ms';
      card.innerHTML =
        '<span class="tmpl-badge badge ' + (t.free ? 'badge-free' : 'badge-pro') + '">' + (t.free ? g.free : '✦ ' + g.pro) + '</span>' +
        '<div class="tmpl-thumb"><img loading="lazy" data-theme-id="' + t.id + '" data-lang="' + lang + '" src="' + themeSrc(t.id) + '" alt="' + name + '"></div>' +
        '<div class="tmpl-overlay">' +
        '  <button class="btn btn-ghost-dark btn-sm" data-act="preview">' + g.preview + '</button>' +
        '  <a class="btn btn-gold btn-sm" href="builder.html?theme=' + t.id + '">' + g.use + ' →</a>' +
        '</div>' +
        '<div class="tmpl-meta"><span class="t-name">' + name + '</span><span class="t-cat">' + g[t.cat] + '</span></div>';
      card.querySelector('.tmpl-thumb').addEventListener('click', () => openTmplModal(t));
      card.querySelector('[data-act="preview"]').addEventListener('click', () => openTmplModal(t));
      const tImg = card.querySelector('.tmpl-thumb img');
      const markLoaded = () => tImg.classList.add('loaded');
      if (tImg.complete && tImg.naturalWidth) markLoaded();
      else { tImg.addEventListener('load', markLoaded, { once: true }); tImg.addEventListener('error', markLoaded, { once: true }); }
      thumbIO.observe(tImg);
      grid.appendChild(card);
    });
  }
  function themeSrc(id) {
    if (window.themeSrc) return window.themeSrc(id);
    const t = window.TEMPLATES.find((x) => x.id === id);
    const ext = (t && t.ext) || 'png';
    return 'theme/t-' + id + '.' + ext;
  }
  function openTmplModal(t) {
    const name = t.name[lang] || t.name.en;
    $('#tmplModalName').textContent = name;
    const img = $('#tmplModalImg');
    const key = t.id + ':' + lang;
    if (previewCache.has(key)) {
      img.src = previewCache.get(key);
    } else {
      img.src = themeSrc(t.id);
      renderPreviewDataUrl(t.id, lang).then((url) => {
        if (url && $('#tmplModal').classList.contains('open')) img.src = url;
      });
    }
    $('#tmplModalUse').href = 'builder.html?theme=' + t.id;
    $('#tmplModal').classList.add('open');
  }
  $('#tmplModalClose').addEventListener('click', () => $('#tmplModal').classList.remove('open'));
  $('#tmplModal').addEventListener('click', (e) => { if (e.target.id === 'tmplModal') $('#tmplModal').classList.remove('open'); });

  /* ---------------- Testimonials ---------------- */
  let tIdx = 0, tTimer = null;
  function buildTestimonials() {
    const d = T().testi;
    const data = [1, 2, 3, 4].map((i) => ({ q: d['q' + i], n: d['n' + i], p: d['p' + i] })).filter((x) => x.q);
    const slides = $('#testiSlides');
    slides.innerHTML = data.map((x) =>
      '<div class="testi-slide">' +
      '  <div class="testi-stars">★★★★★</div>' +
      '  <p class="testi-quote">“' + x.q + '”</p>' +
      '  <div class="testi-who"><span class="testi-ava">' + x.n.trim()[0] + '</span><span style="text-align:left;"><h4>' + x.n + '</h4><p>' + x.p + '</p></span></div>' +
      '</div>'
    ).join('');
    const dots = $('#testiDots');
    dots.innerHTML = data.map((_, i) => '<button class="testi-dot" aria-label="slide ' + (i + 1) + '"></button>').join('');
    $$('.testi-dot', dots).forEach((dEl, i) => dEl.addEventListener('click', () => showTesti(i)));
    showTesti(0);
  }
  function showTesti(i) {
    const n = $$('#testiSlides .testi-slide').length;
    tIdx = ((i % n) + n) % n;
    $('#testiSlides').style.transform = 'translateX(-' + tIdx * 100 + '%)';
    $$('#testiDots .testi-dot').forEach((dEl, j) => dEl.classList.toggle('active', j === tIdx));
    clearInterval(tTimer);
    tTimer = setInterval(() => showTesti(tIdx + 1), 6000);
  }
  $('#testiPrev').addEventListener('click', () => showTesti(tIdx - 1));
  $('#testiNext').addEventListener('click', () => showTesti(tIdx + 1));

  /* ---------------- FAQ ---------------- */
  function buildFaq() {
    const d = T().faq;
    const list = $('#faqList');
    list.innerHTML = '';
    for (let i = 1; i <= 6; i++) {
      if (!d['q' + i]) break;
      const item = document.createElement('div');
      item.className = 'faq-item' + (i === 1 ? ' open' : '');
      item.innerHTML =
        '<button class="faq-q"><span>' + d['q' + i] + '</span><span class="fq-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><path d="M12 5v14M5 12h14"/></svg></span></button>' +
        '<div class="faq-a"><p>' + d['a' + i] + '</p></div>';
      const q = item.querySelector('.faq-q'), a = item.querySelector('.faq-a');
      if (i === 1) a.style.maxHeight = a.scrollHeight + 'px';
      q.addEventListener('click', () => {
        const open = item.classList.contains('open');
        $$('.faq-item', list).forEach((x) => { x.classList.remove('open'); x.querySelector('.faq-a').style.maxHeight = '0'; });
        if (!open) { item.classList.add('open'); a.style.maxHeight = a.scrollHeight + 'px'; }
      });
      list.appendChild(item);
    }
  }

  /* ---------------- Reveal on scroll ---------------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  $$('.rv').forEach((el) => io.observe(el));

  /* ---------------- Animated counters ---------------- */
  const numFmt = (n, langCode) => n.toLocaleString(langCode === 'en' ? 'en-IN' : 'mr-IN');
  const cio = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target, target = parseFloat(el.dataset.count), dec = parseInt(el.dataset.decimals || '0', 10);
      const suffix = el.dataset.suffix || '', prefix = el.dataset.prefix || '';
      const t0 = performance.now();
      (function tick(t) {
        const p = Math.min(1, (t - t0) / 1400), v = target * (0.2 + 0.8 * p * (2 - p));
        el.textContent = prefix + (dec ? v.toFixed(dec) : numFmt(Math.round(v), T().code)) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      })(t0);
      cio.unobserve(el);
    });
  }, { threshold: 0.6 });
  $$('[data-count]').forEach((el) => cio.observe(el));

  /* ---------------- ULTRA FX v4 ---------------- */
  (function ultraFx() {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fine = matchMedia('(pointer: fine)').matches;

    /* Scroll progress + nav scrolled state */
    const bar = $('#scrollProgress');
    const nav = $('.nav-glass');
    let sTick = false;
    const onScroll = () => {
      if (sTick) return;
      sTick = true;
      requestAnimationFrame(() => {
        sTick = false;
        const max = document.documentElement.scrollHeight - innerHeight;
        if (bar) bar.style.width = (max > 0 ? (scrollY / max) * 100 : 0) + '%';
        if (nav) nav.classList.toggle('scrolled', scrollY > 8);
      });
    };
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* Cursor gold glow */
    const glow = $('#cursorGlow');
    if (glow && fine && !reduce) {
      let gx = -999, gy = -999, cx = -999, cy = -999, raf = 0;
      const loop = () => {
        cx += (gx - cx) * 0.14;
        cy += (gy - cy) * 0.14;
        glow.style.transform = 'translate(' + cx + 'px,' + cy + 'px) translate(-50%,-50%)';
        raf = requestAnimationFrame(loop);
      };
      document.addEventListener('pointermove', (e) => {
        gx = e.clientX; gy = e.clientY;
        if (cx < -900) { cx = gx; cy = gy; if (!raf) raf = requestAnimationFrame(loop); }
      }, { passive: true });
      raf = requestAnimationFrame(loop);
    }

    /* Spotlight + 3D tilt (event delegation) */
    if (fine && !reduce) {
      const spotSel = '.step-card, .feat-card, .price-card, .tmpl-card, .faq-item';
      const tiltSel = '.tmpl-card, .step-card, .feat-card';
      document.addEventListener('pointermove', (e) => {
        const spot = e.target.closest && e.target.closest(spotSel);
        if (spot) {
          const r = spot.getBoundingClientRect();
          spot.style.setProperty('--mx', (e.clientX - r.left) + 'px');
          spot.style.setProperty('--my', (e.clientY - r.top) + 'px');
        }
        const tilt = e.target.closest && e.target.closest(tiltSel);
        if (tilt) {
          const r = tilt.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width - 0.5;
          const py = (e.clientY - r.top) / r.height - 0.5;
          tilt.style.transform = 'perspective(900px) rotateX(' + (-py * 7) + 'deg) rotateY(' + (px * 7) + 'deg) translateY(-5px)';
        }
      }, { passive: true });
      document.addEventListener('pointerout', (e) => {
        const t = e.target.closest && e.target.closest(tiltSel);
        if (t && !t.contains(e.relatedTarget)) t.style.transform = '';
      });
    }

    /* Magnetic gold buttons */
    if (fine && !reduce) {
      $$('.btn-gold:not(.btn-sm)').forEach((btn) => {
        btn.addEventListener('pointermove', (e) => {
          const r = btn.getBoundingClientRect();
          const mx = e.clientX - r.left - r.width / 2;
          const my = e.clientY - r.top - r.height / 2;
          btn.style.transform = 'translate(' + mx * 0.12 + 'px,' + my * 0.2 + 'px)';
        });
        btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
      });
    }

    /* Hero frame parallax */
    const frame = $('.hero-frame');
    const visual = $('.hero-visual');
    if (frame && visual && fine && !reduce) {
      visual.addEventListener('pointermove', (e) => {
        const r = visual.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        frame.style.transform = 'perspective(900px) rotateY(' + (px * 6) + 'deg) rotateX(' + (-py * 6) + 'deg)';
      });
      visual.addEventListener('pointerleave', () => { frame.style.transform = ''; });
      frame.style.transition = 'transform .18s ease-out';
    }

    /* Hero stagger entrance */
    if (!reduce) {
      const left = $('.hero-grid > div:first-child');
      if (left) {
        let i = 0;
        Array.from(left.children).forEach((el) => {
          if (el.classList.contains('hero-stats') || el.classList.contains('draft-banner')) return;
          el.classList.add('hero-anim');
          el.style.animationDelay = (0.08 + i * 0.09) + 's';
          i++;
        });
      }
      if (visual) { visual.classList.remove('rv', 'rv-d2'); visual.classList.add('hero-anim'); visual.style.animationDelay = '0.45s'; }
    }

    /* Hero gold dust canvas */
    const dust = $('.hero-dust');
    const hero = $('.hero');
    if (dust && hero && !reduce) {
      const ctx = dust.getContext('2d');
        if (ctx) {
          let W = 0, H = 0, dpr = 1, parts = [], run = true;
          const n = () => (innerWidth < 640 ? 24 : 48);
          const resize = () => {
            dpr = Math.min(devicePixelRatio || 1, 2);
            W = hero.clientWidth; H = hero.clientHeight;
            dust.width = W * dpr; dust.height = H * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          };
          const seed = () => {
            parts = Array.from({ length: n() }, () => ({
              x: Math.random() * W, y: Math.random() * H,
              r: 0.6 + Math.random() * 1.9,
              vy: 0.12 + Math.random() * 0.35,
              vx: (Math.random() - 0.5) * 0.18,
              a: 0.25 + Math.random() * 0.6,
              tw: Math.random() * Math.PI * 2
            }));
          };
          resize(); seed();
          new ResizeObserver(() => { resize(); if (parts.length !== n()) seed(); }).observe(hero);
          new IntersectionObserver((en) => { run = en[0].isIntersecting; }).observe(hero);
          function tick() {
            requestAnimationFrame(tick);
            if (!run || document.hidden || !dust.clientWidth) return;
            ctx.clearRect(0, 0, W, H);
            for (const p of parts) {
              p.y -= p.vy; p.x += p.vx; p.tw += 0.03;
              if (p.y < -6) { p.y = H + 6; p.x = Math.random() * W; }
              if (p.x < -6) p.x = W + 6; else if (p.x > W + 6) p.x = -6;
              const al = p.a * (0.55 + 0.45 * Math.sin(p.tw));
              ctx.beginPath();
              ctx.fillStyle = 'rgba(246,216,146,' + al.toFixed(3) + ')';
              ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
              ctx.fill();
            }
          }
          requestAnimationFrame(tick);
        }
    }
  })();

  /* ---------------- Init ---------------- */
  applyLang();
  if (document.readyState === 'complete') renderHeroShowpiece();
  else window.addEventListener('load', renderHeroShowpiece, { once: true });
})();
