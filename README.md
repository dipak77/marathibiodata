# ✨ ShubhBiodata — Premium Marathi Marriage Biodata Studio

A premium, mobile-first single-page studio for creating wedding biodatas in **Marathi, Hindi and English** — with live canvas preview, **177 designer themes**, HD downloads and a freemium business model.

![Hero](client/assets/img/hero-biodata.jpg)

---

## 🚀 Run it

```bash
npm install
npm start          # → http://localhost:3000
# or with auto-reload:
npm run dev
```

Serves `client/index.html` (landing) and `client/builder.html` (studio) statically via Express on `0.0.0.0:3000`.

Optional environment variables (server):

```bash
PORT=3000
PREMIUM_SECRET=<random-secret>     # HMAC secret for /api/premium/verify tokens
PAYTM_MID=...                      # only if wiring legacy Paytm flow
PAYTM_KEY=...
PAYTM_WEBSITE=WEBSTAGING
```

> ⚠️ **Rotate the Paytm key that was previously committed to git history** and never commit secrets again (`.gitignore` now covers `.env`).

---

## 💎 Features

### Experience & flow
- **Premium landing page** (`client/index.html`, editable source driven by `landing.js` + `i18n.js`) — hero, animated stats, 3-step flow, filterable gallery (177 themes, Free/Pro), features, pricing, testimonials, FAQ, CTA, rich footer.
- **Guided 5-step builder wizard** (`client/builder.html`) — Theme → Personal → Family → Photo & Contact → Download, live preview, mobile Form/Preview split.
- **Auto-save drafts** (localStorage `shubhbiodata.draft.v3`) with "resume" banner on landing.
- **Trilingual UI + biodata** (मराठी / हिंदी / English) with per-language field cache — switching back restores your exact original text (no translation drift).
- **Phonetic Marathi/Hindi typing** — type English, press Space, get Devanagari (Google Input Tools with offline fallback).

### Render engine (`assets/js/render.js`)
- 2× HD canvas (**1224×1584**) over theme frames (PNG 1–20, **vector SVG 21–177**).
- Adaptive layout: single column → shrink tiers → balanced two-column split, photo-aware flow, clip-safe overflow.
- Golden photo frame, ink themes (classic / maroon / green), free-plan watermark.

### 177 themes
- **8 free** themes (PNG frames `theme/t-1..20.png` subset).
- **169 premium** themes — including **157 vector SVG frames** (`theme/t-21..177.svg`) across royal, traditional, floral, minimal, regional (Marathi + South), community (Hindu/Muslim/Sikh/Christian/Jain/Buddhist), luxury, modern & festive categories.

### Business model (freemium)
- **Free ₹0** — 8 basic themes, JPG with watermark, auto-save.
- **Premium ₹49** — all 177 themes, watermark-free HD PNG/JPG/PDF.
- **Family Pack ₹149** — 5 biodatas via WhatsApp.
- Unlock is gated: demo unlock works **only on localhost**; production requires server-verified payment token (`POST /api/premium/verify` → HMAC token).

### Privacy (accurate wording)
- Biodata content + photos stay in browser localStorage; exports are generated client-side.
- **Translation / transliteration features send the typed text to Google** when used — this is disclosed in the FAQ and feature copy.

---

## 🗂 Structure

```
client/
  index.html            Landing page (readable source, landing.js + i18n.js)
  builder.html          Studio (wizard + live preview)
  assets/
    css/premium.css     Design system (wine + gold + ivory) + a11y polish
    js/i18n.js          Dictionaries + template catalogue (177 themes)
    js/render.js        HD canvas biodata engine
    js/landing.js       Landing interactions
    js/builder.js       Wizard, cropper, exports, premium unlock
    img/                Brand art
  theme/t-1..20.png     Classic raster theme frames
  theme/t-21..177.svg   Premium vector theme frames (all 177 themes)
server.js               Express: static + /api/* (download, translate, premium verify)
```

## 💳 Payments
Legacy Paytm sandbox flow was removed (broken/dead code). Wire `POST /api/premium/verify` to your payment webhook to grant production unlocks. Contact: **7709320496** · info@rdeditor.com.

## 🔥 Firebase Hosting
`firebase.json` serves `client/`. **Verify `.firebaserc` points at your intended project** before deploying (`firebase projects:list`).

---

### Repo hygiene
- `.gitignore` added — `node_modules/`, `.env*`, `.vs/`, `.firebase/`, `scratch/` are ignored (node_modules untracked from git index).
- No secrets in the tree; Paytm config reads from environment.

© 2026 ShubhBiodata · in association with RDeditor.com
