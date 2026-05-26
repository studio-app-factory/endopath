# Privacy Policy — Endopath

**Last Updated: 26 May 2026**

## Our Commitment

Endopath is built on a simple principle: **your health data belongs to you, and only you.** We do not collect, store, transmit, or have access to any of your symptom entries, pain maps, cycle data, medication logs, or any other health information you record in the app.

## Data Storage

All data you enter in Endopath is stored **exclusively on your device** using encrypted local storage (IndexedDB with application-level encryption). No health data is transmitted to our servers or any third-party servers. The app is fully functional without an internet connection.

## What We DO Collect

To improve the app and understand usage patterns, we collect anonymous, non-identifiable analytics:

- **App opens and session duration** (anonymous ID, not linked to identity)
- **Feature usage** (e.g., "share card generated", "entry logged")
- **Purchase events** (via RevenueCat, for payment processing)
- **Crash reports** (via Sentry, to fix bugs)

**None of these events contain health data, symptom details, pain locations, or any personally identifiable health information.**

## Advertising (free tier only)

The free tier shows a banner ad on two screens (home dashboard and cycle history calendar). **Endopath Pro subscribers and users inside the 14-day Pro trial see no ads, and the ad SDK is not initialised at all for them.**

### Google AdMob

AdMob is the only third-party SDK shipped with Endopath that touches device data.

**What AdMob receives when ads are shown:**
- Advertising identifier (Google Advertising ID on Android; IDFA on iOS, only if you grant App Tracking Transparency permission)
- IP address (Google may derive an approximate, city-level location from this)
- Device model, OS version, language, screen size
- Whether this is an ad impression or click

**What AdMob does NOT receive.** Your symptoms, pain levels, body-map entries, cycle records, medications, notes, or any other content you create in the app. That data never leaves your device.

**Consent.** The first time you open Endopath as a free user, the app asks whether you'll accept banner ads. Until you tap Accept, the ad SDK is never initialised and no network call is made to any AdMob domain. You can change this any time in Settings → Privacy & Data → "Show banner ads". Upgrading to Endopath Pro removes ads entirely.

**Category blocks.** AdMob is instructed never to serve ads in these categories: gambling, alcohol, weight-loss / dieting / fasting, fertility and IVF, MLM / network marketing, dating, religious content, political content, cosmetic surgery and injectables, and prescription medicines (including Ozempic and similar).

**Retention.** Governed by [Google's privacy policy](https://policies.google.com/privacy).

## Other Third-Party Services

### RevenueCat (Purchases)
RevenueCat processes in-app purchases. They receive your anonymous app user ID and purchase token. They do not receive health data. [RevenueCat Privacy Policy](https://www.revenuecat.com/privacy)

### Mixpanel (Analytics)
Mixpanel receives anonymous event data (e.g., "app opened", "entry logged") with a randomly generated device ID. No health data is included. No IDFA is used. [Mixpanel Privacy Policy](https://mixpanel.com/legal/privacy-policy)

### Sentry (Crash Reporting)
Sentry receives crash logs and technical diagnostic data to help us fix bugs. Crash logs may include the screen you were viewing when the crash occurred but do not include health data. [Sentry Privacy Policy](https://sentry.io/privacy)

## Your Rights

- **Access**: All your data is on your device. You can view it at any time in the app.
- **Export**: You can export your data as a PDF from the Settings screen.
- **Delete**: You can delete all your data at any time from Settings → Clear All Data. This is permanent and irreversible.
- **No account required**: Endopath does not require an account. You can use the full app without creating any login.

## Children's Privacy

Endopath is not directed to children under 13. We do not knowingly collect data from children under 13.

## Changes to This Policy

We will notify you of any material changes to this privacy policy through the app.

## Contact

For privacy questions: privacy@endopath.app

---

*Endopath is developed by Floseed Health, a portfolio of privacy-first chronic condition management tools.*
