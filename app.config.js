const base = require('./app.json');

const truthy = new Set(['1', 'true', 'yes', 'on']);
const toBool = (value) => truthy.has(String(value || '').toLowerCase());

module.exports = () => {
  const expo = base.expo || {};
  const extra = expo.extra || {};
  const revenuecat = extra.revenuecat || {};
  const allowInsecureClientProviders = toBool(process.env.EXPO_PUBLIC_ALLOW_INSECURE_CLIENT_PROVIDERS);

  return {
    ...expo,
    extra: {
      ...extra,
      aiProxyUrl: process.env.EXPO_PUBLIC_AI_PROXY_URL || '',
      publicShareUrl: process.env.EXPO_PUBLIC_SHARE_URL || '',
      allowInsecureClientProviders,
      // Never ship provider secrets inside the app bundle.
      // AI provider keys must live on the proxy server (.env.proxy), not client runtime config.
      aiProviders: {},
      revenuecat: {
        ...revenuecat,
        iosApiKey: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY || '',
        androidApiKey: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY || '',
      },
      firebase: {
        apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
        authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
        projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
        storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
        messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
        appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
        measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || '',
      },
    },
  };
};
