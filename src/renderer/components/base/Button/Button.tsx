import React from 'react';
import { Button as JoyButton } from '@mui/joy';
import type { ButtonProps as JoyButtonProps } from '@mui/joy';
import { styled } from '@mui/joy/styles';

// Gridpark Button extends Joy UI Button with brand-specific styling
const GridparkButton = styled(JoyButton)(({ theme }) => ({
  fontFamily: theme.fontFamily.body,
  borderRadius: theme.radius.sm,
  textTransform: 'none',
  fontWeight: 500,
  transition: 'all 0.15s ease',
  
  // Code-first experience: subtle hover effects
  '&:hover': {
    transform: 'translateY(-1px)',
    boxShadow: theme.shadow.sm,
  },
  
  // Playful productivity: Active state feedback
  '&:active': {
    transform: 'translateY(0)',
  },

  // Variant-specific styles
  '&.MuiButton-variantSoft': {
    backgroundColor: theme.palette.mode === 'dark' 
      ? theme.palette.neutral[800] 
      : theme.palette.neutral[100],
    '&:hover': {
      backgroundColor: theme.palette.mode === 'dark' 
        ? theme.palette.neutral[700] 
        : theme.palette.neutral[200],
    },
  },
}));

export interface ButtonProps extends Omit<JoyButtonProps, 'variant'> {
  /**
   * Button appearance variant following Gridpark design principles
   */
  variant?: 'solid' | 'soft' | 'outlined' | 'plain';
  /**
   * Button size - matches familiar development tool sizing
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Color scheme - uses Gridpark brand colors
   */
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
  /**
   * Loading state with immediate feedback
   */
  loading?: boolean;
  /**
   * Icon before text
   */
  startIcon?: React.ReactNode;
  /**
   * Icon after text
   */
  endIcon?: React.ReactNode;
}

/**
 * Gridpark Button Component
 * 
 * Extends Joy UI Button with Gridpark design principles:
 * - Code-first experience with familiar interactions
 * - Immediate feedback on all states
 * - Playful productivity with subtle animations
 * - Hackable styling through Joy UI system
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'solid',
  size = 'md',
  color = 'primary',
  loading = false,
  startIcon,
  endIcon,
  children,
  disabled,
  ...props
}) => {
  return (
    <GridparkButton
      variant={variant}
      size={size}
      color={color}
      loading={loading}
      disabled={disabled || loading}
      startDecorator={startIcon}
      endDecorator={endIcon}
      {...props}
    >
      {children}
    </GridparkButton>
  );
};

Button.displayName = 'GridparkButton';