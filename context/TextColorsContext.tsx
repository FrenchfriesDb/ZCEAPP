import { useTimeColors } from '@/hooks/useTimeColors';
import React, { createContext, type ReactNode, useContext } from 'react';

interface TextColorsContextType {
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
}

const FALLBACK_TEXT_COLORS: TextColorsContextType = {
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.72)',
  textTertiary: 'rgba(255, 255, 255, 0.45)',
};

const TextColorsContext = createContext<TextColorsContextType | undefined>(undefined);

export const useTextColors = () => {
  const context = useContext(TextColorsContext);
  return context ?? FALLBACK_TEXT_COLORS;
};

export const TextColorsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { textColors } = useTimeColors();

  return (
    <TextColorsContext.Provider
      value={{
        textPrimary: textColors.primary,
        textSecondary: textColors.secondary,
        textTertiary: textColors.tertiary,
      }}
    >
      {children}
    </TextColorsContext.Provider>
  );
};
