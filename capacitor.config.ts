import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // Replace this sample identifier before publishing a forked Android app.
  appId: 'com.example.connect4',
  appName: 'Connect 4',
  webDir: 'out',
  server: {
    androidScheme: 'https',
  },
};

export default config;
