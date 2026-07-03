const truthy = new Set(['1', 'true', 'yes', 'on']);
const toBool = (value) => truthy.has(String(value || '').toLowerCase());

const defaultFirebaseConfig = {
  apiKey: 'AIzaSyBhZvABCnxMKf85EUj8NjBzwJO9tb9_ZPc',
  authDomain: 'zce-ai-18385.firebaseapp.com',
  projectId: 'zce-ai-18385',
  storageBucket: 'zce-ai-18385.firebasestorage.app',
  messagingSenderId: '865041448347',
  appId: '1:865041448347:web:96cd085ea158b3e5f6353e',
  measurementId: 'G-BBRFS86YH9',
};

module.exports = () => {
  const extra = {};
  const revenuecat = extra.revenuecat || {};
  const allowInsecureClientProviders = toBool(process.env.EXPO_PUBLIC_ALLOW_INSECURE_CLIENT_PROVIDERS);

  return {
    name: 'ZCE',
    slug: 'ZCE',
    scheme: 'zce',
    version: '2.0',
    runtimeVersion: '2.0',
    icon: './assets/images/icon.png',
    updates: {
      url: 'https://u.expo.dev/d97e9439-eb4a-498b-ab9a-862ee3f3a6a5',
    },
    ios: {
      bundleIdentifier: 'com.usahealthlife.zce',
      icon: './assets/images/icon.png',
    },
    experiments: {
      typedRoutes: false,
      reactCompiler: false,
    },
    extra: {
      ...extra,
      router: {
        root: 'app',
      },
      aiProxyUrl: process.env.EXPO_PUBLIC_AI_PROXY_URL || '',
      publicShareUrl: process.env.EXPO_PUBLIC_SHARE_URL || '',
      allowInsecureClientProviders,
      // Never ship provider secrets inside the app bundle.
      // AI provider keys must live on the proxy server (.env.proxy), not client runtime config.
      aiProviders: {},
      revenuecat: {
        ...revenuecat,
        entitlementId: 'ZCE Pro',
        monthlyProductId: 'zce_director_monthly_sub',
        yearlyProductId: 'zce_director_yearly_sub',
        iosApiKey: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY || '',
        androidApiKey: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY || '',
      },
      firebase: {
        apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || defaultFirebaseConfig.apiKey,
        authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || defaultFirebaseConfig.authDomain,
        projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || defaultFirebaseConfig.projectId,
        storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || defaultFirebaseConfig.storageBucket,
        messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || defaultFirebaseConfig.messagingSenderId,
        appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || defaultFirebaseConfig.appId,
        measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || defaultFirebaseConfig.measurementId,
      },
      eas: {
        projectId: 'd97e9439-eb4a-498b-ab9a-862ee3f3a6a5',
      },
    },
  };
};
