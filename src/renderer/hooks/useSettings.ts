import { useState } from 'react';
import { useThemePreset } from '../theme/ThemeProvider';

export const useSettings = () => {
  const { presetId, setPresetId, colorScheme, setColorScheme } = useThemePreset();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return {
    presetId,
    setPresetId,
    colorScheme,
    setColorScheme,
    settingsOpen,
    setSettingsOpen,
  };
};
