import React from 'react';
import type { CardProps as JoyCardProps } from '@mui/joy';
import { styled } from '@mui/joy/styles';

const GridparkCard = styled(JoyCard)(({ theme }) => ({
  borderRadius: theme.radius.md,
  border: `1px solid ${theme.palette.divider}`,
  transition: 'all 0.2s ease',

  // Code-first experience: subtle hover for interactive cards
  '&[data-interactive="true"]': {
    cursor: 'pointer',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: theme.shadow.md,
      borderColor: theme.palette.primary[300],
    },
    '&:active': {
      transform: 'translateY(0)',
    },
  },

  // Immediate feedback: focus states for accessible cards
  '&:focus-visible': {
    outline: `2px solid ${theme.palette.primary[400]}`,
    outlineOffset: '2px',
  },
}));

const CardHeader = styled('div')(({ theme }) => ({
  padding: '16px 16px 0 16px',

  '& .card-title': {
    fontFamily: theme.fontFamily.body,
    fontSize: '18px',
    fontWeight: 600,
    color: theme.palette.text.primary,
    margin: 0,
  },

  '& .card-subtitle': {
    fontFamily: theme.fontFamily.body,
    fontSize: '14px',
    color: theme.palette.text.secondary,
    margin: '4px 0 0 0',
  },
}));

const CardActions = styled('div')({
  padding: '0 16px 16px 16px',
  display: 'flex',
  gap: '8px',
  justifyContent: 'flex-end',
});

export interface CardProps extends JoyCardProps {
  /**
   * Card title
   */
  title?: string;
  /**
   * Card subtitle
   */
  subtitle?: string;
  /**
   * Interactive card with hover effects
   */
  interactive?: boolean;
  /**
   * Action buttons in footer
   */
  actions?: React.ReactNode;
  /**
   * Card variant affecting visual style
   */
  variant?: 'outlined' | 'soft' | 'solid' | 'plain';
}

/**
 * Gridpark Card Component
 *
 * Flexible container component following Gridpark design principles:
 * - Code-first: Clean, minimal design with developer-friendly spacing
 * - Interactive: Hover effects for clickable cards
 * - Immediate feedback: Clear visual states
 * - Hackable: Extensible through composition and Joy UI system
 */
export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  interactive = false,
  actions,
  children,
  variant = 'outlined',
  onClick,
  ...props
}) => {
  return (
    <GridparkCard
      variant={variant}
      data-interactive={interactive}
      onClick={interactive ? onClick : undefined}
      tabIndex={interactive ? 0 : undefined}
      role={interactive ? 'button' : undefined}
      {...props}
    >
      {(title || subtitle) && (
        <CardHeader>
          {title && <h3 className="card-title">{title}</h3>}
          {subtitle && <p className="card-subtitle">{subtitle}</p>}
        </CardHeader>
      )}

      <CardContent>{children}</CardContent>

      {actions && <CardActions>{actions}</CardActions>}
    </GridparkCard>
  );
};

Card.displayName = 'GridparkCard';
