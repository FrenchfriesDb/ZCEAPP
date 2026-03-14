import { useState, useEffect } from 'react';
import { TimeColors } from '@/constants/theme';

/**
 * Returns a time-of-day gradient palette (string[]) that cycles through
 * 9 cinematic sky themes across the day. Updates every minute.
 *
 * Palette slots and their hours:
 *   preDawn       0–4:59    — deep navy / deep abyss
 *   earlierDawn   5–5:59    — steel blue
 *   morning       6–7:59    — sunrise
 *   day           8–16:59   — electric daylight
 *   goldenHour    17–17:29  — warm golden
 *   dusk          17:30–17:59 — rose mauve
 *   sunset        18–19:59  — fiery
 *   twilight      20–20:59  — pink-cyan
 *   nightDive     21–21:59  — Night Dive
 *   voidSpark     22–22:59  — Void Spark
 *   midnightMist  23–23:59  — Midnight Mist
 *   deepAbyss     0–4:59    — Deep Abyss
 */
export const useTimeColors = () => {
    const [palette, setPalette] = useState<string[]>(TimeColors.day);

    useEffect(() => {
        const updateColors = () => {
            const now = new Date();
            const h = now.getHours();
            const m = now.getMinutes();
            const time = h + m / 60; // e.g. 5:30 = 5.5

            let next: string[];

            const silver = ['#727A9A', '#D8DBE9'];

            if (time < 5) next = silver;
            else if (time < 6) next = TimeColors.earlierDawn;
            else if (time >= 7.166 && time <= 7.5) next = TimeColors.sunriseCitrus; // 7:10 AM - 7:30 AM
            else if (time < 8.5) next = TimeColors.morning;
            else if (time < 16) next = TimeColors.cloudDrift; // 8:30 AM - 4:00 PM
            else if (time < 17) next = TimeColors.morning; // Buffer between day and sunset
            else if (time < 17.5) next = TimeColors.goldenHour;
            else if (time < 18) next = TimeColors.dusk;
            else if (time < 20) next = TimeColors.sunset;
            else if (time < 21) next = TimeColors.twilight;
            else next = silver;

            setPalette(next);
        };

        updateColors();
        const interval = setInterval(updateColors, 60_000);
        return () => clearInterval(interval);
    }, []);

    return palette;
};
