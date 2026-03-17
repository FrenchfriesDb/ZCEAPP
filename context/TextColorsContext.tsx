import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { getDynamicColors } from '@/constants/theme';

interface TextColorsContextType {
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
}

const TextColorsContext = createContext<TextColorsContextType | undefined>(undefined);

export const useTextColors = () => {
  const context = useContext(TextColorsContext);
  if (!context) {
    // Fallback to prevent crashes - get current time colors
    try {
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();
      // Import dynamically to avoid circular dependencies
      const themeModule = require('@/constants/theme');
      return themeModule.getDynamicColors(hour, minute);
    } catch (error) {
      // Ultimate fallback
      return {
        textPrimary: '#E8E8E8',
        textSecondary: 'rgba(232, 232, 232, 0.5)',
        textTertiary: 'rgba(232, 232, 232, 0.25)',
      };
    }
  }
  return context;
};

export const TextColorsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [textColors, setTextColors] = useState(() => {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const colors = getDynamicColors(hour, minute);
    console.log('INITIAL - Hour:', hour, 'Minute:', minute, 'Color:', colors.textPrimary);
    return colors;
  });

  useEffect(() => {
    const updateColors = () => {
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();
      const colors = getDynamicColors(hour, minute);
      console.log('UPDATE - Hour:', hour, 'Minute:', minute, 'Color:', colors.textPrimary);
      setTextColors(colors);
    };

    updateColors();
    const interval = setInterval(updateColors, 30000); // Update every 30 seconds for testing
    return () => clearInterval(interval);
  }, []);
  
  return (
    <TextColorsContext.Provider value={textColors}>
      {children}
    </TextColorsContext.Provider>
  );
};
