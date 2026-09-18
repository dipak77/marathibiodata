# ✨ ShubhBiodata — Premium Marathi Marriage Biodata Studio

A complete redesign of the classic RDeditor Marathi biodata maker into a **premium, mobile-first single-page studio** for creating wedding biodatas in **Marathi, Hindi and English** — with live preview, 20 designer themes, HD downloads and a freemium business model.

![Hero](client/assets/img/hero-biodata.jpg)

---

## 🚀 Run it

```bash
npm install
node server.js        # → http://localhost:3000
```

Serves `client/index.html` (landing) and `client/builder.html` (studio) statically via Express on `0.0.0.0:3000`.

---

## 💎 What's new (redesign)

### Experience & flow
- **Premium landing page** — hero with generated brand art, animated stats, 3-step flow, filterable template gallery (20 themes, Free/Pro), feature grid, multilingual band, pricing, testimonial slider, FAQ accordion, CTA band and rich footer.
- **Guided 5-step builder wizard** — Theme → Personal → Family → Photo & Contact → Download, with prev/next, free step-jumping and a mobile "Form / Preview" split view.
- **Live preview** — every keystroke re-renders the real biodata canvas, no guessing.
- **Auto-save drafts** (localStorage) with "resume where you left" banner on landing.
- **Trilingual UI + biodata** (मराठी / हिंदी / English) — labels, dates (१५ जून १९९८), numerals (५'८"), section names all adapt automatically.

### New render engine (`assets/js/render.js`)
- 2× HD canvas (**1224×1584**) over the existing 20 theme frames.
- **Smart adaptive layout**: single column → compact tiers → automatic **two-column split** for rich profiles; photo-aware text flow, word-wrap + shrink-to-fit, so content never overflows.
- Sections with gold rules & diamonds: वैयक्तिक / ज्योतिष / शिक्षण व व्यवसाय / कौटुंबिक / संपर्क / अपेक्षा.
- Golden photo frame with double border and corner diamonds.
- Old output bugs fixed: no more `undefined`, `२ {२ विवाहित}` → `२ (१ विवाहित)` etc.
- Ink themes: classic black / royal maroon / forest green.

### Business model (freemium)
- **Free ₹0** — 8 basic themes, JPG download with tasteful diagonal watermark + footer strip, auto-save draft.
- **Premium ₹49** (one-time) — all 20+ themes, watermark-free **HD PNG / JPG / PDF (A4)**, golden photo frame, priority WhatsApp support. Unlock via UPI intent / demo unlock in the studio modal.
- **Family Pack ₹149** — 5 premium biodatas (ordered via WhatsApp).

### Rich feature list
- 📸 Built-in photo cropper (drag + zoom, exact frame aspect).
- 🔒 100% private — everything is generated client-side; nothing is uploaded.
- ⬇️ Downloads: HD PNG, JPG, true A4 PDF (jsPDF).
- 👨‍👩‍👧 Sibling counters with married counts, date→Devanagari conversion, height/rashi/nadi/gan pickers.
- 🧾 Legacy pages preserved: `aboutus.html`, `contactus.html`, `termcondition.html`, `returnredfund.html`.

## 🗂 Structure

```
client/
  index.html            Premium landing page
  builder.html          Studio (wizard + live preview)
  assets/
    css/premium.css     Design system (wine + gold + ivory)
    js/i18n.js          Marathi/Hindi/English dictionaries + template catalogue
    js/render.js        HD canvas biodata engine (adaptive layout)
    js/landing.js       Landing interactions (gallery, slider, FAQ, i18n)
    js/builder.js       Wizard, cropper, exports, premium unlock
    img/                Generated brand art
  theme/t-*.png         20 theme frames (existing)
  images/P*.png         Theme previews (existing)
```

## 💳 Payments
The legacy Paytm sandbox flow (`index.js`, `/paynow`, `/callback`) is kept for reference. In the studio, premium unlock uses a UPI intent + demo unlock and can be wired back to `/paynow` when merchant keys are configured. Contact: **7709320496** · info@rdeditor.com.

© 2026 ShubhBiodata · in association with RDeditor.com
