import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.proanaliz.ai',
  appName: 'ProAnaliz AI',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;

