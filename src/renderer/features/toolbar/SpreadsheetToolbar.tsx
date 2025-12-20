/**
 * SpreadsheetToolbar Component
 * 
 * Integrated toolbar for spreadsheet styling:
 * - Font controls (family, size, bold, italic, underline, strikethrough)
 * - Color pickers (font color, fill color)
 * - Reflects currently selected cell style
 * - Applies styles to selected cell/range
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Box } from '@mui/joy';
import { styled } from '@mui/joy/styles';
import { FontToolbar } from './FontToolbar';
import { useCellStyling } from '../../hooks/useCellStyling';
import { ExcelFont } from '../../../lib/exceljs-types';

// ============================================================================
// Styled Components
// ============================================================================

const ToolbarContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(1, 2),
  backgroundColor: theme.palette.background.surface,
  borderBottom: `1px solid ${theme.palette.divider}`,
  minHeight: '48px',
  flexWrap: 'wrap',
}));

// ============================================================================
// Props
// ============================================================================

export interface SpreadsheetToolbarProps {
  /**
   * Tab ID for Dexie storage
   */
  tabId: string;
  
  /**
   * Currently selected cell position
   */
  selectedCell?: { row: number; col: number } | null;
  
  /**
   * Currently selected range
   */
  selectedRange?: { startRow: number; startCol: number; endRow: number; endCol: number } | null;
  
  /**
   * Disabled state
   */
  disabled?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export const SpreadsheetToolbar: React.FC<SpreadsheetToolbarProps> = ({
  tabId,
  selectedCell,
  selectedRange,
  disabled = false,
}) => {
  const styling = useCellStyling({ tabId });
  
  // State for current cell style
  const [currentFont, setCurrentFont] = useState<Partial<ExcelFont>>({});
  const [currentFillColor, setCurrentFillColor] = useState<string>('#FFFFFF');
  const [recentColors, setRecentColors] = useState<string[]>([]);
  
  // ========================================================================
  // Load current cell style when selection changes
  // ========================================================================
  
  useEffect(() => {
    if (!selectedCell) {
      setCurrentFont({});
      setCurrentFillColor('#FFFFFF');
      return;
    }
    
    const loadStyle = async () => {
      const style = await styling.getCellStyle(selectedCell.row, selectedCell.col);
      
      if (style?.font) {
        setCurrentFont(style.font);
      } else {
        setCurrentFont({});
      }
      
      if (style?.fill && style.fill.type === 'pattern') {
        const patternFill = style.fill;
        if (patternFill.fgColor?.argb) {
          const argb = patternFill.fgColor.argb;
          const hex = argb.length === 8 ? `#${argb.substring(2)}` : argb;
          setCurrentFillColor(hex);
        }
      } else {
        setCurrentFillColor('#FFFFFF');
      }
    };
    
    loadStyle();
  }, [selectedCell, styling]);
  
  // ========================================================================
  // Apply font style changes
  // ========================================================================
  
  const handleFontChange = useCallback(async (font: Partial<ExcelFont>) => {
    if (!selectedCell && !selectedRange) return;
    
    try {
      if (selectedRange) {
        // Apply to range
        await styling.applyStyleToRange(
          selectedRange.startRow,
          selectedRange.startCol,
          selectedRange.endRow,
          selectedRange.endCol,
          { font }
        );
      } else if (selectedCell) {
        // Apply to single cell
        await styling.applyFontStyle(selectedCell.row, selectedCell.col, font);
      }
      
      // Update local state
      setCurrentFont(prev => ({ ...prev, ...font }));
    } catch (error) {
      console.error('[SpreadsheetToolbar] Error applying font style:', error);
    }
  }, [selectedCell, selectedRange, styling]);
  
  // ========================================================================
  // Apply fill color changes
  // ========================================================================
  
  const handleFillColorChange = useCallback(async (color: string) => {
    if (!selectedCell && !selectedRange) return;
    
    try {
      // Convert hex to ARGB
      const argb = `FF${color.substring(1)}`;
      
      const fill = {
        type: 'pattern' as const,
        pattern: 'solid' as const,
        fgColor: { argb },
      };
      
      if (selectedRange) {
        // Apply to range
        await styling.applyStyleToRange(
          selectedRange.startRow,
          selectedRange.startCol,
          selectedRange.endRow,
          selectedRange.endCol,
          { fill }
        );
      } else if (selectedCell) {
        // Apply to single cell
        await styling.applyFillStyle(selectedCell.row, selectedCell.col, fill);
      }
      
      // Update local state
      setCurrentFillColor(color);
    } catch (error) {
      console.error('[SpreadsheetToolbar] Error applying fill color:', error);
    }
  }, [selectedCell, selectedRange, styling]);
  
  // ========================================================================
  // Render
  // ========================================================================
  
  return (
    <ToolbarContainer>
      <FontToolbar
        currentFont={currentFont}
        currentFillColor={currentFillColor}
        onFontChange={handleFontChange}
        onFillColorChange={handleFillColorChange}
        disabled={disabled || (!selectedCell && !selectedRange)}
        recentColors={recentColors}
        onRecentColorsChange={setRecentColors}
      />
    </ToolbarContainer>
  );
};

SpreadsheetToolbar.displayName = 'SpreadsheetToolbar';
