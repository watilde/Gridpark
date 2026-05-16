/**
 * Activity Bar Component
 * 
 * VSCode-inspired left sidebar navigation
 * 
 * Top Section:
 * - Excel View (spreadsheet viewer) - FIRST
 * - Git operations (optional/secondary)
 * 
 * Bottom Section:
 * - Settings - LAST
 */

import React from 'react';
import { styled } from '@mui/joy/styles';
import { Box, Tooltip } from '@mui/joy';
import {
  GridOn as ExcelIcon,
  Commit as CommitIcon,
  History as HistoryIcon,
  AccountTree as BranchIcon,
  Settings as SettingsIcon,
  GitHub as GitHubIcon,
} from '@mui/icons-material';

// ============================================================================
// Types
// ============================================================================

export type ActivityBarView =
  | 'excel'
  | 'commit'
  | 'history'
  | 'branch'
  | 'git-config'
  | 'settings';

export interface ActivityBarProps {
  activeView?: ActivityBarView;
  onViewChange?: (view: ActivityBarView) => void;
  className?: string;
}

// ============================================================================
// Styled Components
// ============================================================================

const ActivityBarContainer = styled(Box)(({ theme }) => ({
  width: '48px',
  height: '100%',
  backgroundColor: theme.palette.background.surface,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  borderRight: `1px solid ${theme.palette.divider}`,
  flexShrink: 0,
  zIndex: 1000,
}));

const TopSection = styled(Box)({
  flex: 1,
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  paddingTop: '10px',
  gap: '8px',
});

const BottomSection = styled(Box)({
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  paddingBottom: '10px',
  gap: '8px',
});

interface ActivityButtonProps {
  active?: boolean;
}

const ActivityButton = styled('button')<ActivityButtonProps>(({ theme, active }) => ({
  width: '48px',
  height: '48px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: 'none',
  backgroundColor: active ? `${theme.palette.primary.outlinedColor}1A` : 'transparent',
  color: active
    ? theme.palette.primary.outlinedColor
    : theme.palette.text.secondary,
  cursor: 'pointer',
  position: 'relative',
  transition: 'color 0.15s ease, background-color 0.15s ease',
  padding: 0,
  outline: 'none',

  // Active indicator (left border)
  '&::before': {
    content: '""',
    position: 'absolute',
    left: 0,
    top: '25%',
    bottom: '25%',
    width: '2px',
    borderRadius: '0 2px 2px 0',
    backgroundColor: active ? theme.palette.primary.outlinedColor : 'transparent',
    transition: 'background-color 0.15s ease, top 0.15s ease, bottom 0.15s ease',
  },

  '&:hover': {
    backgroundColor: `${theme.palette.primary.outlinedColor}0F`,
    color: theme.palette.text.primary,
  },

  '&:focus-visible': {
    outline: `1px solid ${theme.palette.focusVisible}`,
    outlineOffset: '-1px',
  },

  '& svg': {
    fontSize: '22px',
  },
}));

// ============================================================================
// Component
// ============================================================================

export const ActivityBar: React.FC<ActivityBarProps> = ({
  activeView = 'excel',
  onViewChange,
  className,
}) => {
  const handleViewChange = (view: ActivityBarView) => {
    if (onViewChange) {
      onViewChange(view);
    }
  };

  return (
    <ActivityBarContainer className={className}>
      <TopSection>
        {/* Excel View - Topmost item */}
        <Tooltip title="Excel Explorer" placement="right" arrow>
          <ActivityButton
            active={activeView === 'excel'}
            onClick={() => handleViewChange('excel')}
            aria-label="Excel View"
            aria-pressed={activeView === 'excel'}
          >
            <ExcelIcon />
          </ActivityButton>
        </Tooltip>

        {/* Git Operations (Placeholder for future features) */}
        <Tooltip title="Source Control" placement="right" arrow>
          <ActivityButton
            active={activeView === 'branch'}
            onClick={() => handleViewChange('branch')}
            aria-label="Source Control"
            aria-pressed={activeView === 'branch'}
          >
            <BranchIcon />
          </ActivityButton>
        </Tooltip>

      </TopSection>

      <BottomSection>
        {/* Settings - Bottommost item */}
        <Tooltip title="Settings" placement="right" arrow>
          <ActivityButton
            active={activeView === 'settings'}
            onClick={() => handleViewChange('settings')}
            aria-label="Settings"
            aria-pressed={activeView === 'settings'}
          >
            <SettingsIcon />
          </ActivityButton>
        </Tooltip>
      </BottomSection>
    </ActivityBarContainer>
  );
};

ActivityBar.displayName = 'ActivityBar';