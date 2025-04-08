import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.moduscreate.appmedaigen',
  appName: 'MedReport AI GEN',
  webDir: 'dist',
  plugins: {
    StatusBar: {
      style: 'light',
      overlaysWebView: true,
      backgroundColor: '#4765ff'
    }
  },
  ios: {
    contentInset: 'automatic'
  },
  android: {
    // Handle status bar color/transparency on Android
    backgroundColor: '#4765ff'
  },
  server: {
    allowNavigation: [
			"*"
		]
  }
};

export default config;
