import { useState, useEffect } from 'react';
import { TimeColors, getDynamicColors, getTimePalette } from '@/constants/theme';

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
 *   goldenHour    16:00–17:59 — warm golden
 *   sunset        18–19:59  — fiery (#FF0F7B → #F89B29)
 *   twilight      19–19:59  — pink-cyan (7–8 PM) (#FF1B6B → #45CAFF)
 *   eveningNavy   20–20:59  — 8-8:30 PM (#9BAFD9 → #103783)
 *   nightDive     21–21:59  — 8:30-9 PM Moon Dust
 *   voidSpark     22–22:59  — 9-10 PM Void Spark
 *   midnightMist  23–23:59  — 10-11 PM Midnight Mist
 */
export const useTimeColors = () => {
    const [palette, setPalette] = useState<string[]>(TimeColors.day);
    const [textColors, setTextColors] = useState({
        primary: '#E8E8E8',
        secondary: 'rgba(255, 255, 255, 0.45)',
        tertiary: 'rgba(255, 255, 255, 0.22)',
    });

    useEffect(() => {
        const updateColors = () => {
            const now = new Date();
            const h = now.getHours();
            const m = now.getMinutes();
            const time = h + m / 60;

            const next = getTimePalette(h, m);

            const dyn = getDynamicColors(h, m);
            setPalette(next);
            setTextColors({
                primary: dyn.textPrimary,
                secondary: dyn.textSecondary,
                tertiary: dyn.textTertiary,
            });
        };

        updateColors();
        const interval = setInterval(updateColors, 60_000);
        return () => clearInterval(interval);
    }, []);

    return { palette, textColors };
};
