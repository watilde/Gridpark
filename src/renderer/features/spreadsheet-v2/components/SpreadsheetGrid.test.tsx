import React from 'react';
import { render, fireEvent } from '@testing-library/react'; // render used by renderWithStore helper
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import '@testing-library/jest-dom';
import { SpreadsheetGrid } from './SpreadsheetGrid';
import { StoredCellData } from '../../../../lib/db';
import spreadsheetReducer from '../../../../stores/spreadsheetSlice';

const createTestStore = () =>
  configureStore({ reducer: { spreadsheet: spreadsheetReducer } });

const renderWithStore = (ui: React.ReactElement) =>
  render(<Provider store={createTestStore()}>{ui}</Provider>);

describe('SpreadsheetGrid v2', () => {
  const mockOnCellSelect = jest.fn();
  const mockOnCellChange = jest.fn();
  const mockOnRangeSelect = jest.fn();

  const defaultProps = {
    cells: new Map<string, StoredCellData>(),
    visibleRows: 100,
    visibleCols: 26,
    selectedCell: { row: 0, col: 0 },
    onCellSelect: mockOnCellSelect,
    onCellChange: mockOnCellChange,
    computedValues: new Map<string, any>(),
    selectedRange: null,
    onRangeSelect: mockOnRangeSelect,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { container } = renderWithStore(<SpreadsheetGrid {...defaultProps} />);
    expect(container).toBeInTheDocument();
  });

  it('handles arrow key navigation', () => {
    const { container } = renderWithStore(<SpreadsheetGrid {...defaultProps} />);
    
    // Press ArrowDown
    fireEvent.keyDown(window, { key: 'ArrowDown' });
    expect(mockOnCellSelect).toHaveBeenCalledWith({ row: 1, col: 0 });

    // Press ArrowRight
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(mockOnCellSelect).toHaveBeenCalledWith({ row: 0, col: 1 });
  });

  it('handles Tab navigation', () => {
    renderWithStore(<SpreadsheetGrid {...defaultProps} />);
    
    // Press Tab
    fireEvent.keyDown(window, { key: 'Tab' });
    expect(mockOnCellSelect).toHaveBeenCalledWith({ row: 0, col: 1 });

    // Press Shift+Tab
    fireEvent.keyDown(window, { key: 'Tab', shiftKey: true });
    // Since it's at col 0, it stays at 0 (or moves back if it was at 1)
    // Actually, in the test above we started at 0,0.
  });

  it('prevents navigation out of bounds', () => {
    renderWithStore(<SpreadsheetGrid {...defaultProps} selectedCell={{ row: 0, col: 0 }} />);
    
    // Press ArrowUp at top row
    fireEvent.keyDown(window, { key: 'ArrowUp' });
    expect(mockOnCellSelect).not.toHaveBeenCalled();

    // Press ArrowLeft at first column
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(mockOnCellSelect).not.toHaveBeenCalled();
  });

  it('enters edit mode on F2', () => {
    const { container } = renderWithStore(<SpreadsheetGrid {...defaultProps} />);
    
    fireEvent.keyDown(window, { key: 'F2' });
    
    const input = container.querySelector('input');
    expect(input).toBeInTheDocument();
  });

  it('enters edit mode on Enter', () => {
    const { container } = renderWithStore(<SpreadsheetGrid {...defaultProps} />);
    
    fireEvent.keyDown(window, { key: 'Enter' });
    
    const input = container.querySelector('input');
    expect(input).toBeInTheDocument();
  });
});
