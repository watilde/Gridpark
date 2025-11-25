import { useReducer, useCallback, useRef, useEffect, useMemo, useState } from 'react';
import {
  FormulaCommitCommand,
  ActiveCellDetails,
} from '../features/workbook/components/ExcelViewer';
import { defaultFormulaOptions, FormulaOption } from '../utils/formulaUtils';

/**
 * Formula bar state managed by reducer
 */
interface FormulaBarState {
  activeCellAddress: string;
  formulaBarValue: string;
  formulaBaselineValue: string;
  formulaMenuOpen: boolean;
  formulaSearchQuery: string;
  formulaMenuPosition: {
    top: number;
    left: number;
    width: number;
  } | null;
}

type FormulaBarAction =
  | { type: 'SET_ACTIVE_CELL'; payload: ActiveCellDetails }
  | { type: 'SET_FORMULA_VALUE'; payload: string }
  | { type: 'COMMIT_FORMULA'; payload: string }
  | { type: 'CANCEL_FORMULA' }
  | { type: 'TOGGLE_MENU'; payload?: boolean }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_MENU_POSITION'; payload: { top: number; left: number; width: number } | null }
  | { type: 'SELECT_FORMULA_OPTION'; payload: string };

/**
 * Formula bar reducer for centralized state management
 */
const formulaBarReducer = (state: FormulaBarState, action: FormulaBarAction): FormulaBarState => {
  switch (action.type) {
    case 'SET_ACTIVE_CELL': {
      const { address, formula, displayValue } = action.payload;
      const value = formula ?? displayValue ?? '';
      return {
        ...state,
        activeCellAddress: address,
        formulaBaselineValue: value,
        formulaBarValue: value,
      };
    }

    case 'SET_FORMULA_VALUE':
      return {
        ...state,
        formulaBarValue: action.payload,
      };

    case 'COMMIT_FORMULA':
      return {
        ...state,
        formulaBaselineValue: action.payload,
        formulaBarValue: action.payload,
      };

    case 'CANCEL_FORMULA':
      return {
        ...state,
        formulaBarValue: state.formulaBaselineValue,
        formulaMenuOpen: false,
      };

    case 'TOGGLE_MENU': {
      const nextOpen = action.payload !== undefined ? action.payload : !state.formulaMenuOpen;
      return {
        ...state,
        formulaMenuOpen: nextOpen,
        formulaSearchQuery: nextOpen ? '' : state.formulaSearchQuery,
        formulaMenuPosition: nextOpen ? state.formulaMenuPosition : null,
      };
    }

    case 'SET_SEARCH_QUERY':
      return {
        ...state,
        formulaSearchQuery: action.payload,
      };

    case 'SET_MENU_POSITION':
      return {
        ...state,
        formulaMenuPosition: action.payload,
      };

    case 'SELECT_FORMULA_OPTION':
      return {
        ...state,
        formulaBarValue: action.payload,
        formulaMenuOpen: false,
      };

    default:
      return state;
  }
};

/**
 * Optimized formula bar hook using useReducer for state consolidation
 */
export const useFormulaBarOptimized = (activeTabKind?: string) => {
  const [state, dispatch] = useReducer(formulaBarReducer, {
    activeCellAddress: '',
    formulaBarValue: '',
    formulaBaselineValue: '',
    formulaMenuOpen: false,
    formulaSearchQuery: '',
    formulaMenuPosition: null,
  });

  const [formulaCommitCommand, setFormulaCommitCommand] = useState<FormulaCommitCommand | null>(
    null
  );
  const formulaCommitCounter = useRef(0);

  const formulaInputRef = useRef<HTMLInputElement | null>(null);
  const formulaBarContainerRef = useRef<HTMLDivElement | null>(null);
  const formulaSearchInputRef = useRef<HTMLInputElement | null>(null);

  const handleActiveCellDetails = useCallback((details: ActiveCellDetails) => {
    dispatch({ type: 'SET_ACTIVE_CELL', payload: details });
  }, []);

  const formulaBarDisabled = activeTabKind !== 'sheet' || !state.activeCellAddress.trim();

  const handleFormulaInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'SET_FORMULA_VALUE', payload: event.target.value });
  }, []);

  const handleFormulaCommit = useCallback(() => {
    if (formulaBarDisabled) return;
    formulaCommitCounter.current += 1;
    setFormulaCommitCommand({
      requestId: formulaCommitCounter.current,
      value: state.formulaBarValue,
    });
    dispatch({ type: 'COMMIT_FORMULA', payload: state.formulaBarValue });
  }, [formulaBarDisabled, state.formulaBarValue]);

  const handleFormulaCancel = useCallback(() => {
    dispatch({ type: 'CANCEL_FORMULA' });
  }, []);

  const handleFormulaKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        handleFormulaCommit();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        handleFormulaCancel();
      }
    },
    [handleFormulaCommit, handleFormulaCancel]
  );

  // Debounce commit logic
  useEffect(() => {
    if (formulaBarDisabled) return;
    if (state.formulaBarValue === state.formulaBaselineValue) return;
    const timeoutId = setTimeout(() => {
      handleFormulaCommit();
    }, 600);
    return () => clearTimeout(timeoutId);
  }, [formulaBarDisabled, state.formulaBarValue, state.formulaBaselineValue, handleFormulaCommit]);

  const filteredFormulaOptions = useMemo(() => {
    const query = state.formulaSearchQuery.trim().toLowerCase();
    const options = defaultFormulaOptions.filter(option => {
      if (!query) return true;
      return (
        option.label.toLowerCase().includes(query) ||
        option.category.toLowerCase().includes(query) ||
        option.description.toLowerCase().includes(query) ||
        option.template.toLowerCase().includes(query)
      );
    });
    const grouped = options.reduce(
      (acc, option) => {
        acc[option.category] = acc[option.category] || [];
        acc[option.category].push(option);
        return acc;
      },
      {} as Record<string, FormulaOption[]>
    );
    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([category, items]) => ({ category, items }));
  }, [state.formulaSearchQuery]);

  const handleFormulaFxToggle = useCallback(() => {
    if (formulaBarDisabled) return;
    dispatch({ type: 'TOGGLE_MENU' });
  }, [formulaBarDisabled]);

  const handleFormulaOptionSelect = useCallback((option: FormulaOption) => {
    dispatch({ type: 'SELECT_FORMULA_OPTION', payload: option.template });
    requestAnimationFrame(() => {
      const input = formulaInputRef.current;
      if (input) {
        input.focus();
        const length = option.template.length;
        input.setSelectionRange(length, length);
      }
    });
  }, []);

  const setFormulaSearchQuery = useCallback((query: string) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: query });
  }, []);

  const setFormulaMenuOpen = useCallback((open: boolean) => {
    dispatch({ type: 'TOGGLE_MENU', payload: open });
  }, []);

  const setFormulaMenuPosition = useCallback(
    (position: { top: number; left: number; width: number } | null) => {
      dispatch({ type: 'SET_MENU_POSITION', payload: position });
    },
    []
  );

  return {
    activeCellAddress: state.activeCellAddress,
    formulaBarValue: state.formulaBarValue,
    setFormulaBarValue: (value: string) => dispatch({ type: 'SET_FORMULA_VALUE', payload: value }),
    formulaCommitCommand,
    handleActiveCellDetails,
    formulaBarDisabled,
    handleFormulaInputChange,
    handleFormulaKeyDown,
    formulaMenuOpen: state.formulaMenuOpen,
    setFormulaMenuOpen,
    formulaSearchQuery: state.formulaSearchQuery,
    setFormulaSearchQuery,
    formulaMenuPosition: state.formulaMenuPosition,
    setFormulaMenuPosition,
    formulaInputRef,
    formulaBarContainerRef,
    formulaSearchInputRef,
    filteredFormulaOptions,
    handleFormulaFxToggle,
    handleFormulaOptionSelect,
  };
};
