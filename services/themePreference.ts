import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemePreferenceMode = 'white' | 'time_sync';

const THEME_PREFERENCE_KEY = '@zce/theme_preference_mode_v1';
const DEFAULT_MODE: ThemePreferenceMode = 'white';

type ThemePreferenceListener = (mode: ThemePreferenceMode) => void;

let cachedThemeMode: ThemePreferenceMode = DEFAULT_MODE;
let hasLoadedThemeMode = false;
const listeners = new Set<ThemePreferenceListener>();

function isValidThemeMode(value: unknown): value is ThemePreferenceMode {
    return value === 'white' || value === 'time_sync';
}

function notifyListeners(mode: ThemePreferenceMode) {
    listeners.forEach((listener) => {
        try {
            listener(mode);
        } catch {
            // Never let a listener failure break propagation.
        }
    });
}

export function subscribeThemePreference(listener: ThemePreferenceListener): () => void {
    listeners.add(listener);
    listener(cachedThemeMode);
    return () => {
        listeners.delete(listener);
    };
}

export async function getThemePreferenceMode(): Promise<ThemePreferenceMode> {
    if (hasLoadedThemeMode) {
        return cachedThemeMode;
    }
    try {
        const raw = await AsyncStorage.getItem(THEME_PREFERENCE_KEY);
        cachedThemeMode = isValidThemeMode(raw) ? raw : DEFAULT_MODE;
        hasLoadedThemeMode = true;
        return cachedThemeMode;
    } catch {
        cachedThemeMode = DEFAULT_MODE;
        hasLoadedThemeMode = true;
        return cachedThemeMode;
    }
}

export async function setThemePreferenceMode(mode: ThemePreferenceMode): Promise<void> {
    cachedThemeMode = mode;
    hasLoadedThemeMode = true;
    notifyListeners(mode);
    try {
        await AsyncStorage.setItem(THEME_PREFERENCE_KEY, mode);
    } catch {
        // Best-effort persistence; UI still updates in-memory.
    }
}

export async function forceTimeSyncThemePreference(): Promise<void> {
    await setThemePreferenceMode('time_sync');
}
