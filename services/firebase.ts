import { initializeApp } from 'firebase/app';
// @ts-ignore
import { initializeAuth, getAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

const app = initializeApp(firebaseConfig);

// Initialize Auth with persistence for native, standard for web
export const auth = (function () {
    if (Platform.OS === 'web') {
        return getAuth(app);
    }
    try {
        // Attempt to find persistence function dynamically to handle version variations
        const authModule = require('firebase/auth');
        const getRNP = authModule.getReactNativePersistence || getReactNativePersistence;
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
