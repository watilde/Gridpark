import React from 'react';
import { styled } from '@mui/joy/styles';
import { Close, Check, ArrowDropDown } from '@mui/icons-material';

// Excel-style formula bar container
const FormulaBarContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'stretch',
  height: '28px',
  backgroundColor: theme.palette.mode === 'dark' ? '#000000' : '#ffffff',
  borderBottom: `1px solid ${theme.palette.mode === 'dark' ? '#3a3a3a' : '#d0d0d0'}`,
  fontFamily: theme.fontFamily.body,
}));

// Cell reference box with dropdown (e.g., "A1")
const CellReferenceContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  minWidth: '80px',
  backgroundColor: theme.palette.mode === 'dark' ? '#000000' : '#ffffff',
  borderRight: `1px solid ${theme.palette.mode === 'dark' ? '#3a3a3a' : '#d0d0d0'}`,
  position: 'relative',
}));

const CellReferenceText = styled('div')(({ theme }) => ({
  flex: 1,
  padding: '0 8px',
  fontSize: '12px',
  fontFamily: '"Segoe UI", sans-serif',
  fontWeight: 400,
  color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
  textAlign: 'center',
}));

const CellReferenceDropdown = styled('button')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '20px',
  height: '100%',
  padding: 0,
  border: 'none',
  backgroundColor: 'transparent',
  color: theme.palette.mode === 'dark' ? '#ffffff' : '#555555',
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f0f0f0',
  },
  '& svg': {
    fontSize: '16px',
  },
}));

// Button group container for cancel/confirm/function buttons
const ButtonGroup = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  backgroundColor: theme.palette.mode === 'dark' ? '#000000' : '#ffffff',
  borderRight: `1px solid ${theme.palette.mode === 'dark' ? '#3a3a3a' : '#d0d0d0'}`,
}));

// Individual action button (X, checkmark, fx)
const ActionButton = styled('button')<{ variant?: 'cancel' | 'confirm' | 'function'; visible?: boolean }>(({ theme, variant, visible = true }) => ({
  display: visible ? 'flex' : 'none',
  alignItems: 'center',
  justifyContent: 'center',
  width: '24px',
  height: '100%',
  padding: 0,
  border: 'none',
  backgroundColor: 'transparent',
  color: theme.palette.mode === 'dark' ? '#ffffff' : '#555555',
  cursor: 'pointer',
  transition: 'background-color 0.1s ease',
  fontSize: '14px',
  
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#e5e5e5',
  },
  
  '&:active': {
    backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#d0d0d0',
  },
  
  '&:disabled': {
    color: theme.palette.mode === 'dark' ? '#666666' : '#aaaaaa',
    cursor: 'not-allowed',
    opacity: 0.4,
  },
  
  '& svg': {
    fontSize: '16px',
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
  backgroundColor: theme.palette.mode === 'dark' ? '#000000' : '#ffffff',
  color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
  fontSize: '12px',
  fontFamily: '"Consolas", "Courier New", monospace',
  lineHeight: '28px',
  
  ...(hasError && {
    color: theme.palette.mode === 'dark' ? '#ff6b6b' : '#d32f2f',
  }),
  
  '&::placeholder': {
    color: theme.palette.mode === 'dark' ? '#666666' : '#999999',
  },
  
  '&:disabled': {
    color: theme.palette.mode === 'dark' ? '#666666' : '#aaaaaa',
    cursor: 'not-allowed',
  },
}));

export interface FormulaBarProps {
  /**
   * Formula bar state from useFormulaBarOptimized hook
   */
  formulaBarState: {
    activeCellAddress: string;
    formulaBarValue: string;
    formulaBarDisabled: boolean;
    handleFormulaInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    handleFormulaKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
    handleFormulaFxToggle: () => void;
    formulaInputRef: React.RefObject<HTMLInputElement>;
  };
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
 * 
 * Integrated with useFormulaBarOptimized hook for state management:
 * - Displays selected cell reference (activeCellAddress)
 * - Shows/edits formula bar value
 * - Grays out buttons when no cell selected (formulaBarDisabled)
 * - Keyboard shortcuts: Enter (confirm), Escape (cancel)
 */
export const FormulaBar: React.FC<FormulaBarProps> = ({ formulaBarState }) => {
  const {
    activeCellAddress,
    formulaBarValue,
    formulaBarDisabled,
    handleFormulaInputChange,
    handleFormulaKeyDown,
    handleFormulaFxToggle,
    formulaInputRef,
  } = formulaBarState;

  // Show action buttons only when editing (when value is being modified)
  const isEditing = formulaBarValue.length > 0 && !formulaBarDisabled;

  return (
    <FormulaBarContainer>
      <CellReferenceContainer>
        <CellReferenceText>
          {activeCellAddress || 'A1'}
        </CellReferenceText>
        <CellReferenceDropdown
          type="button"
          title="Name Box"
          onClick={() => console.log('Name box dropdown')}
          disabled={formulaBarDisabled}
        >
          <ArrowDropDown />
        </CellReferenceDropdown>
      </CellReferenceContainer>
      
      <ButtonGroup>
        <ActionButton
          variant="cancel"
          onClick={() => {
            // Trigger Escape key event to cancel
            const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
            formulaInputRef.current?.dispatchEvent(event);
          }}
          title="Cancel (Esc)"
          type="button"
          visible={isEditing}
          disabled={formulaBarDisabled}
        >
          <Close />
        </ActionButton>
        
        <ActionButton
          variant="confirm"
          onClick={() => {
            // Trigger Enter key event to confirm
            const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
            formulaInputRef.current?.dispatchEvent(event);
          }}
          title="Confirm (Enter)"
          type="button"
          visible={isEditing}
          disabled={formulaBarDisabled}
        >
          <Check />
        </ActionButton>
        
        <ActionButton
          variant="function"
          onClick={handleFormulaFxToggle}
          title="Insert Function"
          type="button"
          disabled={formulaBarDisabled}
        >
          <span style={{ fontWeight: 'bold', fontSize: '11px' }}>fx</span>
        </ActionButton>
      </ButtonGroup>
      
      <FormulaInputContainer>
        <FormulaInput
          ref={formulaInputRef}
          type="text"
          value={formulaBarValue}
          placeholder={formulaBarDisabled ? '' : 'Enter formula or value'}
          disabled={formulaBarDisabled}
          onChange={handleFormulaInputChange}
          onKeyDown={handleFormulaKeyDown}
          spellCheck={false}
          autoComplete="off"
        />
      </FormulaInputContainer>
    </FormulaBarContainer>
  );
};

FormulaBar.displayName = 'ExcelStyleFormulaBar';