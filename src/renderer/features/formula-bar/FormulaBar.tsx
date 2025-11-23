import React, { useState, useCallback } from 'react';
import { styled } from '@mui/joy/styles';
import { Close, Check } from '@mui/icons-material';

// Excel-style formula bar container with dark theme
const FormulaBarContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'stretch',
  height: '32px',
  backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#f0f0f0',
  borderBottom: `1px solid ${theme.palette.mode === 'dark' ? '#333' : '#d0d0d0'}`,
  fontFamily: theme.fontFamily.body,
}));

// Cell reference box (e.g., "A1")
const CellReference = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '64px',
  padding: '0 12px',
  backgroundColor: theme.palette.mode === 'dark' ? '#252525' : '#ffffff',
  borderRight: `1px solid ${theme.palette.mode === 'dark' ? '#333' : '#d0d0d0'}`,
  fontSize: '13px',
  fontFamily: '"Segoe UI", sans-serif',
  fontWeight: 400,
  color: theme.palette.mode === 'dark' ? '#cccccc' : '#333333',
}));

// Button group container for cancel/confirm/function buttons
const ButtonGroup = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  backgroundColor: theme.palette.mode === 'dark' ? '#252525' : '#ffffff',
  borderRight: `1px solid ${theme.palette.mode === 'dark' ? '#333' : '#d0d0d0'}`,
}));

// Individual action button (X, checkmark, fx)
const ActionButton = styled('button')<{ variant?: 'cancel' | 'confirm' | 'function' }>(({ theme, variant }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '28px',
  height: '100%',
  padding: 0,
  border: 'none',
  backgroundColor: 'transparent',
  color: theme.palette.mode === 'dark' ? '#cccccc' : '#555555',
  cursor: 'pointer',
  transition: 'background-color 0.15s ease',
  fontSize: '16px',
  
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark' ? '#333333' : '#e5e5e5',
  },
  
  '&:active': {
    backgroundColor: theme.palette.mode === 'dark' ? '#3a3a3a' : '#d0d0d0',
  },
  
  '&:disabled': {
    color: theme.palette.mode === 'dark' ? '#555555' : '#aaaaaa',
    cursor: 'not-allowed',
    opacity: 0.5,
  },
  
  '& svg': {
    fontSize: '18px',
  },
}));

// Formula input field container
const FormulaInputContainer = styled('div')({
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  position: 'relative',
});

// Actual input element styled like Excel
const FormulaInput = styled('input')<{ hasError?: boolean }>(({ theme, hasError }) => ({
  width: '100%',
  height: '100%',
  padding: '0 8px',
  border: 'none',
  outline: 'none',
  backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#ffffff',
  color: theme.palette.mode === 'dark' ? '#d4d4d4' : '#000000',
  fontSize: '13px',
  fontFamily: '"Consolas", "Courier New", monospace',
  lineHeight: '32px',
  
  ...(hasError && {
    color: theme.palette.mode === 'dark' ? '#f48771' : '#d32f2f',
  }),
  
  '&::placeholder': {
    color: theme.palette.mode === 'dark' ? '#666666' : '#999999',
  },
  
  '&:disabled': {
    color: theme.palette.mode === 'dark' ? '#555555' : '#aaaaaa',
    cursor: 'not-allowed',
  },
}));

interface FormulaValidation {
  isValid: boolean;
  error?: string;
}

export interface FormulaBarProps {
  /**
   * Current cell reference (e.g., "A1", "B5")
   */
  cellReference?: string;
  /**
   * Formula or value in the selected cell
   */
  value?: string;
  /**
   * Placeholder text for empty formula bar
   */
  placeholder?: string;
  /**
   * Formula change handler
   */
  onFormulaChange?: (formula: string) => void;
  /**
   * Formula execution handler (triggered by Enter or confirm button)
   */
  onFormulaExecute?: (formula: string) => void;
  /**
   * Cancel handler (triggered by Escape or cancel button)
   */
  onFormulaCancel?: () => void;
  /**
   * Function button click handler
   */
  onFunctionButtonClick?: () => void;
  /**
   * Real-time formula validation
   */
  onValidateFormula?: (formula: string) => FormulaValidation;
  /**
   * Read-only mode
   */
  readOnly?: boolean;
}

/**
 * Excel-Style FormulaBar Component
 * 
 * Minimalist dark-themed formula bar matching Excel's design:
 * - Cell reference box on the left (e.g., "A1")
 * - Cancel (X), Confirm (✓), and Function (fx) buttons
 * - Formula input with monospace font
 * - Flat design with subtle hover effects
 * - Dark mode optimized with light gray text on dark background
 */
export const FormulaBar: React.FC<FormulaBarProps> = ({
  cellReference = 'A1',
  value = '',
  placeholder = '',
  onFormulaChange,
  onFormulaExecute,
  onFormulaCancel,
  onFunctionButtonClick,
  onValidateFormula,
  readOnly = false,
}) => {
  const [currentValue, setCurrentValue] = useState(value);
  const [validation, setValidation] = useState<FormulaValidation>({ isValid: true });
  const [isEditing, setIsEditing] = useState(false);
  const [originalValue, setOriginalValue] = useState(value);

  // Update internal state when external value changes
  React.useEffect(() => {
    setCurrentValue(value);
    setOriginalValue(value);
  }, [value]);

  const handleValueChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setCurrentValue(newValue);
    onFormulaChange?.(newValue);
    
    // Real-time validation for formulas
    if (onValidateFormula && newValue.trim().startsWith('=')) {
      const validationResult = onValidateFormula(newValue);
      setValidation(validationResult);
    } else {
      setValidation({ isValid: true });
    }
  }, [onFormulaChange, onValidateFormula]);

  const handleConfirm = useCallback(() => {
    if (validation.isValid) {
      onFormulaExecute?.(currentValue);
      setOriginalValue(currentValue);
      setIsEditing(false);
    }
  }, [currentValue, validation.isValid, onFormulaExecute]);

  const handleCancel = useCallback(() => {
    setCurrentValue(originalValue);
    onFormulaChange?.(originalValue);
    onFormulaCancel?.();
    setIsEditing(false);
    setValidation({ isValid: true });
  }, [originalValue, onFormulaChange, onFormulaCancel]);

  const handleFunctionClick = useCallback(() => {
    onFunctionButtonClick?.();
  }, [onFunctionButtonClick]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConfirm();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  }, [handleConfirm, handleCancel]);

  const handleFocus = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleBlur = useCallback(() => {
    // Don't immediately reset on blur - let user click buttons
    // setIsEditing(false);
  }, []);

  const hasError = !validation.isValid && validation.error;
  const showActionButtons = isEditing && !readOnly;

  return (
    <FormulaBarContainer>
      <CellReference>
        {cellReference}
      </CellReference>
      
      <ButtonGroup>
        {showActionButtons && (
          <>
            <ActionButton
              variant="cancel"
              onClick={handleCancel}
              title="Cancel (Esc)"
              type="button"
            >
              <Close />
            </ActionButton>
            
            <ActionButton
              variant="confirm"
              onClick={handleConfirm}
              disabled={!validation.isValid}
              title="Confirm (Enter)"
              type="button"
            >
              <Check />
            </ActionButton>
          </>
        )}
        
        <ActionButton
          variant="function"
          onClick={handleFunctionClick}
          title="Insert Function"
          type="button"
        >
          <span style={{ fontWeight: 'bold', fontSize: '12px' }}>fx</span>
        </ActionButton>
      </ButtonGroup>
      
      <FormulaInputContainer>
        <FormulaInput
          type="text"
          value={currentValue}
          placeholder={placeholder}
          hasError={hasError}
          disabled={readOnly}
          onChange={handleValueChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          autoComplete="off"
        />
      </FormulaInputContainer>
    </FormulaBarContainer>
  );
};

FormulaBar.displayName = 'ExcelStyleFormulaBar';