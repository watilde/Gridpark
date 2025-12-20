/**
 * Git Placeholder Sidebar
 * 
 * Placeholder component for Git-related views
 * Shows "Coming Soon" message for future implementation
 */

import React from 'react';
import { styled } from '@mui/joy/styles';
import { Box, Typography } from '@mui/joy';
import {
  Construction as ConstructionIcon,
} from '@mui/icons-material';

// ============================================================================
// Types
// ============================================================================

export type GitViewType = 'commit' | 'history' | 'branch' | 'git-config';

export interface GitPlaceholderSidebarProps {
  viewType: GitViewType;
  className?: string;
}

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
// View Configurations
// ============================================================================

const VIEW_CONFIGS: Record<GitViewType, { title: string; description: string }> = {
  commit: {
    title: 'Git Commit View',
    description: 'Stage changes, view diffs, and commit your work. Split and inline diff views available.',
  },
  history: {
    title: 'Git History View',
    description: 'Browse commit timeline, view commit details, and navigate through your project history.',
  },
  branch: {
    title: 'Git Branch View',
    description: 'Manage branches, merge changes, and resolve conflicts with visual merge tools.',
  },
  'git-config': {
    title: 'Git Configuration',
    description: 'Configure Git settings, manage remotes, and set up authentication.',
  },
};

// ============================================================================
// Component
// ============================================================================

export const GitPlaceholderSidebar: React.FC<GitPlaceholderSidebarProps> = ({
  viewType,
  className,
}) => {
  const config = VIEW_CONFIGS[viewType];

  return (
    <PlaceholderContainer className={className}>
      <IconWrapper>
        <ConstructionIcon />
      </IconWrapper>
      <Title>{config.title}</Title>
      <Description>{config.description}</Description>
      <Description sx={{ mt: 2, fontStyle: 'italic' }}>
        Coming Soon
      </Description>
    </PlaceholderContainer>
  );
};

GitPlaceholderSidebar.displayName = 'GitPlaceholderSidebar';
