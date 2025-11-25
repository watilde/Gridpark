import type { ThemePreset, ThemePresetId } from '../types';

import gridparkPreset from './gridpark';
import monokaiPreset from './monokai';
import monokaiProPreset from './monokaiPro';
import draculaPreset from './dracula';
import solarizedPreset from './solarized';
import oneDarkPreset from './oneDark';
import gruvboxPreset from './gruvbox';
import tokyoNightPreset from './tokyoNight';
import nordPreset from './nord';
import catppuccinPreset from './catppuccin';
import ayuPreset from './ayu';

export const themePresets: Record<ThemePresetId, ThemePreset> = {
  gridpark: gridparkPreset,
  monokai: monokaiPreset,
  monokaiPro: monokaiProPreset,
  dracula: draculaPreset,
  solarized: solarizedPreset,
  oneDark: oneDarkPreset,
  gruvbox: gruvboxPreset,
  tokyoNight: tokyoNightPreset,
  nord: nordPreset,
  catppuccin: catppuccinPreset,
  ayu: ayuPreset,
};

export const themePresetList = Object.values(themePresets);

export const themeOptions = themePresetList.map(preset => ({
  id: preset.id,
  name: preset.name,
  description: preset.description,
}));
