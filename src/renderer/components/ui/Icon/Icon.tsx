import React from 'react';
import { styled } from '@mui/joy/styles';

const IconWrapper = styled('span')(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',

  // Size variants
  '&[data-size="xs"]': {
    fontSize: '12px',
    width: '12px',
    height: '12px',
  },
  '&[data-size="sm"]': {
    fontSize: '16px',
    width: '16px',
    height: '16px',
  },
  '&[data-size="md"]': {
    fontSize: '20px',
    width: '20px',
    height: '20px',
  },
  '&[data-size="lg"]': {
    fontSize: '24px',
    width: '24px',
    height: '24px',
  },
  '&[data-size="xl"]': {
    fontSize: '32px',
    width: '32px',
    height: '32px',
  },

  // Color variants
  '&[data-color="primary"]': {
    color: theme.palette.primary[500],
  },
  '&[data-color="success"]': {
    color: theme.palette.success[500],
  },
  '&[data-color="warning"]': {
    color: theme.palette.warning[500],
  },
  '&[data-color="danger"]': {
    color: theme.palette.danger[500],
  },
  '&[data-color="neutral"]': {
    color: theme.palette.neutral[500],
  },
  '&[data-color="inherit"]': {
    color: 'inherit',
  },

  // Interactive states
  '&[data-interactive="true"]': {
    cursor: 'pointer',
    borderRadius: theme.radius.sm,
    padding: '2px',
    transition: 'all 0.15s ease',

    '&:hover': {
      backgroundColor:
        theme.palette.mode === 'dark' ? theme.palette.neutral[800] : theme.palette.neutral[100],
      transform: 'scale(1.1)',
    },

    '&:active': {
      transform: 'scale(0.95)',
    },
  },

  // Focus states for accessibility
  '&:focus-visible': {
    outline: `2px solid ${theme.palette.primary[400]}`,
    outlineOffset: '1px',
  },
}));

export interface IconProps {
  /**
   * Icon content - typically Material UI icon or custom SVG
   */
  children: React.ReactNode;
  /**
   * Icon size
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /**
   * Icon color using Gridpark palette
   */
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'inherit';
  /**
   * Interactive icon with hover effects
   */
  interactive?: boolean;
  /**
   * Click handler for interactive icons
   */
  onClick?: () => void;
  /**
   * ARIA label for accessibility
   */
  'aria-label'?: string;
  /**
   * Custom className
   */
  className?: string;
}

/**
 * Gridpark Icon Component
 *
 * Flexible icon wrapper with consistent sizing and theming:
 * - Code-first: Clean, predictable sizing system
 * - Immediate feedback: Interactive states with hover/active effects
 * - Accessible: Proper focus management and ARIA support
 * - Hackable: Works with any icon library or custom SVGs
 */
export const Icon: React.FC<IconProps> = ({
  children,
  size = 'md',
  color = 'inherit',
  interactive = false,
  onClick,
  className,
  'aria-label': ariaLabel,
}) => {
  return (
    <IconWrapper
      data-size={size}
      data-color={color}
      data-interactive={interactive}
      onClick={interactive ? onClick : undefined}
      tabIndex={interactive ? 0 : undefined}
      role={interactive ? 'button' : undefined}
      aria-label={ariaLabel}
      className={className}
    >
      {children}
    </IconWrapper>
  );
};

Icon.displayName = 'GridparkIcon';
