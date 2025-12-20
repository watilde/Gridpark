/**
 * VSCode Theme Preset
 * 
 * Official Visual Studio Code color palette
 * Deep respect for Microsoft's refined design language
 * 
 * References:
 * - https://code.visualstudio.com/api/references/theme-color
 * - https://github.com/microsoft/vscode/blob/main/src/vs/workbench/common/theme.ts
 */

import { type ThemePreset } from '../types';

export const vscodePreset: ThemePreset = {
  id: 'vscode',
  name: 'Visual Studio Code',
  description: 'Official VSCode color scheme - the gold standard for developer UX',
  schemes: {
    // VSCode Dark Theme (Dark+)
    dark: {
      background: { 
        body: '#1e1e1e',      // Editor background
        surface: '#252526'    // Panels, elevated surfaces
      },
      text: { 
        primary: '#cccccc',   // Main text
        secondary: '#969696'  // Muted text
      },
      border: '#454545',      // Border color
      primary: { 
        base: '#007acc',      // VSCode primary blue
        hover: '#0e639c'      // Hover state
      },
      success: '#89d185',     // Success green
      warning: '#cca700',     // Warning yellow
      info: '#3794ff',        // Info blue
      danger: '#f48771',      // Error red
    },
    
    // VSCode Light Theme (Light+)
    light: {
      background: { 
        body: '#ffffff',
        surface: '#f3f3f3'
      },
      text: { 
        primary: '#000000',
        secondary: '#6e6e6e'
      },
      border: '#d0d0d0',
      primary: { 
        base: '#0066bf',
        hover: '#005ba1'
      },
      success: '#22c55e',
      warning: '#f59e0b',
      info: '#3b82f6',
      danger: '#ef4444',
    },
  },
};

export default vscodePreset;
