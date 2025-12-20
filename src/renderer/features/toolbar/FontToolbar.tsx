/**
 * Font Toolbar Component
 * 
 * Provides font styling controls for Excel cells:
 * - Font Family selector
 * - Font Size selector
 * - Bold, Italic, Underline buttons
 * - Font Color picker
 */

import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Select,
  Option,
  Tooltip,
  ButtonGroup,
} from '@mui/joy';
import { styled } from '@mui/joy/styles';
import {
  FormatBold as BoldIcon,
  FormatItalic as ItalicIcon,
  FormatUnderlined as UnderlineIcon,
  StrikethroughS as StrikeIcon,
  FormatColorText as FontColorIcon,
} from '@mui/icons-material';
import { ExcelFont } from '../../../lib/exceljs-types';

// ============================================================================
// Styled Components
// ============================================================================

const ToolbarGroup = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
}));

const CompactSelect = styled(Select)(({ theme }) => ({
  minWidth: '80px',
  height: '32px',
  fontSize: '13px',
}));

const FontSizeSelect = styled(Select)(({ theme }) => ({
  minWidth: '60px',
  height: '32px',
  fontSize: '13px',
}));

// ============================================================================
// Font Families
// ============================================================================

const FONT_FAMILIES = [
  'Calibri',
  'Arial',
  'Times New Roman',
  'Courier New',
  'Georgia',
  'Verdana',
  'Comic Sans MS',
  'Trebuchet MS',
  'Impact',
  'Lucida Console',
  'Tahoma',
  'Palatino Linotype',
  'Garamond',
  'Book Antiqua',
  'Century Gothic',
] as const;

const FONT_SIZES = [
  8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72,
] as const;

// ============================================================================
// Props
// ============================================================================

export interface FontToolbarProps {
  /**
   * Current font style (from selected cell)
   */
  currentFont?: Partial<ExcelFont>;
  
  /**
   * Callback when font changes
   */
  onFontChange?: (font: Partial<ExcelFont>) => void;
  
  /**
   * Disabled state
   */
  disabled?: boolean;
  
  /**
   * Compact mode (smaller controls)
   */
  compact?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export const FontToolbar: React.FC<FontToolbarProps> = ({
  currentFont = {},
  onFontChange,
  disabled = false,
  compact = false,
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  
  const fontFamily = currentFont.name || 'Calibri';
  const fontSize = currentFont.size || 11;
  const isBold = currentFont.bold || false;
  const isItalic = currentFont.italic || false;
  const isUnderline = currentFont.underline || false;
  const isStrike = currentFont.strike || false;
  
  // ========================================================================
  // Handlers
  // ========================================================================
  
  const handleFontFamilyChange = (_: any, value: string | null) => {
    if (value && onFontChange) {
      onFontChange({ ...currentFont, name: value });
    }
  };
  
  const handleFontSizeChange = (_: any, value: number | null) => {
    if (value && onFontChange) {
      onFontChange({ ...currentFont, size: value });
    }
  };
  
  const handleBoldToggle = () => {
    if (onFontChange) {
      onFontChange({ ...currentFont, bold: !isBold });
    }
  };
  
  const handleItalicToggle = () => {
    if (onFontChange) {
      onFontChange({ ...currentFont, italic: !isItalic });
    }
  };
  
  const handleUnderlineToggle = () => {
    if (onFontChange) {
      const newUnderline = isUnderline ? false : 'single';
      onFontChange({ ...currentFont, underline: newUnderline as any });
    }
  };
  
  const handleStrikeToggle = () => {
    if (onFontChange) {
      onFontChange({ ...currentFont, strike: !isStrike });
    }
  };
  
  const handleFontColorChange = (color: string) => {
    if (onFontChange) {
      onFontChange({ 
        ...currentFont, 
        color: { argb: color }
      });
    }
  };
  
  // ========================================================================
  // Render
  // ========================================================================
  
  return (
    <ToolbarGroup>
      {/* Font Family */}
      <Tooltip title="Font Family" placement="bottom">
        <CompactSelect
          value={fontFamily}
          onChange={handleFontFamilyChange}
          disabled={disabled}
          size={compact ? 'sm' : 'md'}
          slotProps={{
            listbox: {
              sx: {
                maxHeight: '300px',
                overflow: 'auto',
              },
            },
          }}
        >
          {FONT_FAMILIES.map(font => (
            <Option key={font} value={font} sx={{ fontFamily: font }}>
              {font}
            </Option>
          ))}
        </CompactSelect>
      </Tooltip>
      
      {/* Font Size */}
      <Tooltip title="Font Size" placement="bottom">
        <FontSizeSelect
          value={fontSize}
          onChange={handleFontSizeChange}
          disabled={disabled}
          size={compact ? 'sm' : 'md'}
        >
          {FONT_SIZES.map(size => (
            <Option key={size} value={size}>
              {size}
            </Option>
          ))}
        </FontSizeSelect>
      </Tooltip>
      
      {/* Font Style Buttons */}
      <ButtonGroup
        variant="outlined"
        size={compact ? 'sm' : 'md'}
        sx={{ height: '32px' }}
      >
        <Tooltip title="Bold (Ctrl+B)" placement="bottom">
          <IconButton
            onClick={handleBoldToggle}
            disabled={disabled}
            color={isBold ? 'primary' : 'neutral'}
            variant={isBold ? 'solid' : 'outlined'}
          >
            <BoldIcon />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Italic (Ctrl+I)" placement="bottom">
          <IconButton
            onClick={handleItalicToggle}
            disabled={disabled}
            color={isItalic ? 'primary' : 'neutral'}
            variant={isItalic ? 'solid' : 'outlined'}
          >
            <ItalicIcon />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Underline (Ctrl+U)" placement="bottom">
          <IconButton
            onClick={handleUnderlineToggle}
            disabled={disabled}
            color={isUnderline ? 'primary' : 'neutral'}
            variant={isUnderline ? 'solid' : 'outlined'}
          >
            <UnderlineIcon />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Strikethrough" placement="bottom">
          <IconButton
            onClick={handleStrikeToggle}
            disabled={disabled}
            color={isStrike ? 'primary' : 'neutral'}
            variant={isStrike ? 'solid' : 'outlined'}
          >
            <StrikeIcon />
          </IconButton>
        </Tooltip>
      </ButtonGroup>
      
      {/* Font Color - Will be replaced with color picker in next step */}
      <Tooltip title="Font Color" placement="bottom">
        <IconButton
          onClick={() => setShowColorPicker(!showColorPicker)}
          disabled={disabled}
          color="neutral"
          variant="outlined"
          size={compact ? 'sm' : 'md'}
        >
          <FontColorIcon />
        </IconButton>
      </Tooltip>
    </ToolbarGroup>
  );
};

FontToolbar.displayName = 'FontToolbar';
