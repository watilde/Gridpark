/**
 * Settings Placeholder Sidebar
 * 
 * Placeholder component for Settings view
 * Shows "Coming Soon" message for future implementation
 */

import React from 'react';
import { styled } from '@mui/joy/styles';
import { Box, Typography } from '@mui/joy';
import {
  Settings as SettingsIcon,
} from '@mui/icons-material';

// ============================================================================
// Styled Components
// ============================================================================

const PlaceholderContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '40px 24px',
  backgroundColor: theme.palette.mode === 'dark' ? '#252526' : '#f3f3f3',
  textAlign: 'center',
}));

const IconWrapper = styled(Box)(({ theme }) => ({
  marginBottom: '24px',
  color: theme.palette.mode === 'dark' ? '#969696' : '#6e6e6e',
  
  '& svg': {
    fontSize: '64px',
  },
}));

const Title = styled(Typography)(({ theme }) => ({
  fontSize: '18px',
  fontWeight: 600,
  color: theme.palette.mode === 'dark' ? '#cccccc' : '#000000',
  marginBottom: '12px',
}));

const Description = styled(Typography)(({ theme }) => ({
  fontSize: '13px',
  color: theme.palette.mode === 'dark' ? '#969696' : '#6e6e6e',
  lineHeight: 1.6,
  maxWidth: '240px',
}));

// ============================================================================
// Component
// ============================================================================

export const SettingsPlaceholderSidebar: React.FC<{ className?: string }> = ({
  className,
}) => {
  return (
    <PlaceholderContainer className={className}>
      <IconWrapper>
        <SettingsIcon />
      </IconWrapper>
      <Title>Settings</Title>
      <Description>
        Configure Gridpark preferences, themes, keyboard shortcuts, and extensions.
      </Description>
      <Description sx={{ mt: 2, fontStyle: 'italic' }}>
        Coming Soon
      </Description>
    </PlaceholderContainer>
  );
};

SettingsPlaceholderSidebar.displayName = 'SettingsPlaceholderSidebar';
