import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'net.leanstacks.ionic8',
  appName: 'Ionic Playground 8',
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
  }
};

export default config;
