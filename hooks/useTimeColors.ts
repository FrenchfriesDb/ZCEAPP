import { useState, useEffect } from 'react';

export type TimePalette = string[];

/**
 * Hook to get time-based color palettes for the XP bar and other UI elements.
 * 
 * Logic mapping:
 * - Night / Early (12AM - 6AM): Deep Blue / Purple / Pink
 * - Active (6AM - 5PM): Cyan / Teal (Standard)
 * - Golden Hour (5PM - 6PM): Yellow / Orange
 * - Dusk (6PM - 9PM): Orange / Red-Yellow
 * - Late Night (9PM - 12AM): Pink / Red / Blue
 */
export const useTimeColors = () => {
    const [palette, setPalette] = useState<TimePalette>(['#00F5FF', '#00A8B0']);

    useEffect(() => {
        const updateColors = () => {
            const hour = new Date().getHours();

            if (hour >= 0 && hour < 6) {
                // Night / Early
                setPalette(['#1A1A40', '#7E30E1', '#E26EE5']);
            } else if (hour >= 6 && hour < 17) {
                // Active (Current Standard)
                setPalette(['#00F5FF', '#00A8B0']);
            } else if (hour >= 17 && hour < 18) {
                // Golden Hour (5PM - 6PM)
                setPalette(['#FFD700', '#FF8C00']);
            } else if (hour >= 18 && hour < 21) {
                // Dusk (6PM - 9PM)
                setPalette(['#FF4E50', '#F9D423', '#FFD700']);
            } else {
                // Late Night (9PM - 12AM)
                setPalette(['#FF007A', '#453C67', '#00D7FF']);
            }
        };

        updateColors();
        const interval = setInterval(updateColors, 60000); // Check every minute
        return () => clearInterval(interval);
    }, []);

    return palette;
};
