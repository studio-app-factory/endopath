# Endopath — Endometriosis Symptom & Flare Tracker

**Privacy-first endometriosis tracking. Body pain map, cycle integration, flare pattern detection, doctor-export PDF, shareable infographics.**

Part of the **FLOSMOSIS 50-app indie portfolio** (App A01).

---

## 🎯 Features

- **Interactive Body Pain Map** — Tap to log pain location, intensity, and zone
- **Symptom & Flare Logging** — Track 16 symptom types, menstrual flow, intercourse pain
- **Cycle Integration** — Log cycle phases, bleeding, and correlate with flares
- **Flare Pattern Detection** — On-device analysis connecting flares to cycle phase, sleep
- **Shareable Infographic** — 12-month anonymous flare pattern card for Instagram/Reddit/TikTok (3 templates)
- **Doctor Export PDF** — 4-week medical summary with all sections
- **Medication & Surgery Log** — Complete treatment history
- **Privacy-First** — All data stored locally in IndexedDB, encrypted at rest
- **Offline-First** — Full functionality without internet
- **Floseed Cross-Promotion** — Discover related health apps with member discounts

## 📱 Shareable Feature

The differentiator: **Anonymous 12-month flare-pattern infographic**. Users generate a beautiful visual card showing their most painful days, symptoms, and triggers. Export at multiple sizes:
- Instagram Stories (1080×1920)
- Instagram Posts (1080×1080)
- Reddit/Twitter Cards (1200×675)

3 aesthetic templates + hashtag templates included. Free users get a subtle 'made with Endopath' watermark; paid users get clean exports.

## 🛠 Tech Stack

- **React 19** + **TypeScript 5.9**
- **Vite 7** (build tool)
- **Tailwind CSS 4** (styling)
- **Dexie.js** (IndexedDB — local-first storage)
- **Zustand** (state management)
- **html2canvas** (share card generation)
- **jsPDF** (doctor PDF export)
- **date-fns** (date utilities)

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
src/
├── App.tsx                          # Main application shell
├── main.tsx                         # Entry point
├── index.css                        # Global styles + brand
├── types/
│   └── index.ts                     # All TypeScript types
├── lib/
│   ├── db.ts                        # Dexie database (IndexedDB)
│   ├── store.ts                     # Zustand global store
│   ├── analytics.ts                 # Event tracking layer
│   ├── shareable-generator.ts       # Card generation (<500ms)
│   ├── pdf-export.ts                # Doctor PDF export
│   └── templates.ts                 # Share card templates
├── components/
│   ├── ui/                          # Shared UI (Button, Card, Modal, BottomNav)
│   ├── onboarding/                  # 4-screen onboarding flow
│   ├── pain-map/                    # Interactive body pain map (SVG)
│   ├── shareable/                   # Share card generator UI
│   ├── tracking/                    # Symptom logging form
│   ├── paywall/                     # Paywall screen
│   ├── home/                        # Dashboard
│   ├── calendar/                    # Calendar with flare overlay
│   ├── medications/                 # Meds & surgery log
│   ├── settings/                    # Settings, privacy, export
│   └── cross-promo/                 # Floseed carousel
└── utils/
    └── cn.ts                        # classNames utility
```

## 🔒 Privacy

All data is stored **exclusively on-device** using IndexedDB (via Dexie.js). Nothing is sent to any server. The app works fully offline. Sensitive health data never leaves the user's device.

- **No cloud AI calls** — all analysis is on-device
- **No IDFA tracking** — analytics use anonymous IDs only
- **Encrypted at rest** — IndexedDB with application-level encryption

## 📊 Analytics Events

The app fires standardized portfolio events:
- `app_opened`, `onboarding_started`, `onboarding_step_completed`, `onboarding_completed`
- `paywall_viewed`, `paywall_purchased`, `paywall_dismissed`, `paywall_restored`
- `session_started`, `session_ended`
- `shareable_generated`, `shareable_shared`
- `flare_logged` (primary value-delivery event)
- `cross_promo_shown`, `cross_promo_tapped`

Events are stored locally and flushed to Mixpanel in production.

## 💰 Monetization

- **Annual**: $70/yr USD (`com.gnosis.endopath.annual`)
- **Monthly**: $6.99/mo USD (`com.gnosis.endopath.monthly`)

Free tier: 10 entries OR 7-day trial (whichever provides higher value demo).

Paywall placed on onboarding screen 3-4 (after value experience).

### Billing (RevenueCat)

Real in-app purchases are wired through `@revenuecat/purchases-capacitor` in
`src/lib/billing.ts`. The store and paywall call into that module; on web or
when API keys aren't set, it falls back to a dev mock that grants premium for
free.

**Required setup before a release build:**

1. Create a RevenueCat project at https://app.revenuecat.com, configure the
   entitlement `premium` and the two products listed above (matching the IDs
   in `metadata/revenuecat-config.json`).
2. Add these GitHub repo secrets:
   - `REVENUECAT_API_KEY_ANDROID` (e.g. `goog_xxx`)
   - `REVENUECAT_API_KEY_IOS` (e.g. `appl_xxx`)
3. Configure the same products in Google Play Console (Monetize → Products →
   Subscriptions) and App Store Connect.

Local dev: copy `.env.example` to `.env` and fill in your keys, or leave them
blank to use the mock.

## 🌐 Deployment

### Web (PWA)
```bash
npm run build
# Deploy dist/ to any static host (Vercel, Netlify, Cloudflare Pages)
```

### iOS (Capacitor)
```bash
npx cap add ios
npx cap sync
npx cap open ios
```

### Android (Capacitor)
```bash
npx cap add android
npx cap sync
npx cap open android
```

### Releasing via CI

Pushing a `v*` git tag triggers `.github/workflows/build-android.yml`, which:
1. Builds the web app with the RevenueCat keys injected from secrets
2. Generates the `android/` folder fresh (`npx cap add android`)
3. Syncs version name + code from the tag (e.g. `v1.0.0` → `versionName "1.0.0"`,
   `versionCode = number of v* tags so far`)
4. Signs the AAB with the keystore from `ANDROID_KEYSTORE_BASE64`
5. Uploads to the **Google Play Internal Testing track** as a draft

```bash
git tag v1.0.0
git push origin v1.0.0
```

Then promote the draft in Play Console after filling Data Safety + content
rating questionnaires.

## 📋 App Store Metadata

See `/metadata/` directory for:
- App Store listing (en, pt_BR, es, de)
- Google Play listing (en, pt_BR, es, de)
- Screenshot specs
- Keyword research

## 🔗 Cross-Promotion (Floseed)

Cluster A: Buying Endopath unlocks 30% off:
- Migrainary (migraine tracker)
- Fibroline (fibromyalgia tracker)
- GutScout (IBS/gut health)
- MS Compass (MS tracker)

## 📝 License

Proprietary. All rights reserved.

---

Built with 💜 for the 1 in 10.
