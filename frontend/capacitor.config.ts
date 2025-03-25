import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.moduscreate.medreportai',
  appName: 'MedReportAI',
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
			"http://*",
			"https://*"
		]
  }
};

export default config;
