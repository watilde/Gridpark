/**
 * StyleToolbar - Cell styling toolbar
 *
 * Redesigned with Excel-like tabs + VSCode aesthetics
 */

import React, { useCallback, useState } from 'react';
import { Box, Select, Option, IconButton, Stack, useTheme, Tooltip, Tabs, TabList, Tab } from '@mui/joy';
import {
  BorderAll as BorderAllIcon,
  BorderOuter as BorderOuterIcon,
  BorderClear as BorderClearIcon,
  VerticalAlignTop as VerticalAlignTopIcon,
  VerticalAlignCenter as VerticalAlignCenterIcon,
  VerticalAlignBottom as VerticalAlignBottomIcon,
  FormatAlignLeft as AlignLeftIcon,
  FormatAlignCenter as AlignCenterIcon,
  FormatAlignRight as AlignRightIcon,
  FormatBold as BoldIcon,
  FormatItalic as ItalicIcon,
  FormatUnderlined as UnderlineIcon,
  PivotTableChart as PivotTableChartIcon,
  TableChart as TableChartIcon,
  InsertPhoto as InsertPhotoIcon,
  Link as LinkIcon,
  NoteAdd as NoteAddIcon,
  BarChart as BarChartIcon,
  Create as PenIcon,
  Gesture as DrawIcon,
  Edit as HighlighterIcon,
  HistoryEdu as FountainPenIcon,
  Clear as EraserIcon,
  Functions as FunctionsIcon,
  Calculate as CalculateIcon,
  TextFields as TextFieldsIcon,
  AccessTime as DateTimeIcon,
  CheckCircle as LogicalIcon,
  FindReplace as LookupIcon,
  Tag as MathIcon,
  AttachMoney as FinancialIcon,
  TrendingUp as ForecastIcon,
  Whatshot as WhatIfIcon,
  FilterAlt as FilterIcon,
  SortByAlpha as SortIcon,
  DataObject as DataValidationIcon,
  Extension as SolverIcon,
  Print as PrintIcon,
  Description as MarginsIcon,
  SettingsOverscan as OrientationIcon,
  CropFree as PrintAreaIcon,
  Square as SizeIcon,
} from '@mui/icons-material';
import { CellStyleData } from '../../../../lib/db';

interface StyleToolbarProps {
  selectedCellStyle?: CellStyleData;
  onStyleChange: (style: Partial<CellStyleData>) => void;
  onInsert?: (type: 'link' | 'note' | 'image' | 'table') => void;
  activeDrawTool?: 'pen' | 'highlighter' | 'eraser' | null;
  onDrawToolChange?: (tool: 'pen' | 'highlighter' | 'eraser' | null) => void;
  penColor?: string;
  onPenColorChange?: (color: string) => void;
  onFormulaAction?: (action: string) => void;
  onDataAction?: (action: string) => void;
  onPageLayoutAction?: (action: string) => void;
}

const FONT_FAMILIES = [
  'Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Verdana', 'Georgia',
];

const FONT_SIZES = ['10px', '11px', '12px', '13px', '14px', '16px', '18px', '20px'];

export const StyleToolbar: React.FC<StyleToolbarProps> = ({
  selectedCellStyle = {},
  onStyleChange,
  onInsert,
  activeDrawTool = null,
  onDrawToolChange,
  penColor = '#000000',
  onPenColorChange,
  onFormulaAction,
  onDataAction,
  onPageLayoutAction,
}) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);

  const handleFontFamilyChange = useCallback((_: any, value: string | null) => {
    if (value) onStyleChange({ fontFamily: value });
  }, [onStyleChange]);

  const handleFontSizeChange = useCallback((_: any, value: string | null) => {
    if (value) onStyleChange({ fontSize: value });
  }, [onStyleChange]);

  const toggleBold = useCallback(() => {
    const isBold = selectedCellStyle.fontWeight === 'bold' || selectedCellStyle.fontWeight === 700;
    onStyleChange({ fontWeight: isBold ? 'normal' : 'bold' });
  }, [selectedCellStyle.fontWeight, onStyleChange]);

  const toggleItalic = useCallback(() => {
    onStyleChange({ fontStyle: selectedCellStyle.fontStyle === 'italic' ? 'normal' : 'italic' });
  }, [selectedCellStyle.fontStyle, onStyleChange]);

  const toggleUnderline = useCallback(() => {
    onStyleChange({ textDecoration: selectedCellStyle.textDecoration === 'underline' ? 'none' : 'underline' });
  }, [selectedCellStyle.textDecoration, onStyleChange]);

  const handleTextColorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onStyleChange({ color: e.target.value });
  }, [onStyleChange]);

  const handleBackgroundColorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onStyleChange({ backgroundColor: e.target.value });
  }, [onStyleChange]);

  const applyBorder = useCallback((type: 'all' | 'outer' | 'none') => {
    const borderStyle = '1px solid #000';
    if (type === 'all' || type === 'outer') {
      onStyleChange({ borderTop: borderStyle, borderBottom: borderStyle, borderLeft: borderStyle, borderRight: borderStyle });
    } else {
      onStyleChange({ borderTop: 'none', borderBottom: 'none', borderLeft: 'none', borderRight: 'none', border: 'none' });
    }
  }, [onStyleChange]);

  const isBold = selectedCellStyle.fontWeight === 'bold' || selectedCellStyle.fontWeight === 700;
  const isItalic = selectedCellStyle.fontStyle === 'italic';
  const isUnderline = selectedCellStyle.textDecoration === 'underline';
  const textAlign = selectedCellStyle.textAlign || 'left';
  const verticalAlign = selectedCellStyle.verticalAlign || 'bottom';

  const Divider = () => <Box sx={{ width: '1px', height: '24px', bgcolor: 'divider', mx: 1 }} />;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        borderBottom: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.surface',
        color: 'text.primary',
        width: '100%',
      }}
    >
      <Tabs
        value={activeTab}
        onChange={(e, val) => setActiveTab(val as number)}
        size="sm"
        sx={{
          backgroundColor: 'transparent',
          '& .MuiTab-root': {
            fontWeight: 500,
            fontSize: '12px',
            minHeight: '32px',
            borderRadius: '4px 4px 0 0',
            '&.Mui-selected': {
              backgroundColor: 'background.body',
              borderTop: `2px solid ${theme.palette.primary.main}`,
              borderBottom: 'none',
              color: 'text.primary',
            },
            '&:hover': {
              backgroundColor: 'background.level1',
            }
          },
          '& .MuiTabList-root': {
            padding: '4px 8px 0',
            gap: 0.5,
            borderBottom: 'none',
          }
        }}
      >
        <TabList disableUnderline>
          <Tab>Home</Tab>
          <Tab>Insert</Tab>
          <Tab>Draw</Tab>
          <Tab>Page Layout</Tab>
          <Tab>Formulas</Tab>
          <Tab>Data</Tab>
        </TabList>

        <Box
          sx={{
            p: 1,
            backgroundColor: 'background.body',
            borderTop: '1px solid',
            borderColor: 'divider',
            minHeight: '48px',
            display: 'flex',
            alignItems: 'center',
            overflowX: 'auto',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          {activeTab === 0 && (
            <Stack direction="row" spacing={1} alignItems="center">
              {/* Font */}
              <Stack direction="row" spacing={1} alignItems="center">
                <Select
                  value={selectedCellStyle.fontFamily || 'Arial'}
                  onChange={handleFontFamilyChange}
                  size="sm"
                  variant="outlined"
                  sx={{ minWidth: 130 }}
                >
                  {FONT_FAMILIES.map(font => <Option key={font} value={font}>{font}</Option>)}
                </Select>

                <Select
                  value={selectedCellStyle.fontSize || '13px'}
                  onChange={handleFontSizeChange}
                  size="sm"
                  variant="outlined"
                  sx={{ minWidth: 70 }}
                >
                  {FONT_SIZES.map(size => <Option key={size} value={size}>{size}</Option>)}
                </Select>
              </Stack>

              <Divider />

              {/* Style */}
              <Stack direction="row" spacing={0.5}>
                <Tooltip title="Bold (Ctrl+B)" size="sm"><IconButton size="sm" variant={isBold ? 'solid' : 'plain'} color={isBold ? 'primary' : 'neutral'} onClick={toggleBold}><BoldIcon fontSize="small" /></IconButton></Tooltip>
                <Tooltip title="Italic (Ctrl+I)" size="sm"><IconButton size="sm" variant={isItalic ? 'solid' : 'plain'} color={isItalic ? 'primary' : 'neutral'} onClick={toggleItalic}><ItalicIcon fontSize="small" /></IconButton></Tooltip>
                <Tooltip title="Underline (Ctrl+U)" size="sm"><IconButton size="sm" variant={isUnderline ? 'solid' : 'plain'} color={isUnderline ? 'primary' : 'neutral'} onClick={toggleUnderline}><UnderlineIcon fontSize="small" /></IconButton></Tooltip>
              </Stack>

              <Divider />

              {/* Color */}
              <Stack direction="row" spacing={1} alignItems="center">
                <Tooltip title="Text Color">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, border: '1px solid', borderColor: 'neutral.outlinedBorder', borderRadius: 'sm', px: 0.5, py: 0.25, cursor: 'pointer', position: 'relative', '&:hover': { bgcolor: 'background.level1' } }}>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', borderBottom: `3px solid ${selectedCellStyle.color || '#000'}` }}>A</span>
                    <Box component="label" sx={{ position: 'absolute', inset: 0, cursor: 'pointer' }}>
                       <input type="color" value={selectedCellStyle.color || '#000000'} onChange={handleTextColorChange} style={{ width: 0, height: 0, opacity: 0 }} />
                    </Box>
                  </Box>
                </Tooltip>
                
                <Tooltip title="Fill Color">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, border: '1px solid', borderColor: 'neutral.outlinedBorder', borderRadius: 'sm', px: 0.5, py: 0.25, position: 'relative', '&:hover': { bgcolor: 'background.level1' } }}>
                    <span style={{ fontSize: '12px' }}>🎨</span>
                    <Box sx={{ width: '100%', height: '3px', bgcolor: selectedCellStyle.backgroundColor || 'transparent', position: 'absolute', bottom: 2, left: 0 }} />
                    <Box component="label" sx={{ position: 'absolute', inset: 0, cursor: 'pointer' }}>
                       <input type="color" value={selectedCellStyle.backgroundColor || '#ffffff'} onChange={handleBackgroundColorChange} style={{ width: 0, height: 0, opacity: 0 }} />
                    </Box>
                  </Box>
                </Tooltip>
              </Stack>

              <Divider />

              {/* Alignment */}
              <Stack direction="row" spacing={0.5}>
                <IconButton size="sm" variant={textAlign === 'left' ? 'solid' : 'plain'} onClick={() => onStyleChange({ textAlign: 'left' })}><AlignLeftIcon fontSize="small" /></IconButton>
                <IconButton size="sm" variant={textAlign === 'center' ? 'solid' : 'plain'} onClick={() => onStyleChange({ textAlign: 'center' })}><AlignCenterIcon fontSize="small" /></IconButton>
                <IconButton size="sm" variant={textAlign === 'right' ? 'solid' : 'plain'} onClick={() => onStyleChange({ textAlign: 'right' })}><AlignRightIcon fontSize="small" /></IconButton>
              </Stack>

              <Divider />

              {/* Vertical Alignment */}
              <Stack direction="row" spacing={0.5}>
                <IconButton size="sm" variant={verticalAlign === 'top' ? 'solid' : 'plain'} onClick={() => onStyleChange({ verticalAlign: 'top' })}><VerticalAlignTopIcon fontSize="small" /></IconButton>
                <IconButton size="sm" variant={verticalAlign === 'middle' ? 'solid' : 'plain'} onClick={() => onStyleChange({ verticalAlign: 'middle' })}><VerticalAlignCenterIcon fontSize="small" /></IconButton>
                <IconButton size="sm" variant={verticalAlign === 'bottom' ? 'solid' : 'plain'} onClick={() => onStyleChange({ verticalAlign: 'bottom' })}><VerticalAlignBottomIcon fontSize="small" /></IconButton>
              </Stack>

              <Divider />

              {/* Borders */}
              <Stack direction="row" spacing={0.5}>
                <Tooltip title="All Borders" size="sm"><IconButton size="sm" variant="plain" onClick={() => applyBorder('all')}><BorderAllIcon fontSize="small" /></IconButton></Tooltip>
                <Tooltip title="Outside Borders" size="sm"><IconButton size="sm" variant="plain" onClick={() => applyBorder('outer')}><BorderOuterIcon fontSize="small" /></IconButton></Tooltip>
                <Tooltip title="No Borders" size="sm"><IconButton size="sm" variant="plain" onClick={() => applyBorder('none')}><BorderClearIcon fontSize="small" /></IconButton></Tooltip>
              </Stack>
            </Stack>
          )}

          {activeTab === 1 && (
            <Stack direction="row" spacing={1} alignItems="center">
              <Tooltip title="Pivot Table (Not supported by ExcelJS)">
                <IconButton size="sm" variant="plain" disabled sx={{ opacity: 0.5 }}>
                  <PivotTableChartIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Table">
                <IconButton size="sm" variant="plain" onClick={() => onInsert?.('table')}>
                  <TableChartIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Divider />

              <Tooltip title="Picture">
                <IconButton size="sm" variant="plain" onClick={() => onInsert?.('image')}>
                  <InsertPhotoIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Chart">
                <IconButton size="sm" variant="plain" disabled sx={{ opacity: 0.5 }}>
                  <BarChartIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Divider />

              <Tooltip title="Link">
                <IconButton size="sm" variant="plain" onClick={() => onInsert?.('link')}>
                  <LinkIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Note">
                <IconButton size="sm" variant="plain" onClick={() => onInsert?.('note')}>
                  <NoteAddIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          )}

          {activeTab === 2 && (
            <Stack direction="row" spacing={1} alignItems="center">
              <Tooltip title="Select">
                <IconButton 
                  size="sm" 
                  variant={activeDrawTool === null ? 'solid' : 'plain'} 
                  onClick={() => onDrawToolChange?.(null)}
                >
                  <DrawIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Divider />

              <Tooltip title="Pen">
                <IconButton 
                  size="sm" 
                  variant={activeDrawTool === 'pen' ? 'solid' : 'plain'} 
                  color={activeDrawTool === 'pen' ? 'primary' : 'neutral'}
                  onClick={() => onDrawToolChange?.('pen')}
                >
                  <PenIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Highlighter">
                <IconButton 
                  size="sm" 
                  variant={activeDrawTool === 'highlighter' ? 'solid' : 'plain'} 
                  color={activeDrawTool === 'highlighter' ? 'warning' : 'neutral'}
                  onClick={() => onDrawToolChange?.('highlighter')}
                >
                  <HighlighterIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Eraser">
                <IconButton 
                  size="sm" 
                  variant={activeDrawTool === 'eraser' ? 'solid' : 'plain'} 
                  onClick={() => onDrawToolChange?.('eraser')}
                >
                  <EraserIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Divider />

              {/* Pen Color Presets */}
              <Stack direction="row" spacing={0.5}>
                {['#000000', '#FF0000', '#0000FF', '#008000'].map(color => (
                  <Box
                    key={color}
                    onClick={() => onPenColorChange?.(color)}
                    sx={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      bgcolor: color,
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: penColor === color ? 'primary.main' : 'divider',
                      boxShadow: penColor === color ? '0 0 0 2px rgba(0,0,0,0.2)' : 'none',
                      '&:hover': { transform: 'scale(1.2)' },
                      transition: 'transform 0.1s'
                    }}
                  />
                ))}
              </Stack>
            </Stack>
          )}

          {activeTab === 3 && (
            <Stack direction="row" spacing={1} alignItems="center">
              <Tooltip title="Print">
                <IconButton size="sm" variant="plain" onClick={() => onPageLayoutAction?.('print')}>
                  <PrintIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Divider />

              <Tooltip title="Margins">
                <IconButton size="sm" variant="plain" onClick={() => onPageLayoutAction?.('margins')}>
                  <MarginsIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Orientation">
                <IconButton size="sm" variant="plain" onClick={() => onPageLayoutAction?.('orientation')}>
                  <OrientationIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Size">
                <IconButton size="sm" variant="plain" onClick={() => onPageLayoutAction?.('size')}>
                  <SizeIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Print Area">
                <IconButton size="sm" variant="plain" onClick={() => onPageLayoutAction?.('print_area')}>
                  <PrintAreaIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          )}

          {activeTab === 4 && (
            <Stack direction="row" spacing={1} alignItems="center">
              <Tooltip title="Insert Function (fx)">
                <IconButton size="sm" variant="plain" onClick={() => onFormulaAction?.('insert_function')}>
                  <FunctionsIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="AutoSum">
                <IconButton size="sm" variant="plain" onClick={() => onFormulaAction?.('autosum')}>
                  <FunctionsIcon fontSize="small" sx={{ transform: 'rotate(90deg)' }} /> {/* Sigma approximation */}
                </IconButton>
              </Tooltip>

              <Divider />

              <Tooltip title="Financial">
                <IconButton size="sm" variant="plain" onClick={() => onFormulaAction?.('category_financial')}>
                  <FinancialIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Logical">
                <IconButton size="sm" variant="plain" onClick={() => onFormulaAction?.('category_logical')}>
                  <LogicalIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Text">
                <IconButton size="sm" variant="plain" onClick={() => onFormulaAction?.('category_text')}>
                  <TextFieldsIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Date & Time">
                <IconButton size="sm" variant="plain" onClick={() => onFormulaAction?.('category_date')}>
                  <DateTimeIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Lookup & Reference">
                <IconButton size="sm" variant="plain" onClick={() => onFormulaAction?.('category_lookup')}>
                  <LookupIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Math & Trig">
                <IconButton size="sm" variant="plain" onClick={() => onFormulaAction?.('category_math')}>
                  <MathIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Divider />

              <Tooltip title="Calculate Now">
                <IconButton size="sm" variant="plain" onClick={() => onFormulaAction?.('calculate')}>
                  <CalculateIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          )}

          {activeTab === 5 && (
            <Stack direction="row" spacing={1} alignItems="center">
              <Tooltip title="Sort & Filter">
                <IconButton size="sm" variant="plain" onClick={() => onDataAction?.('sort_filter')}>
                  <FilterIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Sort A to Z">
                <IconButton size="sm" variant="plain" onClick={() => onDataAction?.('sort_asc')}>
                  <SortIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Divider />

              <Tooltip title="Forecast Sheet">
                <IconButton size="sm" variant="plain" onClick={() => onDataAction?.('forecast')}>
                  <ForecastIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="What-If Analysis">
                <IconButton size="sm" variant="plain" onClick={() => onDataAction?.('what_if')}>
                  <WhatIfIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Solver (Optimization)">
                <IconButton size="sm" variant="plain" onClick={() => onDataAction?.('solver')}>
                  <SolverIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Divider />

              <Tooltip title="Data Validation">
                <IconButton size="sm" variant="plain" onClick={() => onDataAction?.('data_validation')}>
                  <DataValidationIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          )}
        </Box>
      </Tabs>
    </Box>
  );
};