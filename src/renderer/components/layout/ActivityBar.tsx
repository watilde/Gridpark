/**
 * Activity Bar Component
 * 
 * VSCode-inspired left sidebar navigation
 * Features:
 * - Excel View (spreadsheet viewer)
 * - Git Commit View (split/inline diff)
 * - Git History View
 * - Git Branch View (merge support)
 * - Git Config (bottom)
 * - Settings (bottom)
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
  backgroundColor: theme.palette.mode === 'dark' ? '#2d2d30' : '#2c2c2c',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  borderRight: `1px solid ${theme.palette.mode === 'dark' ? '#454545' : '#3e3e42'}`,
  flexShrink: 0,
  zIndex: 1000,
}));

const TopSection = styled(Box)({
  flex: 1,
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  paddingTop: '4px',
  gap: '4px',
});

const BottomSection = styled(Box)({
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  paddingBottom: '8px',
  gap: '4px',
});

const Divider = styled(Box)(({ theme }) => ({
  width: '32px',
  height: '1px',
  backgroundColor: theme.palette.mode === 'dark' ? '#454545' : '#3e3e42',
  margin: '8px 0',
}));

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
    ? theme.palette.mode === 'dark'
      ? '#ffffff'
      : '#ffffff'
    : theme.palette.mode === 'dark'
      ? '#cccccc'
      : '#d4d4d4',
  cursor: 'pointer',
  position: 'relative',
  transition: 'color 0.15s ease',
  padding: 0,
  outline: 'none',

  // Active indicator (left border)
  '&::before': {
    content: '""',
    position: 'absolute',
    left: 0,
    top: '50%',
    transform: 'translateY(-50%)',
    width: '2px',
    height: active ? '24px' : '0px',
    backgroundColor: theme.palette.mode === 'dark' ? '#007acc' : '#0066bf',
    transition: 'height 0.15s ease',
  },

  '&:hover': {
    color: theme.palette.mode === 'dark' ? '#ffffff' : '#ffffff',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },

  '&:active': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },

  '&:focus-visible': {
    outline: `2px solid ${theme.palette.mode === 'dark' ? '#007acc' : '#0066bf'}`,
    outlineOffset: '-2px',
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
        {/* Excel View */}
        <Tooltip title="Excel View" placement="right" arrow>
          <ActivityButton
            active={activeView === 'excel'}
            onClick={() => handleViewChange('excel')}
            aria-label="Excel View"
            aria-pressed={activeView === 'excel'}
          >
            <ExcelIcon />
          </ActivityButton>
        </Tooltip>

        {/* Git Commit View */}
        <Tooltip title="Git Commit (Split/Inline)" placement="right" arrow>
          <ActivityButton
            active={activeView === 'commit'}
            onClick={() => handleViewChange('commit')}
            aria-label="Git Commit View"
            aria-pressed={activeView === 'commit'}
          >
            <CommitIcon />
          </ActivityButton>
        </Tooltip>

        {/* Git History View */}
        <Tooltip title="Git History" placement="right" arrow>
          <ActivityButton
            active={activeView === 'history'}
            onClick={() => handleViewChange('history')}
            aria-label="Git History View"
            aria-pressed={activeView === 'history'}
          >
            <HistoryIcon />
          </ActivityButton>
        </Tooltip>

        {/* Git Branch View */}
        <Tooltip title="Git Branches & Merge" placement="right" arrow>
          <ActivityButton
            active={activeView === 'branch'}
            onClick={() => handleViewChange('branch')}
            aria-label="Git Branch View"
            aria-pressed={activeView === 'branch'}
          >
            <BranchIcon />
          </ActivityButton>
        </Tooltip>
      </TopSection>

      <BottomSection>
        <Divider />

        {/* Git Config */}
        <Tooltip title="Git Configuration" placement="right" arrow>
          <ActivityButton
            active={activeView === 'git-config'}
            onClick={() => handleViewChange('git-config')}
            aria-label="Git Configuration"
            aria-pressed={activeView === 'git-config'}
          >
            <GitHubIcon />
          </ActivityButton>
        </Tooltip>

        {/* Settings */}
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
