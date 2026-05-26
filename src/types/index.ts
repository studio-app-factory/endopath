// ============================================================
// ENDOPATH — Core Type Definitions
// ============================================================

// --- User & Account ---
export interface UserProfile {
  id: string;
  installDate: string; // ISO
  isPremium: boolean;
  purchaseProduct?: string;
  purchaseDate?: string;
  totalSessions: number;
  lastSessionAt?: string;
  totalShareActions: number;
  floseedPortfolioApps: string[];
  onboardingCompleted: boolean;
  /** ISO timestamp when the 14-day Pro trial ends. null = no trial active. */
  trialEndsAt: string | null;
  /** True once the trial has been started — used to prevent re-offering. */
  trialUsed: boolean;
  /**
   * Ads consent state. Default 'unknown' until the user has answered the
   * consent dialog. The ad SDK is never initialised unless this === 'accepted'
   * AND the user is on the free tier.
   */
  adsConsent: AdsConsent;
  currency: CurrencyCode;
  locale: LocaleCode;
}

export type AdsConsent = 'unknown' | 'accepted' | 'rejected';

export type CurrencyCode = 'USD' | 'AUD' | 'BRL' | 'EUR' | 'GBP';
export type LocaleCode = 'en' | 'pt_BR' | 'es' | 'de';

// --- Symptom Logging ---
export interface SymptomEntry {
  id: string;
  timestamp: string; // ISO
  date: string; // YYYY-MM-DD for calendar queries
  painLevel: number; // 1-10
  painLocations: PainLocation[];
  symptoms: SymptomType[];
  flowLevel?: FlowLevel; // menstrual flow
  isBleeding: boolean;
  intercoursePain?: boolean;
  intercoursePainLevel?: number; // 1-10
  notes?: string;
  // Context
  cycleDay?: number;
  cyclePhase?: CyclePhase;
  sleepHours?: number;
  sleepQuality?: 1 | 2 | 3 | 4 | 5;
  dietNotes?: string;
  weatherPressure?: number; // hPa
  weatherHumidity?: number;
  // Derived
  isFlare: boolean; // computed: pain >= 7 OR (pain >=5 && multi-location)
  flareType?: FlareType;
}

export interface PainLocation {
  id: string;
  x: number; // normalized 0-1 on body map
  y: number;
  side: 'left' | 'right' | 'center';
  zone: BodyZone;
  intensity: number; // 1-10
}

export type BodyZone =
  | 'head'
  | 'chest'
  | 'upper_abdomen'
  | 'lower_abdomen'
  | 'pelvis'
  | 'lower_back'
  | 'hips'
  | 'thighs'
  | 'knees'
  | 'shoulders'
  | 'other';

export type SymptomType =
  | 'cramping'
  | 'sharp_pain'
  | 'dull_ache'
  | 'bloating'
  | 'nausea'
  | 'fatigue'
  | 'headache'
  | 'backache'
  | 'leg_pain'
  | 'painful_bm'
  | 'painful_urination'
  | 'brain_fog'
  | 'anxiety'
  | 'depression'
  | 'insomnia'
  | 'hot_flashes'
  | 'other';

export type FlowLevel = 'none' | 'spotting' | 'light' | 'moderate' | 'heavy' | 'very_heavy';
export type CyclePhase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal' | 'unknown';
export type FlareType = 'severe' | 'moderate' | 'mild';

// --- Cycle Tracking ---
export interface CycleRecord {
  id: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string;
  cycleLength: number; // days
  periodLength: number; // days
  isPredicted: boolean;
  notes?: string;
}

// --- Medication & Surgery ---
export interface MedicationLog {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  category: MedicationCategory;
  effectiveness?: 1 | 2 | 3 | 4 | 5;
  notes?: string;
}

export type MedicationCategory =
  | 'nsaid'
  | 'hormonal'
  | 'opioid'
  | 'muscle_relaxant'
  | 'supplement'
  | 'other';

export interface SurgeryLog {
  id: string;
  procedure: string;
  date: string;
  surgeon?: string;
  hospital?: string;
  type: SurgeryType;
  notes?: string;
  recoveryDuration?: number; // days
}

export type SurgeryType = 'laparoscopy' | 'laparotomy' | 'hysterectomy' | 'oophorectomy' | 'excision' | 'ablation' | 'other';

// --- Doctor Export ---
export interface ExportConfig {
  startDate: string;
  endDate: string;
  includeSections: ExportSection[];
  format: 'pdf';
}

export type ExportSection =
  | 'summary'
  | 'pain_log'
  | 'symptoms'
  | 'medications'
  | 'surgeries'
  | 'cycle_data'
  | 'flare_analysis'
  | 'intercourse_pain';

// --- Shareable Feature ---
export type ShareTemplateId = 'watercolor_rose' | 'night_bloom' | 'minimal_clean';

export interface ShareTemplate {
  id: ShareTemplateId;
  name: string;
  description: string;
  isPremium: boolean; // true = paid-only template
  previewThumb: string; // data URL or path
}

export interface ShareConfig {
  templateId: ShareTemplateId;
  size: ShareSize;
  includeName: boolean;
  hashtags: string[];
  timeRangeMonths: number; // 1-12
}

export type ShareSize = 'instagram_stories' | 'instagram_post' | 'reddit_twitter';

export interface ShareDimensions {
  width: number;
  height: number;
}

export const SHARE_DIMENSIONS: Record<ShareSize, ShareDimensions> = {
  instagram_stories: { width: 1080, height: 1920 },
  instagram_post: { width: 1080, height: 1080 },
  reddit_twitter: { width: 1200, height: 675 },
};

// --- Paywall ---
export interface PaywallConfig {
  trigger: PaywallTrigger;
  products: PaywallProduct[];
}

export type PaywallTrigger =
  | 'onboarding_step3'
  | 'share_export'
  | 'settings_upgrade'
  | 'history_locked'
  | 'analytics_locked'
  | 'backup_locked';

export interface PaywallProduct {
  id: string;
  name: string;
  price: number;
  currency: CurrencyCode;
  formattedPrice: string;
  type: 'annual' | 'monthly';
  entitlement: 'premium';
}

// --- Cross-Promotion (Floseed) ---
export interface FloseedApp {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  discountPercent: number;
  deepLink: string;
}

export interface CrossPromoEvent {
  type: 'floseed_account_detected'
    | 'floseed_discount_applied'
    | 'cross_promo_shown'
    | 'cross_promo_tapped'
    | 'cross_promo_install_completed';
  appsShown?: string[];
  appId?: string;
  discountPercent?: number;
}

// --- Analytics ---
export type PortfolioEvent =
  | 'app_opened'
  | 'onboarding_started'
  | 'onboarding_step_completed'
  | 'onboarding_completed'
  | 'onboarding_abandoned'
  | 'paywall_viewed'
  | 'paywall_purchased'
  | 'paywall_purchase_failed'
  | 'paywall_dismissed'
  | 'paywall_restored'
  | 'trial_started'
  | 'ads_consent_accepted'
  | 'ads_consent_rejected'
  | 'session_started'
  | 'session_ended'
  | 'shareable_generated'
  | 'shareable_shared'
  | 'flare_logged'
  | 'floseed_account_detected'
  | 'cross_promo_shown'
  | 'cross_promo_tapped';

export interface AnalyticsEvent {
  id: string;
  event: PortfolioEvent;
  timestamp: string;
  params: Record<string, string | number | boolean | string[]>;
}

// --- App State ---
export type AppScreen =
  | 'onboarding'
  | 'home'
  | 'calendar'
  | 'pain_map'
  | 'log_entry'
  | 'shareable'
  | 'medications'
  | 'surgeries'
  | 'settings'
  | 'paywall'
  | 'cross_promo';

export interface AppState {
  currentScreen: AppScreen;
  isOnboarding: boolean;
  onboardingStep: number;
  showPaywall: boolean;
  paywallTrigger: PaywallTrigger | null;
  showCrossPromo: boolean;
  /** True iff the user holds an active RevenueCat 'premium' entitlement. */
  isPremium: boolean;
  /** ISO timestamp; null when no trial active or already ended. */
  trialEndsAt: string | null;
  /** True once trial has been used (prevents re-offer). */
  trialUsed: boolean;
}
