import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  FormulaCommitCommand,
  ActiveCellDetails,
} from '../features/workbook/components/ExcelViewer';
import { defaultFormulaOptions, FormulaOption } from '../utils/formulaUtils';

export const useFormulaBar = (activeTabKind?: string) => {
  const [activeCellAddress, setActiveCellAddress] = useState<string>('');
  const [formulaBarValue, setFormulaBarValue] = useState<string>('');
  const [formulaBaselineValue, setFormulaBaselineValue] = useState<string>('');
  const [formulaCommitCommand, setFormulaCommitCommand] = useState<FormulaCommitCommand | null>(
    null
  );
  const formulaCommitCounter = useRef(0);

  const [formulaMenuOpen, setFormulaMenuOpen] = useState(false);
  const [formulaSearchQuery, setFormulaSearchQuery] = useState('');
  const [formulaMenuPosition, setFormulaMenuPosition] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const formulaInputRef = useRef<HTMLInputElement | null>(null);
  const formulaBarContainerRef = useRef<HTMLDivElement | null>(null);
  const formulaSearchInputRef = useRef<HTMLInputElement | null>(null);

  const handleActiveCellDetails = useCallback((details: ActiveCellDetails) => {
    setActiveCellAddress(details.address);
    const value = details.formula ?? details.displayValue ?? '';
    setFormulaBaselineValue(value);
    setFormulaBarValue(value);
  }, []);

  const formulaBarDisabled = activeTabKind !== 'sheet' || !activeCellAddress.trim();

  const handleFormulaInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormulaBarValue(event.target.value);
  };

  const handleFormulaCommit = useCallback(() => {
    if (formulaBarDisabled) return;
    formulaCommitCounter.current += 1;
    setFormulaCommitCommand({
      requestId: formulaCommitCounter.current,
      value: formulaBarValue,
    });
    setFormulaBaselineValue(formulaBarValue);
  }, [formulaBarDisabled, formulaBarValue]);

  const handleFormulaCancel = useCallback(() => {
    setFormulaBarValue(formulaBaselineValue);
    setFormulaMenuOpen(false);
  }, [formulaBaselineValue]);

  const handleFormulaKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleFormulaCommit();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      handleFormulaCancel();
    }
  };

  // Debounce commit logic
  useEffect(() => {
    if (formulaBarDisabled) return;
    if (formulaBarValue === formulaBaselineValue) return;
    const timeoutId = setTimeout(() => {
      handleFormulaCommit();
    }, 600);
    return () => clearTimeout(timeoutId);
  }, [formulaBarDisabled, formulaBarValue, formulaBaselineValue, handleFormulaCommit]);

  const filteredFormulaOptions = useMemo(() => {
    const query = formulaSearchQuery.trim().toLowerCase();
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
  }, [formulaSearchQuery]);

  const handleFormulaFxToggle = () => {
    if (formulaBarDisabled) return;
    setFormulaMenuOpen(prev => {
      const next = !prev;
      if (next) {
        setFormulaSearchQuery('');
      } else {
        setFormulaMenuPosition(null);
      }
      return next;
    });
  };

  const handleFormulaOptionSelect = useCallback((option: FormulaOption) => {
    setFormulaBarValue(option.template);
    setFormulaMenuOpen(false);
    requestAnimationFrame(() => {
      const input = formulaInputRef.current;
      if (input) {
        input.focus();
        const length = option.template.length;
        input.setSelectionRange(length, length);
      }
    });
  }, []);

  return {
    activeCellAddress,
    formulaBarValue,
    setFormulaBarValue,
    formulaCommitCommand,
    handleActiveCellDetails,
    formulaBarDisabled,
    handleFormulaInputChange,
    handleFormulaKeyDown,
    formulaMenuOpen,
    setFormulaMenuOpen,
    formulaSearchQuery,
    setFormulaSearchQuery,
    formulaMenuPosition,
    setFormulaMenuPosition,
    formulaInputRef,
    formulaBarContainerRef,
    formulaSearchInputRef,
    filteredFormulaOptions,
    handleFormulaFxToggle,
    handleFormulaOptionSelect,
  };
};
