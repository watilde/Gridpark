import React, { useState, useCallback } from 'react';
import { styled } from '@mui/joy/styles';
import { Input } from '../../components/ui/Input/Input';
import { Button } from '../../components/ui/Button/Button';
import { Icon } from '../../components/ui/Icon/Icon';
import { Functions, CheckCircle, Error, PlayArrow, Close } from '@mui/icons-material';
import { Typography, Chip } from '@mui/joy';

const FormulaBarContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  padding: '12px',
  backgroundColor: theme.palette.background.surface,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.radius.sm,
  fontFamily: theme.fontFamily.body,
}));

const FormulaRow = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
});

const CellReference = styled('div')(({ theme }) => ({
  minWidth: '80px',
  padding: '6px 12px',
  backgroundColor: theme.palette.neutral[100],
  borderRadius: theme.radius.sm,
  fontSize: '14px',
  fontFamily: '"JetBrains Mono", monospace',
  fontWeight: 600,
  color: theme.palette.text.primary,
  textAlign: 'center',
  border: `1px solid ${theme.palette.divider}`,
}));

const StatusBar = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  fontSize: '12px',
  color: theme.palette.text.secondary,
  minHeight: '24px',
}));

const SuggestionsList = styled('div')(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '4px',
  marginTop: '4px',
  
  '& .suggestion-chip': {
    fontSize: '11px',
    height: '20px',
    cursor: 'pointer',
  },
}));

interface FormulaValidation {
  isValid: boolean;
  error?: string;
  suggestions?: string[];
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
   * Formula execution handler
   */
  onFormulaExecute?: (formula: string) => void;
  /**
   * Real-time formula validation
   */
  onValidateFormula?: (formula: string) => FormulaValidation;
  /**
   * Read-only mode
   */
  readOnly?: boolean;
  /**
   * Show function suggestions
   */
  showSuggestions?: boolean;
}

/**
 * Gridpark FormulaBar Component
 * 
 * Excel-style formula bar with real-time validation and suggestions:
 * - Code-first: Monospace font, syntax highlighting concepts
 * - Excel compatibility: Familiar formula editing experience  
 * - Immediate feedback: Real-time validation and error display
 * - Developer-friendly: Function suggestions and autocomplete
 */
export const FormulaBar: React.FC<FormulaBarProps> = ({
  cellReference = 'A1',
  value = '',
  placeholder = 'Enter formula or value...',
  onFormulaChange,
  onFormulaExecute,
  onValidateFormula,
  readOnly = false,
  showSuggestions = true,
}) => {
  const [currentValue, setCurrentValue] = useState(value);
  const [validation, setValidation] = useState<FormulaValidation>({ isValid: true });
  const [isEditing, setIsEditing] = useState(false);

  const handleValueChange = useCallback((newValue: string) => {
    setCurrentValue(newValue);
    onFormulaChange?.(newValue);
    
    // Real-time validation
    if (onValidateFormula && newValue.trim()) {
      const validationResult = onValidateFormula(newValue);
      setValidation(validationResult);
    } else {
      setValidation({ isValid: true });
    }
  }, [onFormulaChange, onValidateFormula]);

  const handleExecute = useCallback(() => {
    if (currentValue.trim()) {
      onFormulaExecute?.(currentValue);
    }
  }, [currentValue, onFormulaExecute]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleExecute();
    }
    if (e.key === 'Escape') {
      setCurrentValue(value);
      setIsEditing(false);
    }
  }, [handleExecute, value]);

  const isFormula = currentValue.trim().startsWith('=');
  const hasError = !validation.isValid && validation.error;
  const hasSuggestions = showSuggestions && validation.suggestions && validation.suggestions.length > 0;

  const getInputColor = () => {
    if (hasError) return 'danger';
    if (validation.isValid && isFormula) return 'success';
    return 'neutral';
  };

  return (
    <FormulaBarContainer>
      <FormulaRow>
        <CellReference>
          {cellReference}
        </CellReference>
        
        <Icon size="sm" color="neutral">
          <Functions />
        </Icon>
        
        <div style={{ flex: 1 }}>
          <Input
            value={currentValue}
            placeholder={placeholder}
            code={true}
            color={getInputColor()}
            error={hasError ? validation.error : undefined}
            success={validation.isValid && isFormula ? 'Formula syntax valid' : undefined}
            disabled={readOnly}
            onChange={(e) => handleValueChange(e.target.value)}
            onFocus={() => setIsEditing(true)}
            onBlur={() => setIsEditing(false)}
            onKeyDown={handleKeyDown}
          />
        </div>
        
        {!readOnly && (
          <>
            <Button
              size="sm"
              variant="soft"
              color={validation.isValid ? 'success' : 'neutral'}
              disabled={!currentValue.trim() || !validation.isValid}
              onClick={handleExecute}
              startIcon={<PlayArrow />}
            >
              Execute
            </Button>
            
            <Button
              size="sm"
              variant="plain"
              color="neutral"
              onClick={() => {
                setCurrentValue('');
                onFormulaChange?.('');
              }}
            >
              <Close />
            </Button>
          </>
        )}
      </FormulaRow>

      {hasSuggestions && (
        <SuggestionsList>
          <Typography level="body-xs" sx={{ mr: 1 }}>Suggestions:</Typography>
          {validation.suggestions!.map((suggestion, index) => (
            <Chip
              key={index}
              variant="soft"
              size="sm"
              className="suggestion-chip"
              onClick={() => handleValueChange(suggestion)}
            >
              {suggestion}
            </Chip>
          ))}
        </SuggestionsList>
      )}

      <StatusBar>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isFormula && (
            <Icon size="xs" color={validation.isValid ? 'success' : 'danger'}>
              {validation.isValid ? <CheckCircle /> : <Error />}
            </Icon>
          )}
          <span>
            {isFormula ? 
              `Formula: ${validation.isValid ? 'Valid' : 'Invalid'}` :
              'Value entry'
            }
          </span>
        </div>
        
        <div>
          {currentValue.length > 0 && (
            <span>{currentValue.length} characters</span>
          )}
        </div>
      </StatusBar>
    </FormulaBarContainer>
  );
};

FormulaBar.displayName = 'GridparkFormulaBar';