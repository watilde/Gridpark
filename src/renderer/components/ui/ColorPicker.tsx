/**
 * Color Picker Component
 * 
 * Excel-style color picker with:
 * - Theme colors (standard Excel palette)
 * - Recent colors
 * - Custom color picker (HexColorPicker)
 */

import React, { useState, useCallback } from 'react';
import { Box, Button, Popover, Typography } from '@mui/joy';
import { styled } from '@mui/joy/styles';
import { HexColorPicker } from 'react-colorful';

// ============================================================================
// Styled Components
// ============================================================================

const ColorPickerContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  minWidth: '240px',
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
}));

const ColorSwatchGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(10, 1fr)',
  gap: theme.spacing(0.5),
}));

const ColorSwatch = styled('button')<{ color: string; selected?: boolean }>(({ theme, color, selected }) => ({
  width: '20px',
  height: '20px',
  border: selected ? `2px solid ${theme.palette.primary[500]}` : `1px solid ${theme.palette.divider}`,
  borderRadius: '2px',
  backgroundColor: color,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  
  '&:hover': {
    transform: 'scale(1.2)',
    boxShadow: theme.shadow.sm,
  },
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontSize: '12px',
  fontWeight: 600,
  color: theme.palette.text.secondary,
  marginBottom: theme.spacing(0.5),
}));

// ============================================================================
// Excel Theme Colors (Standard Palette)
// ============================================================================

const THEME_COLORS = [
  // Row 1: Theme Colors
  '#FFFFFF', '#000000', '#E7E6E6', '#44546A', '#4472C4', '#ED7D31', '#A5A5A5', '#FFC000', '#5B9BD5', '#70AD47',
  
  // Row 2: Lighter variants
  '#F2F2F2', '#7F7F7F', '#D0CECE', '#D6DCE4', '#D9E2F3', '#FCE4D6', '#EDEDED', '#FFF2CC', '#DEEAF6', '#E2EFD9',
  
  // Row 3: Light variants
  '#D9D9D9', '#595959', '#AEABAB', '#ACB9CA', '#B4C7E7', '#F8CBAD', '#DBDBDB', '#FFE699', '#BDD7EE', '#C5E0B3',
  
  // Row 4: Medium variants
  '#BFBFBF', '#3F3F3F', '#757171', '#8496B0', '#8FAADC', '#F4B183', '#C9C9C9', '#FFD966', '#9CC3E5', '#A8D08D',
  
  // Row 5: Dark variants
  '#A6A6A6', '#262626', '#3A3838', '#323E4F', '#2E5090', '#C45911', '#7B7B7B', '#BF8F00', '#2E75B5', '#538135',
  
  // Row 6: Darker variants
  '#808080', '#0C0C0C', '#171616', '#222A35', '#1F3864', '#833C0B', '#525252', '#7F5F00', '#1E4E79', '#375623',
];

const STANDARD_COLORS = [
  '#C00000', '#FF0000', '#FFC000', '#FFFF00', '#92D050', '#00B050', '#00B0F0', '#0070C0', '#002060', '#7030A0',
];

// ============================================================================
// Props
// ============================================================================

export interface ColorPickerProps {
  /**
   * Current color value (hex format)
   */
  value?: string;
  
  /**
   * Callback when color changes
   */
  onChange?: (color: string) => void;
  
  /**
   * Show alpha/transparency control
   */
  showAlpha?: boolean;
  
  /**
   * Recent colors list
   */
  recentColors?: string[];
  
  /**
   * Callback to update recent colors
   */
  onRecentColorsChange?: (colors: string[]) => void;
}

// ============================================================================
// Component
// ============================================================================

export const ColorPicker: React.FC<ColorPickerProps> = ({
  value = '#000000',
  onChange,
  showAlpha = false,
  recentColors = [],
  onRecentColorsChange,
}) => {
  const [customColor, setCustomColor] = useState(value);
  
  // ========================================================================
  // Handlers
  // ========================================================================
  
  const handleColorSelect = useCallback((color: string) => {
    if (onChange) {
      onChange(color);
    }
    
    // Add to recent colors
    if (onRecentColorsChange) {
      const updated = [color, ...recentColors.filter(c => c !== color)].slice(0, 10);
      onRecentColorsChange(updated);
    }
  }, [onChange, recentColors, onRecentColorsChange]);
  
  const handleCustomColorChange = useCallback((color: string) => {
    setCustomColor(color);
  }, []);
  
  const handleCustomColorApply = useCallback(() => {
    handleColorSelect(customColor);
  }, [customColor, handleColorSelect]);
  
  // ========================================================================
  // Render
  // ========================================================================
  
  return (
    <ColorPickerContainer>
      {/* Theme Colors */}
      <Box>
        <SectionTitle>Theme Colors</SectionTitle>
        <ColorSwatchGrid>
          {THEME_COLORS.map((color, index) => (
            <ColorSwatch
              key={`theme-${index}`}
              color={color}
              selected={value === color}
              onClick={() => handleColorSelect(color)}
              title={color}
            />
          ))}
        </ColorSwatchGrid>
      </Box>
      
      {/* Standard Colors */}
      <Box>
        <SectionTitle>Standard Colors</SectionTitle>
        <ColorSwatchGrid sx={{ gridTemplateColumns: 'repeat(10, 1fr)' }}>
          {STANDARD_COLORS.map((color, index) => (
            <ColorSwatch
              key={`standard-${index}`}
              color={color}
              selected={value === color}
              onClick={() => handleColorSelect(color)}
              title={color}
            />
          ))}
        </ColorSwatchGrid>
      </Box>
      
      {/* Recent Colors */}
      {recentColors.length > 0 && (
        <Box>
          <SectionTitle>Recent Colors</SectionTitle>
          <ColorSwatchGrid sx={{ gridTemplateColumns: 'repeat(10, 1fr)' }}>
            {recentColors.map((color, index) => (
              <ColorSwatch
                key={`recent-${index}`}
                color={color}
                selected={value === color}
                onClick={() => handleColorSelect(color)}
                title={color}
              />
            ))}
          </ColorSwatchGrid>
        </Box>
      )}
      
      {/* Custom Color Picker */}
      <Box>
        <SectionTitle>Custom Color</SectionTitle>
        <HexColorPicker color={customColor} onChange={handleCustomColorChange} />
        <Box sx={{ mt: 1, display: 'flex', gap: 1, alignItems: 'center' }}>
          <Box
            sx={{
              width: '40px',
              height: '40px',
              backgroundColor: customColor,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 'sm',
            }}
          />
          <Typography level="body-sm" sx={{ flex: 1, fontFamily: 'monospace' }}>
            {customColor.toUpperCase()}
          </Typography>
          <Button size="sm" onClick={handleCustomColorApply}>
            Apply
          </Button>
        </Box>
      </Box>
    </ColorPickerContainer>
  );
};

// ============================================================================
// Color Picker Button (with Popover)
// ============================================================================

export interface ColorPickerButtonProps extends ColorPickerProps {
  /**
   * Button label
   */
  label?: string;
  
  /**
   * Button icon
   */
  icon?: React.ReactNode;
  
  /**
   * Disabled state
   */
  disabled?: boolean;
  
  /**
   * Size variant
   */
  size?: 'sm' | 'md' | 'lg';
}

export const ColorPickerButton: React.FC<ColorPickerButtonProps> = ({
  label,
  icon,
  disabled = false,
  size = 'md',
  value,
  onChange,
  showAlpha,
  recentColors,
  onRecentColorsChange,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleChange = (color: string) => {
    if (onChange) {
      onChange(color);
    }
    // Don't close automatically - let user pick multiple colors
  };
  
  const open = Boolean(anchorEl);
  
  return (
    <>
      <Button
        variant="outlined"
        color="neutral"
        size={size}
        disabled={disabled}
        onClick={handleClick}
        startDecorator={icon}
        sx={{
          position: 'relative',
          '&::after': value ? {
            content: '""',
            position: 'absolute',
            bottom: '2px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '80%',
            height: '3px',
            backgroundColor: value,
            borderRadius: '2px',
          } : undefined,
        }}
      >
        {label}
      </Button>
      
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        placement="bottom-start"
        sx={{
          '& .MuiPopover-paper': {
            overflow: 'visible',
          },
        }}
      >
        <ColorPicker
          value={value}
          onChange={handleChange}
          showAlpha={showAlpha}
          recentColors={recentColors}
          onRecentColorsChange={onRecentColorsChange}
        />
      </Popover>
    </>
  );
};

ColorPicker.displayName = 'ColorPicker';
ColorPickerButton.displayName = 'ColorPickerButton';
