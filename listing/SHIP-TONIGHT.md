# 🚀 Endopath — Ship-Tonight Checklist (v1.3.1)

Everything you need to push **Endopath v1.3.1** to **Google Play Internal Testing** tonight.
Total time, working steadily: ~45–60 min.

---

## 0. What's ready right now

| Asset | Where | Notes |
|---|---|---|
| **Signed AAB (v1.3.1)** | https://github.com/studio-app-factory/endopath/actions/runs/26484687569 → Artifacts → `android-release-aab` | Download the `.aab` inside the ZIP — that's what you upload. |
| **Phone screenshots × 6** | `listing/screenshots/play-phone/*.png` in the repo | 1080×1920 (9:16). Pick at least 2 — recommend `2-home`, `3-log-entry`, `5-paywall`, `4-calendar`. |
| **Feature graphic** | `listing/feature-graphic-1024x500.png` | 1024×500 PNG, ready to upload. |
| **App icon (512×512)** | `listing/icon-512.png` | Ready. |
| **Privacy Policy URL** | https://studio-app-factory.github.io/endopath/privacy.html | Live, HTTP 200. |
| **Terms of Service URL** | https://studio-app-factory.github.io/endopath/terms.html | Live, HTTP 200. |

---

## 1. Create the app in Play Console (5 min)

Go to https://play.google.com/console → **Create app**.

| Field | Value |
|---|---|
| App name | `Endopath` |
| Default language | English (United States) |
| App or game | App |
| Free or paid | Free |
| Declarations | Tick: Developer Program Policies + US export laws |

Click **Create app**. You'll land on the app dashboard.

---

## 2. Internal testing release (10 min — but blocked until §3–§6 are done)

Left nav → **Testing → Internal testing → Create new release**.

| Field | Value |
|---|---|
| App bundle | Drag the `.aab` from §0 |
| Release name | `1.3.1 (4)` *(versionCode will be set by CI; this is just a label)* |
| Release notes (en-US) | "First Internal Testing build. Cream/rose watercolor rebrand, freemium-with-Pro pricing, 14-day no-card trial, banner ads on free tier, doctor PDF export." |

**Don't click "Save → Review release" yet** — you'll get errors because the listing fields aren't filled. Do §3–§6 first, then come back here.

---

## 3. Store listing (10 min)

Left nav → **Grow → Store presence → Main store listing**.

| Field | Value | Source |
|---|---|---|
| App name | `Endopath` | |
| Short description (≤80) | `Privacy-first endo tracker. Map pain, spot flare patterns, share your story. #1in10` | |
| Full description (≤4000) | See `metadata/google-play-listing.md` § "en (English)" body | Paste it in |
| App icon | Upload `listing/icon-512.png` | |
| Feature graphic | Upload `listing/feature-graphic-1024x500.png` | |
| Phone screenshots | Upload at least 2 from `listing/screenshots/play-phone/` | Recommend `2-home.png`, `5-paywall.png`, `3-log-entry.png`, `4-calendar.png` in that order |
| App category | Health & Fitness *(or Medical — your call)* | |
| Tags | endometriosis, period tracker, symptom tracker, chronic pain, women's health | |
| Contact email | hello@appfactory.studio *(or whatever you use)* | |
| Website (optional) | https://studio-app-factory.github.io/endopath/ | |
| Privacy policy URL | **https://studio-app-factory.github.io/endopath/privacy.html** | |

Save.

---

## 4. App content questionnaires (15 min — the slowest section)

Left nav → **Policy → App content**. Five sub-forms:

### 4a. Privacy policy
Already set in §3. Should already show ✓.

### 4b. App access
- **Is all app functionality available without restrictions?**
  - Pick **Yes, all functionality available** — the app is free with optional Pro IAP. Pro features are paid but the app itself is open. *(If Google asks for test credentials later, we can swap to "All or some functionality is restricted" and provide a tester walkthrough.)*

### 4c. Ads
- **Does your app contain ads?** → **Yes**
- Google AdMob — banner ads on Home and Calendar screens.

### 4d. Content rating
Click **Start questionnaire** → Category → **Reference, News, or Educational** *(closest fit for a health journal)*.

Answers:
- Violence: **No** to everything
- Sexual content: **No** to everything *(intercourse pain is logged but presented clinically)*
- Profanity/crude humour: **No**
- Drugs/alcohol/tobacco references: **Yes** — references to prescription medications (in medication-tracking context only, no promotion). *Note: this is honest — the app lets users log medications.*
- Gambling: **No**
- User-generated content / social features: **No**
- Personal info collection: **No** *(data stays on device)*
- Web browser: **No**
- Digital purchases: **Yes** (the Pro subscription)
- Location: **No**
- 3D head movements: **No**

Click **Save** → **Submit**. Likely rating: **Everyone** or **Everyone 10+**.

### 4e. Target audience and content
- **Target age groups**: 18 and over *(or 13–17 + 18+ — your call; health apps usually go 18+)*
- **Appeals to children**: **No**

### 4f. News app
- **Is your app a news app?** → **No**

### 4g. COVID-19 contact tracing
- **No**

### 4h. Data safety
**The big one.** Use these answers verbatim — they match what the code actually does:

**Data collection and security:**
| Question | Answer |
|---|---|
| Does your app collect or share any of the required user data types? | **Yes** *(because of ads + IAP)* |
| Is all of the user data collected by your app encrypted in transit? | **Yes** *(HTTPS to AdMob, RevenueCat, Play Billing)* |
| Do you provide a way for users to request that their data be deleted? | **Yes** — Settings → Clear All Data, and uninstall removes everything. |

**Data types — Personal info / Health & Fitness / Financial / Location / Web / App activity / Contacts / etc.:**
- **Personal info — Name, Email, Address, Phone, User IDs, Other**: **None**
- **Financial info**: **None** — IAPs route through Google Play; we never see payment data
- **Health and fitness — Health info, Fitness info**: **NOT COLLECTED** ← important. Even though the app *tracks* this, it never leaves the device, so Google's rule is to declare it Not Collected.
- **Messages / Photos and videos / Audio / Files**: **None**
- **Calendar / Contacts**: **None**
- **App activity (in-app actions, search history, etc.)**: **None** *(events stored only on-device)*
- **Web browsing**: **None**
- **App info and performance (crash logs, diagnostics)**: **None** *(we don't ship a crash reporting SDK)*
- **Device or other IDs**:
  - **Collected: YES**
  - Shared with third parties: **Yes (Google AdMob)**
  - Optional/required: **Optional** — only if the user consents to ads
  - Purpose: **Advertising or marketing**
  - Processed ephemerally: **No**

That's the whole table. Hit **Next → Save** and review.

### 4i. Government apps / Financial features / Health apps declaration
- Government apps: **No**
- Financial features: **No**
- Health apps: Tick **General wellness** *(not a medical device, doesn't diagnose)*

---

## 5. Set up Internal Testing testers (2 min)

Left nav → **Testing → Internal testing → Testers tab**.

- **Create email list** → name it `Endopath Internal` → add your own email + anyone else who needs the build.
- Save.

Tester opt-in URL appears at the bottom of the page after you save — that's the link your testers visit to enroll.

---

## 6. Submit the release (3 min)

Back to **Testing → Internal testing → Releases** → open the draft from §2 (or create now if you skipped) → upload the AAB → fill release notes → **Save → Review release → Start rollout to Internal testing**.

Internal testing has **no review delay** — the release is live for testers within ~15 minutes of rollout.

---

## 🟡 What we're knowingly shipping WITHOUT (and what happens)

These would normally be set up before launch, but the app degrades gracefully without them. You can wire them up post-submission without rebuilding the AAB right away.

| Missing piece | Effect at runtime | When to fix |
|---|---|---|
| **`REVENUECAT_API_KEY_ANDROID` secret + RevenueCat project + Play subscriptions** | Paywall buttons "Annual $69" / "Monthly $9.99" show: *"Purchases are temporarily unavailable. Please update the app or try again later."* The 14-day free trial CTA still works (local-tracked) so users get full Pro for 14 days. | Within first week — otherwise you have a 14-day trial leading to a dead end. |
| **`ADMOB_APP_ID_ANDROID` + `ADMOB_BANNER_ID_ANDROID` secrets + AdMob account** | No banner appears on Home or Calendar. `canShowAds()` returns false; the SDK is never initialised. No AdMob ToS violation. | Within first month — that's where the free-tier revenue comes from. |
| **`GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` secret + service-account permission in Play Console** | Future tag pushes (e.g. `v1.4.0`) won't auto-upload to Internal Testing — you'd have to drag the AAB in manually each time, like tonight. | Whenever you have 10 spare minutes to do the Play Console API access setup. |
| **Apple Connect secrets** | Build iOS workflow's preflight job skips the macOS build cleanly. No iOS submission tonight. | Whenever you're ready to also ship iOS. |

---

## 🔴 If anything goes wrong

**"Upload failed: AAB signature doesn't match"** → first AAB ever. Should not happen for fresh app.

**"Version code conflict"** → Re-tag v1.3.2. CI's `versionCode = count of v* tags` so this auto-increments.

**"Privacy policy URL not reachable"** → Visit https://studio-app-factory.github.io/endopath/privacy.html in an incognito tab. If it 404s, the Pages workflow needs re-running (Settings → Pages → Source = "GitHub Actions" is already set).

**Tester can't see the app** → Opt-in URL from §5 has to be visited by the tester first. Sometimes takes ~15 min after rollout starts.

---

## 📞 Hand-back

When the release is rolling out, send the **Internal Testing opt-in URL** and you're done.

Endopath v1.3.1 will be installable from Google Play for anyone on the tester list, on real Android devices, with the full cream/rose UI, the 14-day free trial, freemium gating, body pain map, symptom log, cycle calendar, doctor PDF export, backup/restore, and Pattern Insights.
