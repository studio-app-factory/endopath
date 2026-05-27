// ============================================================
// ENDOPATH — Native platform integration
//
// Wires Capacitor's App / SplashScreen / StatusBar plugins to the JS
// app lifecycle. Web builds short-circuit every export to a no-op so
// the same code paths run in vite dev and in Capacitor without
// branching at call sites.
// ============================================================

import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { useStore } from './store';

let backButtonRegistered = false;

/**
 * Hide the launch splash and apply the light-content status bar to match
 * the cream theme. Called once on first meaningful render.
 */
export async function initNativeShell(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await SplashScreen.hide();
  } catch (e) {
    console.warn('[platform] SplashScreen.hide failed', e);
  }
  try {
    // Cream background → dark text/icons in the status bar.
    await StatusBar.setStyle({ style: Style.Light });
  } catch (e) {
    console.warn('[platform] StatusBar.setStyle failed', e);
  }
}

/**
 * Register the Android hardware back button handler. The handler maps
 * the back gesture onto the JS app's screen state so users get the
 * expected "go back" behaviour rather than the WebView default (exit).
 *
 * Behaviour (in priority order):
 *   - showPaywall          → dismissPaywall
 *   - showCrossPromo       → closeCrossPromo
 *   - currentScreen !== home → setScreen('home')
 *   - otherwise            → minimise the app (CapApp.minimizeApp)
 *
 * Idempotent — safe to call multiple times.
 */
export function registerBackButtonHandler(): void {
  if (!Capacitor.isNativePlatform()) return;
  if (Capacitor.getPlatform() !== 'android') return;
  if (backButtonRegistered) return;
  backButtonRegistered = true;

  CapApp.addListener('backButton', () => {
    const state = useStore.getState();
    if (state.showPaywall) {
      state.dismissPaywall();
      return;
    }
    if (state.showCrossPromo) {
      state.closeCrossPromo();
      return;
    }
    if (state.currentScreen !== 'home') {
      state.setScreen('home');
      return;
    }
    // Root of nav — defer to the OS (minimise) rather than exit.
    CapApp.minimizeApp().catch(() => {
      // minimizeApp is Android-only and only exists in @capacitor/app 5+ — best effort.
    });
  });
}
