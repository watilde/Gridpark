/**
 * Home Page
 *
 * ✅ Bulletproof React Architecture
 * ✅ Feature-based Architecture
 *
 * This page is a THIN WRAPPER that:
 * - Has NO business logic
 * - Has NO state management (no useState, useEffect, useCallback, etc.)
 * - Only handles LAYOUT and COMPOSITION
 *
 * All logic is in: features/workspace/
 */

import React from 'react';
import { GridparkPlayground } from '../components/layout/GridparkPlayground';
import { SettingsDrawer } from '../components/layout/SettingsDrawer';
import { WorkspacePage } from '../../features/workspace/components/WorkspacePage';
import { useSettings } from '../hooks/useSettings';

/**
 * Home Component - Layout Only
 *
 * Responsibilities:
 * - Import WorkspacePage (smart component with all logic)
 * - Apply theme wrapper (GridparkPlayground) if needed
 * - Render SettingsDrawer
 *
 * NO business logic allowed here!
 */
export const Home: React.FC = () => {
  // ✅ Only UI-related settings (theme selection)
  const settings = useSettings();
  const { presetId } = settings;
  const isGridparkTheme = presetId === 'gridpark';

  // ✅ WorkspacePage contains ALL business logic
  // Note: onUndo/onRedo are optional - WorkspacePage has its own implementation
  const workspaceContent = <WorkspacePage onOpenSettings={() => settings.setSettingsOpen(true)} />;

  // ✅ Simple layout composition
  return (
    <>
      {isGridparkTheme ? (
        <GridparkPlayground>{workspaceContent}</GridparkPlayground>
      ) : (
        workspaceContent
      )}
      <SettingsDrawer settings={settings} />
    </>
  );
};
