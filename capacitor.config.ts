import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.8bd0078057114d218969876511759db0',
  appName: 'bak55-ultimatesystem',
  webDir: 'dist',
  server: {
    url: 'https://8bd00780-5711-4d21-8969-876511759db0.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0a0a0a',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
      splashImmersive: true
    }
  },
  ios: {
    contentInset: 'automatic'
  },
  android: {
    backgroundColor: '#0a0a0a'
  }
};

export default config;
