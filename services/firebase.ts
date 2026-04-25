import { initializeApp } from 'firebase/app';
// @ts-ignore
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { getAuth, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

type FirebaseExtraConfig = {
    firebase?: {
        apiKey?: string;
        authDomain?: string;
        projectId?: string;
        storageBucket?: string;
        messagingSenderId?: string;
        appId?: string;
        measurementId?: string;
    };
};

const extra = ((Constants.expoConfig?.extra || {}) as FirebaseExtraConfig);
const firebaseExtra = extra.firebase || {};

const firebaseConfig = {
    apiKey: firebaseExtra.apiKey || '',
    authDomain: firebaseExtra.authDomain || '',
    projectId: firebaseExtra.projectId || '',
    storageBucket: firebaseExtra.storageBucket || '',
    messagingSenderId: firebaseExtra.messagingSenderId || '',
    appId: firebaseExtra.appId || '',
    measurementId: firebaseExtra.measurementId || '',
};

const hasRequiredFirebaseConfig = Boolean(
    firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId
);

if (!hasRequiredFirebaseConfig) {
    console.warn(
        '[Firebase] Missing EXPO_PUBLIC_FIREBASE_* config in app config. Using safe placeholder config to prevent launch crash.'
    );
}

const safeFirebaseConfig = hasRequiredFirebaseConfig
    ? firebaseConfig
    : {
        apiKey: firebaseConfig.apiKey || 'missing-api-key',
        authDomain: firebaseConfig.authDomain || 'missing-auth-domain',
        projectId: firebaseConfig.projectId || 'missing-project-id',
        storageBucket: firebaseConfig.storageBucket || 'missing-storage-bucket',
        messagingSenderId: firebaseConfig.messagingSenderId || 'missing-sender-id',
        appId: firebaseConfig.appId || 'missing-app-id',
        measurementId: firebaseConfig.measurementId || 'missing-measurement-id',
    };

const app = initializeApp(safeFirebaseConfig);

// Initialize Auth with persistence for native, standard for web
export const auth = (function () {
    if (Platform.OS === 'web') {
        return getAuth(app);
    }
    try {
        // Attempt to find persistence function dynamically to handle version variations.
        // firebase@12 exposes this from `firebase/auth/react-native` instead of `firebase/auth`.
        const authModule = require('firebase/auth');
        let getRNP = authModule.getReactNativePersistence;
        if (!getRNP) {
            try {
                const rnAuthModule = require('firebase/auth/react-native');
                getRNP = rnAuthModule.getReactNativePersistence;
            } catch {
                getRNP = undefined;
            }
        }
        if (getRNP) {
            return initializeAuth(app, {
                persistence: getRNP(AsyncStorage)
            });
        }
        return getAuth(app);
    } catch (e) {
        console.warn('Firebase Auth persistence setup failed, falling back:', e);
        return getAuth(app);
    }
})();

export const db = getFirestore(app);

// Initialize Analytics only on Web
if (Platform.OS === 'web') {
    const { getAnalytics, isSupported } = require('firebase/analytics');
    isSupported().then((supported: boolean) => {
        if (supported) getAnalytics(app);
    }).catch((err: any) => console.log('Analytics not supported:', err));
}

export default app;
