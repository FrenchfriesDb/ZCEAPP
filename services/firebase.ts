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

const defaultFirebaseConfig = {
    apiKey: 'AIzaSyBhZvABCnxMKf85EUj8NjBzwJO9tb9_ZPc',
    authDomain: 'zce-ai-18385.firebaseapp.com',
    projectId: 'zce-ai-18385',
    storageBucket: 'zce-ai-18385.firebasestorage.app',
    messagingSenderId: '865041448347',
    appId: '1:865041448347:web:96cd085ea158b3e5f6353e',
    measurementId: 'G-BBRFS86YH9',
};

const readFirebaseExtra = (): FirebaseExtraConfig['firebase'] => {
    const manifest2Extra =
        (Constants as any)?.manifest2?.extra?.expoClient?.extra ||
        (Constants as any)?.manifest2?.extra;
    const manifestExtra = (Constants as any)?.manifest?.extra;
    const expoConfigExtra = Constants.expoConfig?.extra;

    const extra = (expoConfigExtra || manifest2Extra || manifestExtra || {}) as FirebaseExtraConfig;
    return extra.firebase || {};
};

const firebaseExtra = readFirebaseExtra();

const firebaseConfig = {
    apiKey: firebaseExtra.apiKey || defaultFirebaseConfig.apiKey,
    authDomain: firebaseExtra.authDomain || defaultFirebaseConfig.authDomain,
    projectId: firebaseExtra.projectId || defaultFirebaseConfig.projectId,
    storageBucket: firebaseExtra.storageBucket || defaultFirebaseConfig.storageBucket,
    messagingSenderId: firebaseExtra.messagingSenderId || defaultFirebaseConfig.messagingSenderId,
    appId: firebaseExtra.appId || defaultFirebaseConfig.appId,
    measurementId: firebaseExtra.measurementId || defaultFirebaseConfig.measurementId,
};

const hasRequiredFirebaseConfig = Boolean(
    firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId
);

if (!hasRequiredFirebaseConfig) {
    console.warn(
        '[Firebase] Missing Firebase config after manifest resolution. Falling back to embedded public project config.'
    );
}

const app = initializeApp(firebaseConfig);

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
