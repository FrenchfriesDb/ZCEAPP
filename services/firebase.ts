import { initializeApp } from 'firebase/app';
// @ts-ignore
import { initializeAuth, getAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
    apiKey: "AIzaSyBhZvABCnxMKf85EUj8NjBzwJO9tb9_ZPc",
    authDomain: "zce-ai-18385.firebaseapp.com",
    projectId: "zce-ai-18385",
    storageBucket: "zce-ai-18385.firebasestorage.app",
    messagingSenderId: "865041448347",
    appId: "1:865041448347:web:96cd085ea158b3e5f6353e",
    measurementId: "G-BBRFS86YH9"
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
