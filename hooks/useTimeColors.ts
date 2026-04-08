import { getDynamicColors, getTimePalette, getTimeThemeInfo, type TimeThemeInfo } from '@/constants/theme';
import { useSubscription } from '@/context/SubscriptionContext';
import { useEffect, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

let lastLoggedMinuteStamp: string | null = null;

/**
 * Returns a time-of-day gradient palette (string[]) that cycles through
 * cinematic sky themes across the day. Updates every minute.
 *
 * Palette slots and their hours:
 *   deepAbyss     0–4:59    — Deep Abyss
 *   earlierDawn   5–5:59    — steel blue
 *   morning       6:00–7:09  — Sunrise pastel cloud
 *   sunriseCitrus 7:10–7:29 — Sunset Flame
 *   morning       7:30–7:39 — Sunrise pastel cloud
 *   blushSky      7:40–7:59 — Blush Sky
 *   cloudDrift    8:00–15:59 — electric daylight
 *   goldenHour    17:00–17:29 — warm golden (#FFA585 -> #FFEDA0)
 *   sunberryTwist 17:30–17:59 — pink-sky blend (#F86CA7 -> #F4D444)
 *   sunsetCandy   18:00–18:29 — candy sunset (#FF0F7B -> #F89B29)
 *   sunset        18:30–18:59 — fiery sunset (#FF0F7B -> #F89B29)
 *   twilight      19:00–19:29 — pink-cyan (#FF1B6B -> #45CAFF)
 *   battleGlory   19:30–19:59 — gold-red-navy (#FC9F32 -> #AE1B1E -> #1A2766)
 *   marsEcho      20:00–20:29 — mars echo (#EF745C -> #B95E82)
 *   plumGlow      20:30–20:59 — plum glow (#3E196E -> #D46C76 -> #FFC07C)
 *   nightDive     21:00–21:59 — moon dust
 *   voidSpark     22:00–22:59 — void spark
 *   midnightMist  23:00–23:59 — midnight mist
 */
export const useTimeColors = () => {
    const { isPremium } = useSubscription();
    const [palette, setPalette] = useState<string[]>(['#000000', '#000000']);
    const [textColors, setTextColors] = useState({
        primary: '#E8E8E8',
        secondary: 'rgba(255, 255, 255, 0.45)',
        tertiary: 'rgba(255, 255, 255, 0.22)',
    });
    const [themeInfo, setThemeInfo] = useState<TimeThemeInfo>(() => {
        const now = new Date();
        return getTimeThemeInfo(now.getHours(), now.getMinutes());
    });

    useEffect(() => {
        const updateColors = () => {
            const now = new Date();
            const h = now.getHours();
            const m = now.getMinutes();

            const nextThemeInfo = isPremium
                ? getTimeThemeInfo(h, m)
                : {
                    key: 'free_static_dark',
                    label: 'Static Dark (Free)',
                    range: 'All day',
                    palette: ['#000000', '#000000'],
                };

            const next = isPremium
                ? getTimePalette(h, m)
                : ['#000000', '#000000'];

            const dyn = isPremium
                ? getDynamicColors(h, m)
                : {
                    textPrimary: '#FFFFFF',
                    textSecondary: 'rgba(255, 255, 255, 0.72)',
                    textTertiary: 'rgba(255, 255, 255, 0.45)',
                };
            setPalette(next);
            setThemeInfo(nextThemeInfo as TimeThemeInfo);
            setTextColors({
                primary: dyn.textPrimary,
                secondary: dyn.textSecondary,
                tertiary: dyn.textTertiary,
            });

            if (__DEV__) {
                const timeLabel = now.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                });
                const minuteStamp = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}-${h}:${m}`;

                if (lastLoggedMinuteStamp !== minuteStamp) {
                    console.log(
                        `[THEME NOW] time=${timeLabel} key=${nextThemeInfo.key} name="${nextThemeInfo.label}" range="${nextThemeInfo.range}" bg="${nextThemeInfo.palette.join(' -> ')}" primary=${dyn.textPrimary} secondary=${dyn.textSecondary} tertiary=${dyn.textTertiary}`
                    );
                    lastLoggedMinuteStamp = minuteStamp;
                }
            }
        };

        let interval: ReturnType<typeof setInterval> | null = null;
        let timeout: ReturnType<typeof setTimeout> | null = null;

        const startMinuteAlignedUpdates = () => {
            const now = new Date();
            const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

            timeout = setTimeout(() => {
                updateColors();
                interval = setInterval(updateColors, 60_000);
            }, Math.max(1, msUntilNextMinute));
        };

        const onAppStateChange = (state: AppStateStatus) => {
            if (state === 'active') {
                updateColors();
            }
        };

        updateColors();
        startMinuteAlignedUpdates();
        const appStateSub = AppState.addEventListener('change', onAppStateChange);

        return () => {
            appStateSub.remove();
            if (timeout) clearTimeout(timeout);
            if (interval) clearInterval(interval);
        };
    }, [isPremium]);

    return { palette, textColors, themeInfo };
};
