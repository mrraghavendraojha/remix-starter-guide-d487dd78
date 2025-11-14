import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.communityshare.app',
  appName: 'CommunityShare',
  webDir: 'dist',
  server: {
    url: 'https://8cc74516-291f-47f1-adc1-bd832cd42eee.lovableproject.com?forceHideBadge=true',
    cleartext: true
  }
};

export default config;
