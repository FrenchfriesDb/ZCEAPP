import { useState, useEffect } from 'react';
import { TimeColors } from '@/constants/theme';

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
            const time = h + m / 60;

            let next: string[];
            if (time < 5) next = TimeColors.deepAbyss;
            else if (time < 6) next = TimeColors.earlierDawn;
            else if (time >= 7.166 && time <= 7.5) next = TimeColors.sunriseCitrus; // 7:10 AM - 7:30 AM
            else if (time < 8) next = TimeColors.morning;
            else if (time < 17) next = TimeColors.day;
            else if (time < 17.5) next = TimeColors.goldenHour;
            else if (time < 18) next = TimeColors.dusk;
            else if (time < 19) next = TimeColors.sunset;
            else if (time < 19.5) next = TimeColors.twilight;
            else if (time < 20) next = TimeColors.battleGlory;     // 7:30-8 PM
            else if (time < 20.5) next = TimeColors.plumGlow;    // 8:30 PM
            else if (time < 21) next = TimeColors.eveningNavy;     // 8-9 PM
            else if (time < 23) next = TimeColors.nightDive;    // 9-10 PM
            else if (time < 23) next = TimeColors.voidSpark;
            else next = TimeColors.midnightMist;

            setPalette(next);
        };

        update();
        const interval = setInterval(update, 10_000);
        return () => clearInterval(interval);
    }, []);

    return palette;
};
