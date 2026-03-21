import { useState, useEffect } from 'react';
import { TimeColors, getDynamicColors } from '@/constants/theme';

/**
 * Returns a time-of-day gradient palette (string[]) that cycles through
 * cinematic sky themes across the day. Updates every minute.
 *
 * Palette slots and their hours:
 *   deepAbyss     0–4:59    — Deep Abyss
 *   earlierDawn   5–5:59    — steel blue
 *   morning       6–7:09, 7:31–8:29  — Sunrise pastel cloud
 *   sunriseCitrus 7:10–7:30 — Citrus Sunrise
 *   cloudDrift    8:30–15:59 — electric daylight
 *   goldenHour    17–17:29  — warm golden (#FFA585 → #FFEDA0)
 *   dusk          17:30–17:59 — rose mauve (#DD83AD → #C3E1FC)
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

            let next: string[];

            if (time < 5) next = TimeColors.deepAbyss;
            else if (time < 6) next = TimeColors.earlierDawn;
            else if (time >= 7.166 && time <= 7.5) next = TimeColors.sunriseCitrus;
            else if (time < 8.5) next = TimeColors.morning;
            else if (time < 16) next = TimeColors.cloudDrift;
            else if (time < 17) next = TimeColors.morning;
            else if (time < 17.5) next = TimeColors.goldenHour;
            else if (time < 18) next = TimeColors.dusk;
            else if (time < 19) next = TimeColors.sunset;        // 6–7 PM
            else if (time < 19.5) next = TimeColors.twilight;      // 7–7:30 PM
            else if (time < 20) next = TimeColors.battleGlory;     // 7:30-8 PM
            else if (time < 20.5) next = TimeColors.marsEcho;      // 8-8:30 PM
            else if (time < 21) next = TimeColors.plumGlow;        // 8:30-9 PM
            else if (time < 22) next = TimeColors.nightDive;       // 9-10 PM Moon Dust
            else if (time < 23) next = TimeColors.voidSpark;       // 10-11 PM VOID SPARK
            else next = TimeColors.midnightMist;                     // 11 PM-12 AM

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
