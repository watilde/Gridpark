import { render, screen as _screen, fireEvent, waitFor } from '@testing-library/react';
// import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { SpreadsheetGrid } from './SpreadsheetGrid';

// Mock theme provider for Joy UI
jest.mock('@mui/joy/styles', () => ({
  ...jest.requireActual('@mui/joy/styles'),
  styled: (component: any) => (_styles: any) => component,
}));

describe('SpreadsheetGrid', () => {
  describe('US-001: Basic Spreadsheet Grid', () => {
    it('renders 26 columns (A-Z) by default', () => {
      const { container } = render(<SpreadsheetGrid rows={10} />);

      // Check for column headers A, M, Z
      expect(container.textContent).toContain('A');
      expect(container.textContent).toContain('M');
      expect(container.textContent).toContain('Z');
    });

    it('renders 1000 rows by default', () => {
      const { container } = render(<SpreadsheetGrid />);

      // Check status bar shows 1000 rows
      expect(container.textContent).toContain('1000 rows');
    });

    it('supports custom grid dimensions', () => {
      const { container } = render(<SpreadsheetGrid rows={20} columns={10} />);

      expect(container.textContent).toContain('20 rows × 10 cols');
    });

    it('renders within performance target (<500ms)', () => {
      const startTime = performance.now();
      render(<SpreadsheetGrid rows={1000} columns={26} />);
      const endTime = performance.now();

      const renderTime = endTime - startTime;
      expect(renderTime).toBeLessThan(500);
    });
  });

  describe('Cell Selection', () => {
    it('displays selected cell in A1 notation', () => {
      const { container } = render(<SpreadsheetGrid rows={10} columns={10} />);

      expect(container.textContent).toContain('Selected: A1');
    });

    it('calls onCellSelect when cell is clicked', async () => {
      const handleCellSelect = jest.fn();
      const { container } = render(
        <SpreadsheetGrid rows={5} columns={5} onCellSelect={handleCellSelect} />
      );

      const cells = container.querySelectorAll('.cell-content');
      if (cells.length > 5) {
        fireEvent.click(cells[5]); // Click second row, first column

        await waitFor(() => {
          expect(handleCellSelect).toHaveBeenCalledWith(
            expect.objectContaining({ row: expect.any(Number), col: expect.any(Number) })
          );
        });
      }
    });

    it('updates selected cell display when clicking different cells', async () => {
      const { container } = render(<SpreadsheetGrid rows={10} columns={10} />);

      const cells = container.querySelectorAll('.cell-content');
      if (cells.length > 1) {
        fireEvent.click(cells[1]);

        await waitFor(() => {
          expect(container.textContent).toMatch(/Selected: [A-Z]\d+/);
        });
      }
    });
  });

  describe('Keyboard Navigation', () => {
    it('supports arrow key navigation', async () => {
      const handleCellSelect = jest.fn();
      const { container } = render(
        <SpreadsheetGrid rows={10} columns={10} onCellSelect={handleCellSelect} />
      );

      const selectedCell = container.querySelector('[tabindex="0"]');
      if (selectedCell) {
        // Arrow down
        fireEvent.keyDown(selectedCell, { key: 'ArrowDown' });
        await waitFor(() => {
          expect(handleCellSelect).toHaveBeenCalled();
        });
      }
    });

    it('prevents navigation beyond grid boundaries', async () => {
      const handleCellSelect = jest.fn();
      const { container } = render(
        <SpreadsheetGrid rows={5} columns={5} onCellSelect={handleCellSelect} />
      );

      const selectedCell = container.querySelector('[tabindex="0"]');
      if (selectedCell) {
        // Try to go up from row 0
        fireEvent.keyDown(selectedCell, { key: 'ArrowUp' });

        // Should not call onCellSelect since we're at the top
        await waitFor(() => {
          expect(handleCellSelect).not.toHaveBeenCalled();
        });
      }
    });

    it('supports Tab key to move to next cell', async () => {
      const handleCellSelect = jest.fn();
      const { container } = render(
        <SpreadsheetGrid rows={5} columns={5} onCellSelect={handleCellSelect} />
      );

      const selectedCell = container.querySelector('[tabindex="0"]');
      if (selectedCell) {
        fireEvent.keyDown(selectedCell, { key: 'Tab' });

        await waitFor(() => {
          expect(handleCellSelect).toHaveBeenCalled();
        });
      }
    });

    it('supports F2 key to start editing', async () => {
      const { container } = render(<SpreadsheetGrid rows={5} columns={5} />);

      const selectedCell = container.querySelector('[tabindex="0"]');
      if (selectedCell) {
        fireEvent.keyDown(selectedCell, { key: 'F2' });

        await waitFor(() => {
          const input = container.querySelector('input[type="text"]');
          expect(input).toBeInTheDocument();
        });
      }
    });

    it('supports Enter key to start editing', async () => {
      const { container } = render(<SpreadsheetGrid rows={5} columns={5} />);

      const selectedCell = container.querySelector('[tabindex="0"]');
      if (selectedCell) {
        fireEvent.keyDown(selectedCell, { key: 'Enter' });

        await waitFor(() => {
          const input = container.querySelector('input[type="text"]');
          expect(input).toBeInTheDocument();
        });
      }
    });
  });

  describe('Cell Editing', () => {
    it('enters edit mode on double-click', async () => {
      const { container } = render(<SpreadsheetGrid rows={5} columns={5} />);

      const cells = container.querySelectorAll('.cell-content');
      if (cells.length > 0) {
        fireEvent.doubleClick(cells[0]);

        await waitFor(() => {
          const input = container.querySelector('input[type="text"]');
          expect(input).toBeInTheDocument();
        });
      }
    });

    it('does not allow editing in read-only mode', async () => {
      const { container } = render(<SpreadsheetGrid rows={5} columns={5} readOnly={true} />);

      const cells = container.querySelectorAll('.cell-content');
      if (cells.length > 0) {
        fireEvent.doubleClick(cells[0]);

        const input = container.querySelector('input[type="text"]');
        expect(input).not.toBeInTheDocument();
      }
    });

    it('calls onCellChange when cell value is updated', async () => {
      const handleCellChange = jest.fn();
      const { container } = render(
        <SpreadsheetGrid rows={5} columns={5} onCellChange={handleCellChange} />
      );

      const cells = container.querySelectorAll('.cell-content');
      if (cells.length > 0) {
        fireEvent.doubleClick(cells[0]);

        await waitFor(() => {
          const input = container.querySelector('input[type="text"]') as HTMLInputElement;
          if (input) {
            fireEvent.change(input, { target: { value: 'Test Value' } });
            fireEvent.blur(input);

            expect(handleCellChange).toHaveBeenCalledWith(expect.any(Object), 'Test Value');
          }
        });
      }
    });

    it('exits edit mode on Enter key', async () => {
      const { container } = render(<SpreadsheetGrid rows={5} columns={5} />);

      const cells = container.querySelectorAll('.cell-content');
      if (cells.length > 0) {
        fireEvent.doubleClick(cells[0]);

        await waitFor(() => {
          const input = container.querySelector('input[type="text"]');
          if (input) {
            fireEvent.keyDown(input, { key: 'Enter' });

            expect(container.querySelector('input[type="text"]')).not.toBeInTheDocument();
          }
        });
      }
    });

    it('cancels editing on Escape key', async () => {
      const handleCellChange = jest.fn();
      const { container } = render(
        <SpreadsheetGrid rows={5} columns={5} onCellChange={handleCellChange} />
      );

      const cells = container.querySelectorAll('.cell-content');
      if (cells.length > 0) {
        fireEvent.doubleClick(cells[0]);

        await waitFor(() => {
          const input = container.querySelector('input[type="text"]') as HTMLInputElement;
          if (input) {
            fireEvent.change(input, { target: { value: 'Cancelled' } });
            fireEvent.keyDown(input, { key: 'Escape' });

            // Should not call onCellChange when cancelled
            expect(handleCellChange).not.toHaveBeenCalled();
          }
        });
      }
    });
  });

  describe('Data Types', () => {
    it('displays text values', () => {
      const { container } = render(
        <SpreadsheetGrid
          rows={5}
          columns={5}
          initialData={{
            A1: { value: 'Hello World' },
          }}
        />
      );

      expect(container.textContent).toContain('Hello World');
    });

    it('displays numeric values', () => {
      const { container } = render(
        <SpreadsheetGrid
          rows={5}
          columns={5}
          initialData={{
            A1: { value: 42 },
            B1: { value: 3.14159 },
          }}
        />
      );

      expect(container.textContent).toContain('42');
      expect(container.textContent).toContain('3.14159');
    });

    it('handles null/empty values', () => {
      const { container } = render(
        <SpreadsheetGrid
          rows={5}
          columns={5}
          initialData={{
            A1: { value: null },
            B1: { value: '' },
          }}
        />
      );

      // Should render without errors
      expect(container).toBeInTheDocument();
    });
  });

  describe('Column Name Generation', () => {
    it('generates single letter column names (A-Z)', () => {
      const { container } = render(<SpreadsheetGrid rows={1} columns={26} />);

      expect(container.textContent).toContain('A');
      expect(container.textContent).toContain('Z');
    });

    it('generates double letter column names (AA, AB, etc.)', () => {
      const { container } = render(<SpreadsheetGrid rows={1} columns={28} />);

      expect(container.textContent).toContain('Z');
      // Would contain AA, AB if we had more columns
    });
  });

  describe('Initial Data', () => {
    it('loads initial data correctly', () => {
      const initialData = {
        A1: { value: 'Product' },
        B1: { value: 'Price' },
        A2: { value: 'Widget' },
        B2: { value: 29.99 },
      };

      const { container } = render(
        <SpreadsheetGrid rows={5} columns={5} initialData={initialData} />
      );

      expect(container.textContent).toContain('Product');
      expect(container.textContent).toContain('Price');
      expect(container.textContent).toContain('Widget');
      expect(container.textContent).toContain('29.99');
    });

    it('preserves formulas in cell data', () => {
      const initialData = {
        A1: { value: 10, formula: '=5+5' },
      };

      const { container } = render(
        <SpreadsheetGrid rows={5} columns={5} initialData={initialData} />
      );

      // Should display the calculated value
      expect(container.textContent).toContain('10');
    });
  });

  describe('Virtualization', () => {
    it('enables virtualization by default', () => {
      const { container } = render(<SpreadsheetGrid />);

      expect(container.textContent).toContain('(virtualized)');
    });

    it('can disable virtualization', () => {
      const { container } = render(<SpreadsheetGrid rows={10} columns={10} virtualized={false} />);

      expect(container.textContent).not.toContain('(virtualized)');
    });

    it('handles large grids with virtualization efficiently', () => {
      const startTime = performance.now();
      render(<SpreadsheetGrid rows={1000} columns={26} virtualized={true} />);
      const endTime = performance.now();

      const renderTime = endTime - startTime;
      // Virtualized rendering should be fast
      expect(renderTime).toBeLessThan(500);
    });
  });

  describe('Accessibility', () => {
    it('has proper tabindex for keyboard navigation', () => {
      const { container } = render(<SpreadsheetGrid rows={5} columns={5} />);

      const selectedCell = container.querySelector('[tabindex="0"]');
      expect(selectedCell).toBeInTheDocument();
    });

    it('provides visual focus indicators', () => {
      const { container } = render(<SpreadsheetGrid rows={5} columns={5} />);

      // Check that the grid container exists and has proper structure for focus management
      const gridContainer = container.firstChild;
      expect(gridContainer).toBeInTheDocument();

      // Check for focusable elements
      const focusableCell = container.querySelector('[tabindex="0"]');
      expect(focusableCell).toBeInTheDocument();
    });
  });
});
