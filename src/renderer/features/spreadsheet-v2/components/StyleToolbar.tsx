/**
 * StyleToolbar - Cell styling toolbar
 * 
 * Features:
 * - Font family selection
 * - Font size selection
 * - Bold, Italic, Underline buttons
 * - Text color picker
 * - Background color picker
 * - Text alignment buttons
 */

import React, { useCallback } from 'react';
import { Box, Button, Select, Option, IconButton, Stack } from '@mui/joy';
import { CellStyleData } from '../../../../lib/db';

interface StyleToolbarProps {
  // Current selection
  selectedCellStyle?: CellStyleData;
  
  // Callbacks
  onStyleChange: (style: Partial<CellStyleData>) => void;
}

// Font options
const FONT_FAMILIES = [
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Courier New',
  'Verdana',
  'Georgia',
  'Comic Sans MS',
  'Trebuchet MS',
];

const FONT_SIZES = ['10px', '11px', '12px', '13px', '14px', '16px', '18px', '20px', '24px', '28px', '32px'];

export const StyleToolbar: React.FC<StyleToolbarProps> = ({
  selectedCellStyle = {},
  onStyleChange,
}) => {
  // Font family
  const handleFontFamilyChange = useCallback((
    _event: React.SyntheticEvent | null,
    value: string | null
  ) => {
    if (value) {
      onStyleChange({ fontFamily: value });
    }
  }, [onStyleChange]);

  // Font size
  const handleFontSizeChange = useCallback((
    _event: React.SyntheticEvent | null,
    value: string | null
  ) => {
    if (value) {
      onStyleChange({ fontSize: value });
    }
  }, [onStyleChange]);

  // Toggle bold
  const toggleBold = useCallback(() => {
    const isBold = selectedCellStyle.fontWeight === 'bold' || selectedCellStyle.fontWeight === 700;
    onStyleChange({ fontWeight: isBold ? 'normal' : 'bold' });
  }, [selectedCellStyle.fontWeight, onStyleChange]);

  // Toggle italic
  const toggleItalic = useCallback(() => {
    const isItalic = selectedCellStyle.fontStyle === 'italic';
    onStyleChange({ fontStyle: isItalic ? 'normal' : 'italic' });
  }, [selectedCellStyle.fontStyle, onStyleChange]);

  // Toggle underline
  const toggleUnderline = useCallback(() => {
    const isUnderline = selectedCellStyle.textDecoration === 'underline';
    onStyleChange({ textDecoration: isUnderline ? 'none' : 'underline' });
  }, [selectedCellStyle.textDecoration, onStyleChange]);

  // Text color
  const handleTextColorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onStyleChange({ color: e.target.value });
  }, [onStyleChange]);

  // Background color
  const handleBackgroundColorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onStyleChange({ backgroundColor: e.target.value });
  }, [onStyleChange]);

  // Text alignment
  const setTextAlign = useCallback((align: 'left' | 'center' | 'right') => {
    onStyleChange({ textAlign: align });
  }, [onStyleChange]);

  const isBold = selectedCellStyle.fontWeight === 'bold' || selectedCellStyle.fontWeight === 700;
  const isItalic = selectedCellStyle.fontStyle === 'italic';
  const isUnderline = selectedCellStyle.textDecoration === 'underline';
  const textAlign = selectedCellStyle.textAlign || 'left';

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        padding: '8px 16px',
        borderBottom: '1px solid #e0e0e0',
        backgroundColor: '#f5f5f5',
        flexWrap: 'wrap',
      }}
    >
      {/* Font Family */}
      <Select
        value={selectedCellStyle.fontFamily || 'Arial'}
        onChange={handleFontFamilyChange}
        size="sm"
        sx={{ minWidth: 150 }}
      >
        {FONT_FAMILIES.map(font => (
          <Option key={font} value={font} style={{ fontFamily: font }}>
            {font}
          </Option>
        ))}
      </Select>

      {/* Font Size */}
      <Select
        value={selectedCellStyle.fontSize || '13px'}
        onChange={handleFontSizeChange}
        size="sm"
        sx={{ minWidth: 80 }}
      >
        {FONT_SIZES.map(size => (
          <Option key={size} value={size}>
            {size}
          </Option>
        ))}
      </Select>

      {/* Divider */}
      <Box sx={{ width: 1, height: 24, backgroundColor: '#ccc', mx: 0.5 }} />

      {/* Bold, Italic, Underline */}
      <Stack direction="row" spacing={0.5}>
        <IconButton
          size="sm"
          variant={isBold ? 'solid' : 'outlined'}
          onClick={toggleBold}
          sx={{ fontWeight: 'bold' }}
        >
          B
        </IconButton>
        
        <IconButton
          size="sm"
          variant={isItalic ? 'solid' : 'outlined'}
          onClick={toggleItalic}
          sx={{ fontStyle: 'italic' }}
        >
          I
        </IconButton>
        
        <IconButton
          size="sm"
          variant={isUnderline ? 'solid' : 'outlined'}
          onClick={toggleUnderline}
          sx={{ textDecoration: 'underline' }}
        >
          U
        </IconButton>
      </Stack>

      {/* Divider */}
      <Box sx={{ width: 1, height: 24, backgroundColor: '#ccc', mx: 0.5 }} />

      {/* Text Color */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <label htmlFor="text-color" style={{ fontSize: '13px', cursor: 'pointer' }}>
          A
        </label>
        <input
          id="text-color"
          type="color"
          value={selectedCellStyle.color || '#000000'}
          onChange={handleTextColorChange}
          style={{ width: 32, height: 24, cursor: 'pointer', border: '1px solid #ccc' }}
        />
      </Box>

      {/* Background Color */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <label htmlFor="bg-color" style={{ fontSize: '13px', cursor: 'pointer' }}>
          🎨
        </label>
        <input
          id="bg-color"
          type="color"
          value={selectedCellStyle.backgroundColor || '#ffffff'}
          onChange={handleBackgroundColorChange}
          style={{ width: 32, height: 24, cursor: 'pointer', border: '1px solid #ccc' }}
        />
      </Box>

      {/* Divider */}
      <Box sx={{ width: 1, height: 24, backgroundColor: '#ccc', mx: 0.5 }} />

      {/* Text Alignment */}
      <Stack direction="row" spacing={0.5}>
        <IconButton
          size="sm"
          variant={textAlign === 'left' ? 'solid' : 'outlined'}
          onClick={() => setTextAlign('left')}
        >
          ←
        </IconButton>
        
        <IconButton
          size="sm"
          variant={textAlign === 'center' ? 'solid' : 'outlined'}
          onClick={() => setTextAlign('center')}
        >
          ↔
        </IconButton>
        
        <IconButton
          size="sm"
          variant={textAlign === 'right' ? 'solid' : 'outlined'}
          onClick={() => setTextAlign('right')}
        >
          →
        </IconButton>
      </Stack>
    </Box>
  );
};
