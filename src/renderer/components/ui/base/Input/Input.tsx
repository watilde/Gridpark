import React from 'react';
import { Input as JoyInput, InputProps as JoyInputProps, FormControl, FormLabel, FormHelperText } from '@mui/joy';
import { styled } from '@mui/joy/styles';

const GridparkInput = styled(JoyInput)(({ theme }) => ({
  fontFamily: theme.fontFamily.body,
  borderRadius: theme.radius.sm,
  
  // Code-first experience: monospace for formula/code inputs
  '&[data-code="true"]': {
    fontFamily: '"JetBrains Mono", monospace',
    fontSize: '14px',
    letterSpacing: '0.025em',
  },

  // Immediate feedback: focus states
  '&:focus-within': {
    boxShadow: `0 0 0 2px ${theme.palette.primary[300]}40`,
    borderColor: theme.palette.primary[400],
  },

  // Error states with clear feedback
  '&.Joy-variantOutlined.Joy-colorDanger': {
    borderColor: theme.palette.danger[400],
    '&:focus-within': {
      boxShadow: `0 0 0 2px ${theme.palette.danger[300]}40`,
    },
  },

  // Success states
  '&.Joy-variantOutlined.Joy-colorSuccess': {
    borderColor: theme.palette.success[400],
    '&:focus-within': {
      boxShadow: `0 0 0 2px ${theme.palette.success[300]}40`,
    },
  },

  // Placeholder styling
  '& input::placeholder': {
    color: theme.palette.text.tertiary,
    fontStyle: 'italic',
  },
}));

export interface InputProps extends Omit<JoyInputProps, 'color'> {
  /**
   * Input label
   */
  label?: string;
  /**
   * Helper text below input
   */
  helperText?: string;
  /**
   * Error message (sets error state)
   */
  error?: string;
  /**
   * Success message (sets success state)
   */
  success?: string;
  /**
   * Code/formula input styling with monospace font
   */
  code?: boolean;
  /**
   * Input color state
   */
  color?: 'primary' | 'neutral' | 'danger' | 'success' | 'warning';
}

/**
 * Gridpark Input Component
 * 
 * Extends Joy UI Input with Gridpark design principles:
 * - Code-first experience with monospace option for formulas
 * - Immediate feedback with clear focus and validation states
 * - Developer-friendly placeholder and error messaging
 * - Hackable through Joy UI system
 */
export const Input: React.FC<InputProps> = ({
  label,
  helperText,
  error,
  success,
  code = false,
  color = 'neutral',
  variant = 'outlined',
  ...props
}) => {
  // Determine color based on validation state
  const inputColor = error ? 'danger' : success ? 'success' : color;
  const displayHelperText = error || success || helperText;

  return (
    <FormControl error={!!error}>
      {label && (
        <FormLabel>
          {label}
        </FormLabel>
      )}
      <GridparkInput
        variant={variant}
        color={inputColor}
        data-code={code}
        {...props}
      />
      {displayHelperText && (
        <FormHelperText>
          {error || success || helperText}
        </FormHelperText>
      )}
    </FormControl>
  );
};

Input.displayName = 'GridparkInput';