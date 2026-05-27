import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.studioappfactory.endopath',
  appName: 'Endopath',
  webDir: 'dist',
  bundledWebRuntime: false,
  ios: {
    contentInset: 'always',
    backgroundColor: '#FAF5F0'
  },
  android: {
    backgroundColor: '#FAF5F0'
  },
  plugins: {
    SplashScreen: {
      // App calls SplashScreen.hide() from src/lib/platform.ts after first
      // meaningful render — that avoids the fixed 2-second hard delay and
      // lets snappy devices skip straight to onboarding/home.
      launchAutoHide: false,
      backgroundColor: '#FAF5F0',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#FAF5F0',
      overlaysWebView: false
    },
    Keyboard: {
      resize: 'body',
      style: 'LIGHT',
      resizeOnFullScreen: true
    }
  }
};

export default config;
