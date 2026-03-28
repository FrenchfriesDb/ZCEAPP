import { useState, useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { TimeColors, getTimePalette } from '@/constants/theme';

/**
 * Full cinematic palette for the XP bar ONLY.
 * Uses the actual night-dive / void-spark / midnight-mist / deep-abyss
 * gradients at night so the XP bar always looks cinematic.
 *
 * All other UI (text accents, buttons, borders) should use useTimeColors()
 * which returns a neutral silver during night hours.
 */
export const useXPBarColors = (): string[] => {
    const [palette, setPalette] = useState<string[]>(TimeColors.day);

    useEffect(() => {
        const update = () => {
            const now = new Date();
            const h = now.getHours();
            const m = now.getMinutes();
            setPalette(getTimePalette(h, m));
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
    }, []);

    return palette;
};
