# 🔧 RevenueCat Setup — Endopath

This wires real subscriptions into the app. Without it, the paywall's
"Annual $69" and "Monthly $9.99" buttons show the prod-safe error
"Purchases are temporarily unavailable" — the 14-day free trial CTA
keeps working (it's local-tracked) but users can't pay after trial.

**Order matters.** You need the Play Console app + at least one uploaded
AAB before Play will let you create subscription products. So this whole
guide runs *after* tonight's Internal Testing submission, not before.

Time: ~45 minutes once you have all three accounts open.

---

## Prerequisites

- [ ] Endopath uploaded to Play Console Internal Testing (per `SHIP-TONIGHT.md`)
- [ ] A Google Cloud account (free — you already have one if you have Play Console)
- [ ] A RevenueCat account (free at https://app.revenuecat.com — sign up if needed)

---

## Phase 1 — Create the subscription products in Play Console (15 min)

These have to exist in Play before RevenueCat can see them.

1. Play Console → **your Endopath app** → left nav **Monetize → Products → Subscriptions** → **Create subscription**.

2. **First product — Annual:**

   | Field | Value |
   |---|---|
   | Product ID | `com.gnosis.endopath.pro.annual` |
   | Name | `Endopath Pro — Annual` |
   | Description | `Unlimited history, doctor-ready PDF exports, cycle and symptom correlation reports, cross-symptom analytics, data backup & restore, ad-free experience. Billed once per year.` |
   | Benefits *(up to 4, each ≤40 chars)* | `Unlimited history` · `Doctor-ready PDF exports` · `Pattern insights` · `Ad-free experience` |
   | Add base plan → **Auto-renewing**:<br>– Billing period | **Yearly** |
   | – Price (Australia) | **AUD $69.00** |
   | – Renewal type | Auto-renewing |
   | – Grace period | 3 days (default) |
   | – Account hold | Enabled (default) |
   | – Backwards-compatible | Tick **Yes** *(needed so the Play Billing v3 client can read it — RC wants this)* |

   Click **Activate** on the base plan. The product status should go to **Active**.

3. **Second product — Monthly:**

   | Field | Value |
   |---|---|
   | Product ID | `com.gnosis.endopath.pro.monthly` |
   | Name | `Endopath Pro — Monthly` |
   | Description | Same as Annual but ends with "Billed once per month." |
   | Benefits | Same 4 |
   | Base plan → Billing period | **Monthly** |
   | – Price (Australia) | **AUD $9.99** |
   | – Other settings | Same as Annual |

   Activate.

4. **Set other-country pricing** (optional but recommended).
   Play Console has an "Auto-convert prices" button next to each base plan
   that pulls all currency localisations from the AUD price. Click it on
   both products → review the converted prices → save. This makes the
   prices look natural to US, UK, EU users (e.g. $69 AUD ≈ $46 USD).

---

## Phase 2 — Create the Google service account (10 min)

RevenueCat needs API access to Play Console to validate purchases.

1. Play Console → **Setup → API access** (left nav, near bottom).

2. If you see "Link existing project / Create new Google Cloud project", **Create new project**. Otherwise skip.

3. Once linked, scroll down to **Service accounts** → **Create new service account**.
   Google takes you to the Google Cloud Console in a new tab.

4. In Google Cloud Console:
   - Service account name: `endopath-revenuecat`
   - Click **Create and continue**
   - Role: **Pub/Sub Editor** *(RevenueCat docs require this for purchase event delivery; if you don't see it, pick **Service Account User** + "Editor" — still works)*
   - Click **Done**.
   - Back on the service account list, click the new account → **Keys** tab → **Add key → Create new key → JSON** → Save the downloaded `.json` file somewhere safe. **You can't re-download it later.**

5. Back in Play Console → **API access** → next to the new service account, click **Grant access**.

   | Permission | Value |
   |---|---|
   | App access | **Specific apps** → tick **Endopath** |
   | Account permissions | At minimum: tick **View app information**, **Manage orders and subscriptions**, **View financial data** |
   | App permissions | tick everything under Endopath |

   Click **Invite user** → **Send invite**.

6. **Add the JSON file contents as a GitHub secret too**, while you have it
   open — needed for the automated CI upload step. Open the JSON in a text
   editor, copy the WHOLE contents (it's one big block), then:

   ```
   gh secret set GOOGLE_PLAY_SERVICE_ACCOUNT_JSON < path/to/the-file.json
   ```

   (or via the GitHub UI: repo Settings → Secrets and variables → Actions
   → New repository secret → paste the JSON as the value.)

---

## Phase 3 — Set up the RevenueCat project (10 min)

1. Go to https://app.revenuecat.com → sign in / sign up.

2. **Create a new project** → name: `Endopath`. Continue.

3. You land on the project overview. Left nav: **Project settings → Apps** → **+ New app** → pick **Google Play Store**.

   | Field | Value |
   |---|---|
   | App name | `Endopath Android` |
   | Package name | `com.studioappfactory.endopath` |
   | Service account credentials JSON | Paste the WHOLE JSON file contents from §2 step 4 |

   Click **Save**.

4. RevenueCat will validate the credentials. If it fails:
   - Check the service account has access in Play Console → API access (§2 step 5)
   - It can take up to **30 minutes** for Google's permissions to propagate after you click "Send invite". Have a coffee and try again if it fails the first time.

5. **Import the subscriptions you created in §1.**
   Left nav → **Products** → **+ New** → **Import from Play Store**.
   RevenueCat will list both products you created in §1. Tick both → **Import**.

6. **Create the entitlement.**
   Left nav → **Entitlements** → **+ New entitlement**.

   | Field | Value |
   |---|---|
   | Identifier | **`premium`** *(must match `ENTITLEMENT_ID` in `src/lib/billing.ts`)* |
   | Display name | `Endopath Pro` |

   Save. Then in the entitlement's detail page → **+ Attach products** → tick both `com.gnosis.endopath.pro.annual` and `com.gnosis.endopath.pro.monthly` → Save.

7. **Create the default offering.**
   Left nav → **Offerings** → there will already be a `default` offering. Open it.
   → **+ Add packages** → add both products. Set the annual one as the "highlighted" package (the one shown as Popular).

   The offering identifier must remain `default` — that's what `Purchases.getOfferings().current` returns to the app.

8. **Get the public API key.**
   Project settings → **API keys** → there's a **Public Android SDK key**
   that looks like `goog_AbCdEfGhIjKlMnOpQrStUvWxYz`. Copy it.

---

## Phase 4 — Wire the key into the build (5 min)

The key gets baked into the AAB at build time via Vite's env-var inlining.

1. **Add to GitHub secrets:**

   ```
   gh secret set REVENUECAT_API_KEY_ANDROID
   ```

   Paste the `goog_...` key when prompted. *(For iOS later: `gh secret set REVENUECAT_API_KEY_IOS` with the `appl_...` key.)*

2. **Verify the secret list:**

   ```
   gh secret list
   ```

   You should see:
   ```
   ANDROID_KEYSTORE_BASE64
   ANDROID_KEYSTORE_PASSWORD
   ANDROID_KEY_ALIAS
   ANDROID_KEY_PASSWORD
   GOOGLE_PLAY_SERVICE_ACCOUNT_JSON   ← from §2 step 6
   REVENUECAT_API_KEY_ANDROID          ← just added
   ```

3. **Cut a new release tag** to produce a build with the key baked in:

   ```
   cd "D:/App Factory Inc (3)/Endopath"
   git pull
   # bump package.json version to 1.3.2 (or whatever)
   git commit -am "chore: bump version to 1.3.2 — RevenueCat live"
   git push
   git tag -a v1.3.2 -m "Endopath v1.3.2 — RevenueCat wired"
   git push origin v1.3.2
   ```

4. CI builds the new AAB, then uses the `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`
   secret to auto-upload it to Internal Testing as a draft. Watch:

   ```
   gh run watch
   ```

5. **Promote** the draft in Play Console → Internal testing → Releases →
   Open the new draft → **Review release** → **Start rollout to Internal testing**.

---

## Phase 5 — Test a real purchase (5 min)

You need to be in the **Internal Testing testers** list and have a **license-tester** account so purchases are sandboxed (no real money).

1. Play Console → **Setup → License testing** → add the Google account
   you'll test with → save.

2. On a physical Android device with that Google account active, install the
   latest Endopath from the Internal Testing opt-in URL.

3. Open the app → Settings → Upgrade → Tap **Annual $69 AUD/year**.
   Google's purchase sheet should open. Confirm.
   - Because you're a license tester, the order is sandboxed — no real charge.

4. In the app: paywall closes, "Account → Endopath Pro" appears in Settings,
   Pattern Insights becomes visible, the ad banner disappears (if AdMob was
   set up), backup/restore enables.

5. In RevenueCat dashboard: **Project → Customers** — your test purchase
   should appear within ~60 seconds with the `premium` entitlement active.

If purchase opens but errors → check Phase 2 service account permissions.
If purchase opens, completes, but RevenueCat shows nothing → check that the
products in RevenueCat have the EXACT same product IDs as Play Console
(`com.gnosis.endopath.pro.annual` and `.monthly`).

---

## What you now have

- Real Play Billing → RevenueCat → app entitlement flow
- Auto-upload on every future `v*` tag
- Test users can buy Pro for $0
- Real users can buy Pro for AUD $69/yr or $9.99/mo

The 14-day trial keeps working (still local-tracked) — but now when it
expires, users have a real purchase path.

---

## Optional later: tier-2 cleanup

- **Production track**: once Internal Testing has been stable for a week,
  open Play Console → Production → New release → promote the same AAB.
  Submission goes through Google review (~24–48 hours).
- **iOS setup**: mirror Phase 1-3 in App Store Connect and add an iOS app
  in the same RevenueCat project. Then `REVENUECAT_API_KEY_IOS` + tag.
- **Subscription offers**: RevenueCat → Offerings → add a discount offer
  (e.g. "1 month free if you stay for 6 months") if conversion is low.
