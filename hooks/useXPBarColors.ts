import { getTimePalette, getTimeThemeInfo } from '@/constants/theme';
import { useSubscription } from '@/context/SubscriptionContext';
import { getThemePreferenceMode, subscribeThemePreference, type ThemePreferenceMode } from '@/services/themePreference';
import { useEffect, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

let lastXPBarMinuteStamp: string | null = null;

/**
 * Full cinematic palette for the XP bar ONLY.
 * Uses the actual night-dive / void-spark / midnight-mist / deep-abyss
 * gradients at night so the XP bar always looks cinematic.
 *
 * All other UI (text accents, buttons, borders) should use useTimeColors()
 * which returns a neutral silver during night hours.
 */
export const useXPBarColors = (): string[] => {
    const { isPremium } = useSubscription();
    const [palette, setPalette] = useState<string[]>(['#FFFFFF', '#FFFFFF']);
    const [themeMode, setThemeMode] = useState<ThemePreferenceMode>('white');

    useEffect(() => {
        let cancelled = false;
        const unsubscribe = subscribeThemePreference((mode) => {
            if (!cancelled) setThemeMode(mode);
        });

        (async () => {
            const saved = await getThemePreferenceMode();
            if (!cancelled) setThemeMode(saved);
        })();

        return () => {
            cancelled = true;
            unsubscribe();
        };
    }, []);

    useEffect(() => {
        const update = () => {
            const now = new Date();
            const h = now.getHours();
            const m = now.getMinutes();
            const nextPalette = isPremium && themeMode === 'time_sync'
                ? getTimePalette(h, m)
                : ['#FFFFFF', '#FFFFFF'];
            setPalette(nextPalette);

            if (__DEV__) {
                const info = isPremium && themeMode === 'time_sync'
                    ? getTimeThemeInfo(h, m)
                    : {
                        key: isPremium ? 'pro_static_white' : 'free_static_dark',
                        label: isPremium ? 'Static White (Pro)' : 'Static Dark (Free)',
                        range: 'All day',
                        palette: nextPalette,
                    };
                const timeLabel = now.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                });
                const minuteStamp = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}-${h}:${m}`;

                if (lastXPBarMinuteStamp !== minuteStamp) {
                    console.log(
                        `[XP BAR THEME] time=${timeLabel} key=${info.key} name="${info.label}" range="${info.range}" bg="${nextPalette.join(' -> ')}"`
                    );
                    lastXPBarMinuteStamp = minuteStamp;
                }
            }
        };

        let interval: ReturnType<typeof setInterval> | null = null;
        let timeout: ReturnType<typeof setTimeout> | null = null;

        const startMinuteAlignedUpdates = () => {
            const now = new Date();
            const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

            timeout = setTimeout(() => {
                update();
                interval = setInterval(update, 60_000);
            }, Math.max(1, msUntilNextMinute));
        };

        const onAppStateChange = (state: AppStateStatus) => {
            if (state === 'active') {
                update();
            }
        };

        update();
        startMinuteAlignedUpdates();
        const appStateSub = AppState.addEventListener('change', onAppStateChange);

        return () => {
            appStateSub.remove();
            if (timeout) clearTimeout(timeout);
            if (interval) clearInterval(interval);
        };
    }, [isPremium, themeMode]);

    return palette;
};
