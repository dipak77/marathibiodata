var http = require('http');
var path = require('path');
var express = require('express');
var crypto = require('crypto');

var router = express();
var server = http.createServer(router);

// Support payloads for canvas images (bounded)
router.use(express.json({ limit: '8mb' }));
router.use(express.urlencoded({ extended: true, limit: '8mb' }));

// Basic security headers
router.use(function (req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Simple in-memory rate limiter (per IP, sliding window)
function rateLimit(windowMs, max) {
  const hits = new Map();
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of hits) if (now - v.start > windowMs) hits.delete(k);
  }, windowMs).unref();
  return function (req, res, next) {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    let e = hits.get(ip);
    if (!e || now - e.start > windowMs) { e = { start: now, count: 0 }; hits.set(ip, e); }
    e.count++;
    if (e.count > max) return res.status(429).json({ success: false, error: 'Too many requests' });
    next();
  };
}

// Bounded cache with TTL + max entries
function ttlCache(maxEntries, ttlMs) {
  const map = new Map();
  return {
    get(key) {
      const e = map.get(key);
      if (!e) return undefined;
      if (Date.now() > e.t) { map.delete(key); return undefined; }
      return e.v;
    },
    set(key, value) {
      if (map.size >= maxEntries) {
        const oldest = map.keys().next().value;
        map.delete(oldest);
      }
      map.set(key, { v: value, t: Date.now() + ttlMs });
    },
    has(key) { return this.get(key) !== undefined; }
  };
}

// Dedicated download endpoint with Content-Disposition for guaranteed Downloads folder delivery
router.post('/api/download', rateLimit(60 * 1000, 30), function (req, res) {
  try {
    const dataUrl = req.body.dataUrl;
    let filename = req.body.filename || 'shubh-biodata.jpg';
    const format = (req.body.format || '').toLowerCase();

    if (!dataUrl || typeof dataUrl !== 'string') {
      return res.status(400).send('No data provided');
    }

    const commaIndex = dataUrl.indexOf(',');
    if (commaIndex === -1 || commaIndex > 8 * 1024 * 1024) {
      return res.status(400).send('Invalid data URL');
    }

    const header = dataUrl.slice(0, commaIndex);
    const base64Data = dataUrl.slice(commaIndex + 1);
    const mimeMatch = header.match(/data:([a-z0-9.+-]+\/[a-z0-9.+-]+)/i);

    // Only allow known safe types
    const SAFE_MIME = { jpg: 'image/jpeg', png: 'image/png', pdf: 'application/pdf' };
    let defaultMime = SAFE_MIME.jpg;
    let defaultExt = 'jpg';
    if (format === 'png' || filename.toLowerCase().endsWith('.png')) {
      defaultMime = SAFE_MIME.png; defaultExt = 'png';
    } else if (format === 'pdf' || filename.toLowerCase().endsWith('.pdf')) {
      defaultMime = SAFE_MIME.pdf; defaultExt = 'pdf';
    }

    const sniffed = mimeMatch ? mimeMatch[1].toLowerCase() : '';
    const mimeType = (sniffed === 'image/jpeg' || sniffed === 'image/png' || sniffed === 'application/pdf')
      ? sniffed : defaultMime;

    const buffer = Buffer.from(base64Data, 'base64');

    // Ensure safe ASCII filename with proper extension
    filename = filename.replace(/[^a-zA-Z0-9._-]/g, '').replace(/\.{2,}/g, '.').trim();
    if (!filename || filename === '.' ) filename = 'shubh-biodata';
    if (!filename.toLowerCase().endsWith('.' + defaultExt)) {
      filename = filename + '.' + defaultExt;
    }

    res.setHeader('Content-Disposition', 'attachment; filename="' + filename + '"');
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (err) {
    console.error('Server download error:', err);
    res.status(500).send('Download error');
  }
});

// Legacy /downloadCanvas route compatibility
router.post('/downloadCanvas', function (req, res) {
  try {
    const dataUrl = req.body.canvasDataURL;
    if (!dataUrl) return res.status(400).send('No canvasDataURL');
    const matches = dataUrl.match(/^data:([A-Za-z0-9.+-]+\/[A-Za-z0-9.+-]+);base64,(.+)$/);
    const buffer = Buffer.from(matches ? matches[2] : dataUrl, 'base64');
    res.setHeader('Content-Disposition', 'attachment; filename="DownloadedCanvas.png"');
    res.setHeader('Content-Type', 'image/png');
    res.send(buffer);
  } catch (e) {
    res.status(500).send('Error');
  }
});

// Bounded in-memory caches
const translitCache = ttlCache(2000, 24 * 60 * 60 * 1000);
const translateCache = ttlCache(2000, 24 * 60 * 60 * 1000);

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function fetchJson(url, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs || 3500);
  try {
    const resp = await fetch(url, { signal: controller.signal, headers: { 'User-Agent': UA } });
    return await resp.json();
  } finally {
    clearTimeout(timeout);
  }
}

// Helper: offline transliteration fallback
function offlineTransliterate(text) {
  if (!text) return '';
  const map = {
    'a': 'अ', 'aa': 'आ', 'i': 'इ', 'ee': 'ई', 'u': 'उ', 'oo': 'ऊ', 'e': 'ए', 'ai': 'ऐ', 'o': 'ओ', 'au': 'औ',
    'k': 'क', 'kh': 'ख', 'g': 'ग', 'gh': 'घ', 'ch': 'च', 'chh': 'छ', 'j': 'ज', 'jh': 'झ',
    't': 'त', 'th': 'थ', 'd': 'द', 'dh': 'ध', 'n': 'न', 'p': 'प', 'ph': 'फ', 'b': 'ब', 'bh': 'भ', 'm': 'म',
    'y': 'य', 'r': 'र', 'l': 'ल', 'v': 'व', 'w': 'व', 'sh': 'श', 's': 'स', 'h': 'ह'
  };
  return text.toLowerCase().replace(/sh|ch|kh|gh|jh|th|dh|ph|bh|aa|ee|oo|ai|au|[a-z]/g, m => map[m] || m);
}

// 1. Single text transliteration (Google Input Tools)
router.get('/api/transliterate', rateLimit(60 * 1000, 60), async function (req, res) {
  try {
    const text = String(req.query.text || '').slice(0, 500).trim();
    const lang = (req.query.lang || 'mr').toLowerCase();
    if (!text) return res.json({ success: true, result: '', original: '' });

    const cacheKey = `${lang}:${text}`;
    const cached = translitCache.get(cacheKey);
    if (cached !== undefined) {
      return res.json({ success: true, result: cached, original: text });
    }

    const itc = lang === 'hi' ? 'hi-t-i0-und' : 'mr-t-i0-und';
    const url = `https://inputtools.google.com/request?text=${encodeURIComponent(text)}&itc=${itc}&num=1&cp=0&cs=1&ie=utf-8&oe=utf-8`;

    try {
      const data = await fetchJson(url, 3500);
      if (data && data[0] === 'SUCCESS' && Array.isArray(data[1])) {
        const result = data[1].map(item => (item && item[1] && item[1][0]) ? item[1][0] : (item && item[0] ? item[0] : '')).join('');
        if (result) {
          translitCache.set(cacheKey, result);
          return res.json({ success: true, result, original: text });
        }
      }
    } catch (e) {
      console.warn('Google Input Tools network/timeout error, using offline fallback:', e.message);
    }

    const fallback = offlineTransliterate(text);
    return res.json({ success: true, result: fallback || text, original: text });
  } catch (err) {
    console.error('Transliterate endpoint error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Single text translation (Google Translate GTX)
router.get('/api/translate', rateLimit(60 * 1000, 60), async function (req, res) {
  try {
    const text = String(req.query.text || '').slice(0, 2000).trim();
    const from = (req.query.from || 'auto').toLowerCase().replace(/[^a-z]/g, '') || 'auto';
    const to = (req.query.to || 'mr').toLowerCase().replace(/[^a-z]/g, '') || 'mr';
    if (!text) return res.json({ success: true, result: '', original: '' });

    const cacheKey = `${from}:${to}:${text}`;
    const cached = translateCache.get(cacheKey);
    if (cached !== undefined) {
      return res.json({ success: true, result: cached, original: text });
    }

    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;
    const data = await fetchJson(url, 3500);

    const result = ((data && data[0]) || []).map(seg => seg[0]).join('') || text;
    translateCache.set(cacheKey, result);
    return res.json({ success: true, result, original: text });
  } catch (err) {
    console.error('Translate endpoint error:', err);
    res.json({ success: false, result: req.query.text || '', error: err.message });
  }
});

// 3. Batch translation for all biodata fields on language change
router.post('/api/translate-fields', rateLimit(60 * 1000, 20), async function (req, res) {
  try {
    const { fields = {}, from = 'mr', to = 'mr' } = req.body || {};
    if (from === to) {
      return res.json({ success: true, fields });
    }

    const properNounFields = new Set([
      'name', 'caste', 'birthPlace', 'fatherName', 'motherName',
      'mama', 'relatives', 'devak', 'gotra'
    ]);

    const entries = Object.entries(fields).slice(0, 40);
    const results = await Promise.all(entries.map(async ([key, val]) => {
      if (!val || typeof val !== 'string' || !val.trim()) {
        return [key, val];
      }
      const rawVal = val.trim().slice(0, 2000);
      const cacheKey = `${from}:${to}:${rawVal}`;
      const cached = translateCache.get(cacheKey);
      if (cached !== undefined) {
        return [key, cached];
      }

      // If converting from English to Marathi or Hindi for proper nouns / names:
      if (from === 'en' && (to === 'mr' || to === 'hi') && properNounFields.has(key)) {
        try {
          const itc = to === 'hi' ? 'hi-t-i0-und' : 'mr-t-i0-und';
          const tUrl = `https://inputtools.google.com/request?text=${encodeURIComponent(rawVal)}&itc=${itc}&num=1&cp=0&cs=1&ie=utf-8&oe=utf-8`;
          const tData = await fetchJson(tUrl, 3000);
          if (tData && tData[0] === 'SUCCESS' && Array.isArray(tData[1])) {
            const resVal = tData[1].map(item => (item && item[1] && item[1][0]) ? item[1][0] : (item && item[0] ? item[0] : '')).join('');
            if (resVal) {
              translateCache.set(cacheKey, resVal);
              return [key, resVal];
            }
          }
        } catch (e) { /* fallback to gtx */ }
      }

      // Standard Google Translate
      try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(rawVal)}`;
        const data = await fetchJson(url, 3500);
        const resVal = ((data && data[0]) || []).map(seg => seg[0]).join('').trim() || rawVal;
        translateCache.set(cacheKey, resVal);
        return [key, resVal];
      } catch (err) {
        console.warn(`Translation failed for field ${key}:`, err.message);
        return [key, rawVal];
      }
    }));

    const translatedFields = Object.fromEntries(results);
    res.json({ success: true, fields: translatedFields });
  } catch (err) {
    console.error('Batch translation error:', err);
    res.status(500).json({ success: false, error: err.message, fields: (req.body && req.body.fields) || {} });
  }
});

// Premium unlock verification stub — wire to payment webhook in production.
// Tokens are HMAC-signed server-side so clients cannot mint their own.
const PREMIUM_SECRET = process.env.PREMIUM_SECRET || crypto.randomBytes(32).toString('hex');
router.post('/api/premium/verify', rateLimit(60 * 1000, 10), function (req, res) {
  const { orderId, paymentStatus } = req.body || {};
  if (paymentStatus === 'PAID' && orderId) {
    const token = crypto.createHmac('sha256', PREMIUM_SECRET).update(String(orderId)).digest('hex');
    return res.json({ success: true, token });
  }
  res.status(402).json({ success: false, error: 'Payment not verified' });
});

router.use(express.static(path.resolve(__dirname, 'client')));

console.log('Booting up the server! Please wait until finished...');
server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function () {
  var addr = server.address();
  console.log("All ready! Server listening at", addr.address + ":" + addr.port);
});
