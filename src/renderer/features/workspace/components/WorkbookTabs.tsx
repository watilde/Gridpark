import React from 'react';
import { Box, IconButton, useTheme } from '@mui/joy';
import CloseIcon from '@mui/icons-material/Close';
import { WorkbookTab } from '../../../types/tabs';
import { colors } from '../../../theme/tokens';

interface WorkbookTabsProps {
  openTabs: WorkbookTab[];
  activeTabId: string;
  onTabChange: (event: React.SyntheticEvent | null, value: string | number | null) => void;
  onCloseTab: (tabId: string) => void;
  tabIsDirty: (tab: WorkbookTab) => boolean;
}

const unsavedDotSx = {
  width: 6,
  height: 6,
  borderRadius: '50%',
  backgroundColor: colors.accent.orange.main,
  display: 'inline-block',
  animation: 'gridparkPulse 1.5s ease-in-out infinite',
  boxShadow: `0 0 8px ${colors.accent.orange.main}66`,
  '@keyframes gridparkPulse': {
    '0%': { transform: 'scale(0.9)', opacity: 0.7 },
    '50%': { transform: 'scale(1.2)', opacity: 1 },
    '100%': { transform: 'scale(0.9)', opacity: 0.7 },
  },
};

export const WorkbookTabs: React.FC<WorkbookTabsProps> = ({
  openTabs,
  activeTabId,
  onTabChange,
  onCloseTab,
  tabIsDirty,
}) => {
  const theme = useTheme();

  if (openTabs.length === 0) return null;

  const primaryColor = theme.palette.primary.outlinedColor as string;
  const dividerColor = theme.palette.divider as string;

  return (
    <Box
      sx={{
        backgroundColor: 'background.body',
        borderBottom: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        flexWrap: 'nowrap',
        overflowX: 'auto',
        scrollbarWidth: 'thin',
        minHeight: '32px',
        '&::-webkit-scrollbar': { height: 4 },
      }}
    >
      {openTabs.map(tab => {
        const isActive = tab.id === activeTabId;
        const dirty = tabIsDirty(tab);
        return (
          <Box
            key={tab.id}
            component="button"
            onClick={(e: React.MouseEvent) => onTabChange(e as React.SyntheticEvent, tab.id)}
            sx={{
              minHeight: '32px',
              height: '32px',
              fontWeight: isActive ? 600 : 500,
              fontSize: '0.75rem',
              px: 1.5,
              py: 0,
              flexShrink: 0,
              border: 'none',
              borderRight: `1px solid ${dividerColor}`,
              borderBottom: isActive ? `2px solid ${primaryColor}` : '2px solid transparent',
              background: 'none',
              cursor: 'pointer',
              color: isActive ? primaryColor : 'inherit',
              backgroundColor: isActive ? theme.palette.background.surface : 'transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginBottom: '-1px',
              '&:hover': { backgroundColor: theme.palette.background.level1 },
            }}
          >
            <span>{tab.sheetName}</span>
            {dirty && (
              <Box component="span" aria-hidden="true" sx={{ ...unsavedDotSx }} />
            )}
            <IconButton
              component="span"
              tabIndex={-1}
              size="sm"
              variant="plain"
              onClick={(event: React.MouseEvent) => {
                event.stopPropagation();
                onCloseTab(tab.id);
              }}
              role="button"
              aria-label="Close tab"
              sx={{
                minWidth: '16px',
                minHeight: '16px',
                width: '16px',
                height: '16px',
                fontSize: '0.75rem',
              }}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          </Box>
        );
      })}
    </Box>
  );
};
