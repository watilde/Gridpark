import React from 'react';
import { Box, IconButton, Divider, Tooltip } from '@mui/joy';
import { styled } from '@mui/joy/styles';
import { Icon } from '../../components/ui/Icon/Icon';

const ToolbarContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  padding: theme.spacing(1, 2),
  backgroundColor: theme.palette.background.surface,
  borderBottom: `1px solid ${theme.palette.divider}`,
  minHeight: '48px',

  // Code-first experience: compact but accessible
  '& .MuiIconButton-root': {
    width: '32px',
    height: '32px',
    borderRadius: theme.radius.sm,

    '&:hover': {
      backgroundColor: theme.palette.background.level1,
    },

    '&:focus-visible': {
      outline: `2px solid ${theme.palette.primary[400]}`,
      outlineOffset: '2px',
    },
  },
}));

const ToolbarGroup = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
}));

export interface ToolbarAction {
  /**
   * Unique identifier for the action
   */
  id: string;
  /**
   * Icon name or component
   */
  icon: string | React.ReactNode;
  /**
   * Tooltip text
   */
  tooltip?: string;
  /**
   * Click handler
   */
  onClick?: () => void;
  /**
   * Disabled state
   */
  disabled?: boolean;
  /**
   * Active/selected state
   */
  active?: boolean;
  /**
   * Variant for different button styles
   */
  variant?: 'plain' | 'outlined' | 'soft' | 'solid';
}

export interface ToolbarProps {
  /**
   * Array of toolbar actions
   */
  actions?: ToolbarAction[];
  /**
   * Groups of actions (separated by dividers)
   */
  groups?: ToolbarAction[][];
  /**
   * Additional content to render in the toolbar
   */
  children?: React.ReactNode;
  /**
   * Size variant
   */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Gridpark Toolbar Component
 *
 * A flexible toolbar component with Gridpark design principles:
 * - Code-first experience with compact, accessible buttons
 * - Immediate feedback with hover and focus states
 * - Developer-friendly with customizable actions and groups
 * - Hackable through Joy UI system and custom content
 */
export const Toolbar: React.FC<ToolbarProps> = ({
  actions = [],
  groups = [],
  children,
  size = 'md',
}) => {
  const renderAction = (action: ToolbarAction) => {
    const button = (
      <IconButton
        key={action.id}
        variant={action.active ? 'soft' : action.variant || 'plain'}
        color={action.active ? 'primary' : 'neutral'}
        disabled={action.disabled}
        onClick={action.onClick}
        size={size}
      >
        {typeof action.icon === 'string' ? (
          <Icon>
            <span>{action.icon}</span>
          </Icon>
        ) : (
          action.icon
        )}
      </IconButton>
    );

    if (action.tooltip) {
      return (
        <Tooltip key={action.id} title={action.tooltip} placement="bottom">
          {button}
        </Tooltip>
      );
    }

    return button;
  };

  return (
    <ToolbarContainer>
      {/* Render individual actions */}
      {actions.length > 0 && <ToolbarGroup>{actions.map(renderAction)}</ToolbarGroup>}

      {/* Render grouped actions */}
      {groups.map((group, groupIndex) => (
        <React.Fragment key={`group-${groupIndex}`}>
          {(actions.length > 0 || groupIndex > 0) && <Divider orientation="vertical" />}
          <ToolbarGroup>{group.map(renderAction)}</ToolbarGroup>
        </React.Fragment>
      ))}

      {/* Render custom content */}
      {children && (
        <>
          {(actions.length > 0 || groups.length > 0) && <Divider orientation="vertical" />}
          {children}
        </>
      )}
    </ToolbarContainer>
  );
};

Toolbar.displayName = 'GridparkToolbar';
