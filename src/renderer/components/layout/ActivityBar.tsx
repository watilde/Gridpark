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
  // Use specific VSCode activity bar colors or fallback to theme
  backgroundColor: theme.palette.mode === 'dark' ? '#333333' : '#2c2c2c',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  borderRight: `1px solid ${theme.palette.mode === 'dark' ? '#252526' : '#3e3e42'}`,
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
  backgroundColor: 'transparent',
  color: active
    ? '#ffffff'
    : 'rgba(255, 255, 255, 0.4)',
  cursor: 'pointer',
  position: 'relative',
  transition: 'color 0.1s ease',
  padding: 0,
  outline: 'none',

  // Active indicator (left border)
  '&::before': {
    content: '""',
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '2px',
    backgroundColor: active ? (theme.palette.mode === 'dark' ? '#ffffff' : '#007acc') : 'transparent',
    transition: 'background-color 0.1s ease',
  },

  '&:hover': {
    color: '#ffffff',
  },

  '&:focus-visible': {
    outline: `1px solid ${theme.palette.focusVisible}`,
    outlineOffset: '-1px',
  },

  '& svg': {
    fontSize: '24px',
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