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
  if (localStorage.getItem('shubhbiodata.draft.v2')) {
    $('#draftBanner').classList.add('show');
  }

  /* ---------------- Gallery ---------------- */
  const CATS = ['all', 'traditional', 'royal', 'minimal', 'floral'];
  let currentCat = 'all';
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
        '<div class="tmpl-thumb"><img loading="lazy" src="theme/t-' + t.id + '.png" alt="' + name + '"></div>' +
        '<div class="tmpl-overlay">' +
        '  <button class="btn btn-ghost-dark btn-sm" data-act="preview">' + g.preview + '</button>' +
        '  <a class="btn btn-gold btn-sm" href="builder.html?theme=' + t.id + '">' + g.use + ' →</a>' +
        '</div>' +
        '<div class="tmpl-meta"><span class="t-name">' + name + '</span><span class="t-cat">' + g[t.cat] + '</span></div>';
      card.querySelector('.tmpl-thumb').addEventListener('click', () => openTmplModal(t));
      card.querySelector('[data-act="preview"]').addEventListener('click', () => openTmplModal(t));
      grid.appendChild(card);
    });
  }
  function openTmplModal(t) {
    const name = t.name[lang] || t.name.en;
    $('#tmplModalName').textContent = name;
    $('#tmplModalImg').src = 'images/P' + t.id + '.png';
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

  /* ---------------- Init ---------------- */
  applyLang();
})();
