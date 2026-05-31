/**
 * StyleToolbar - Cell styling toolbar
 *
 * Redesigned with Excel-like tabs + VSCode aesthetics
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Select,
  Option,
  IconButton,
  Stack,
  useTheme,
  Tooltip,
  Tabs,
  TabList,
  Tab,
} from '@mui/joy';
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
  TableChart as TableChartIcon,
  Link as LinkIcon,
  Create as PenIcon,
  Gesture as DrawIcon,
  Edit as HighlighterIcon,
  Clear as EraserIcon,
  Grain as SprayIcon,
  Functions as FunctionsIcon,
  Calculate as CalculateIcon,
  TextFields as TextFieldsIcon,
  AccessTime as DateTimeIcon,
  CheckCircle as LogicalIcon,
  FindReplace as LookupIcon,
  Tag as MathIcon,
  AttachMoney as FinancialIcon,
  SortByAlpha as SortIcon,
  GridGoldenratio as FreezeIcon,
  FilterAlt as FilterIcon,
} from '@mui/icons-material';
import { CellStyleData } from '../../../../lib/db';
import { useT } from '../../../i18n/I18nProvider';

interface StyleToolbarProps {
  selectedCellStyle?: CellStyleData;
  onStyleChange: (style: Partial<CellStyleData>) => void;
  onInsert?: (type: 'link' | 'table') => void;
  activeDrawTool?: 'pen' | 'highlighter' | 'eraser' | 'spray' | null;
  onDrawToolChange?: (tool: 'pen' | 'highlighter' | 'eraser' | 'spray' | null) => void;
  penColor?: string;
  onPenColorChange?: (color: string) => void;
  onFormulaAction?: (action: string) => void;
  onDataAction?: (action: string) => void;
  filterActive?: boolean;
  onNumberFormat?: (format: string) => void;
  onViewAction?: (action: string) => void;
  frozenRows?: number;
  frozenCols?: number;
  showGridlines?: boolean;
  onMerge?: () => void;
  onUnmerge?: () => void;
  hasMergeAtSelection?: boolean;
}

const FONT_FAMILIES = [
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Courier New',
  'Verdana',
  'Georgia',
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
  filterActive = false,
  onNumberFormat,
  onViewAction,
  frozenRows = 0,
  frozenCols = 0,
  showGridlines = true,
  onMerge,
  onUnmerge,
  hasMergeAtSelection = false,
}) => {
  const theme = useTheme();
  const t = useT();
  const [activeTab, setActiveTab] = useState(0);

  // Drawタブ(2)以外に切り替えた際にdrawツールをリセット
  useEffect(() => {
    if (activeTab !== 2) {
      onDrawToolChange?.(null);
    }
  }, [activeTab]);

  const handleFontFamilyChange = useCallback(
    (_: any, value: string | null) => {
      if (value) onStyleChange({ fontFamily: value });
    },
    [onStyleChange]
  );

  const handleFontSizeChange = useCallback(
    (_: any, value: string | null) => {
      if (value) onStyleChange({ fontSize: value });
    },
    [onStyleChange]
  );

  const toggleBold = useCallback(() => {
    const isBold = selectedCellStyle.fontWeight === 'bold' || selectedCellStyle.fontWeight === 700;
    onStyleChange({ fontWeight: isBold ? 'normal' : 'bold' });
  }, [selectedCellStyle.fontWeight, onStyleChange]);

  const toggleItalic = useCallback(() => {
    onStyleChange({ fontStyle: selectedCellStyle.fontStyle === 'italic' ? 'normal' : 'italic' });
  }, [selectedCellStyle.fontStyle, onStyleChange]);

  const toggleUnderline = useCallback(() => {
    onStyleChange({
      textDecoration: selectedCellStyle.textDecoration === 'underline' ? 'none' : 'underline',
    });
  }, [selectedCellStyle.textDecoration, onStyleChange]);

  const handleTextColorChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onStyleChange({ color: e.target.value });
    },
    [onStyleChange]
  );

  const handleBackgroundColorChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onStyleChange({ backgroundColor: e.target.value });
    },
    [onStyleChange]
  );

  const applyBorder = useCallback(
    (type: 'all' | 'outer' | 'none') => {
      const borderStyle = '1px solid #000';
      if (type === 'all' || type === 'outer') {
        onStyleChange({
          borderTop: borderStyle,
          borderBottom: borderStyle,
          borderLeft: borderStyle,
          borderRight: borderStyle,
        });
      } else {
        onStyleChange({
          borderTop: 'none',
          borderBottom: 'none',
          borderLeft: 'none',
          borderRight: 'none',
          border: 'none',
        });
      }
    },
    [onStyleChange]
  );

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
            },
          },
          '& .MuiTabList-root': {
            padding: '4px 8px 0',
            gap: 0.5,
            borderBottom: 'none',
          },
        }}
      >
        <TabList disableUnderline>
          <Tab>{t('toolbar.tab.home')}</Tab>
          <Tab>{t('toolbar.tab.insert')}</Tab>
          <Tab>{t('toolbar.tab.draw')}</Tab>
          <Tab>{t('toolbar.tab.formulas')}</Tab>
          <Tab>{t('toolbar.tab.data')}</Tab>
          <Tab>{t('toolbar.tab.view')}</Tab>
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
                  {FONT_FAMILIES.map(font => (
                    <Option key={font} value={font}>
                      {font}
                    </Option>
                  ))}
                </Select>

                <Select
                  value={selectedCellStyle.fontSize || '13px'}
                  onChange={handleFontSizeChange}
                  size="sm"
                  variant="outlined"
                  sx={{ minWidth: 70 }}
                >
                  {FONT_SIZES.map(size => (
                    <Option key={size} value={size}>
                      {size}
                    </Option>
                  ))}
                </Select>
              </Stack>

              <Divider />

              {/* Style */}
              <Stack direction="row" spacing={0.5}>
                <Tooltip title={t('toolbar.bold')} size="sm">
                  <IconButton
                    size="sm"
                    variant={isBold ? 'solid' : 'plain'}
                    color={isBold ? 'primary' : 'neutral'}
                    onClick={toggleBold}
                  >
                    <BoldIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title={t('toolbar.italic')} size="sm">
                  <IconButton
                    size="sm"
                    variant={isItalic ? 'solid' : 'plain'}
                    color={isItalic ? 'primary' : 'neutral'}
                    onClick={toggleItalic}
                  >
                    <ItalicIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title={t('toolbar.underline')} size="sm">
                  <IconButton
                    size="sm"
                    variant={isUnderline ? 'solid' : 'plain'}
                    color={isUnderline ? 'primary' : 'neutral'}
                    onClick={toggleUnderline}
                  >
                    <UnderlineIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>

              <Divider />

              {/* Color */}
              <Stack direction="row" spacing={1} alignItems="center">
                <Tooltip title={t('toolbar.text_color')}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      border: '1px solid',
                      borderColor: 'neutral.outlinedBorder',
                      borderRadius: 'sm',
                      px: 0.5,
                      py: 0.25,
                      cursor: 'pointer',
                      position: 'relative',
                      '&:hover': { bgcolor: 'background.level1' },
                    }}
                  >
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 'bold',
                        borderBottom: `3px solid ${selectedCellStyle.color || '#000'}`,
                      }}
                    >
                      A
                    </span>
                    <Box
                      component="label"
                      sx={{ position: 'absolute', inset: 0, cursor: 'pointer' }}
                    >
                      <input
                        type="color"
                        value={selectedCellStyle.color || '#000000'}
                        onChange={handleTextColorChange}
                        style={{ width: 0, height: 0, opacity: 0 }}
                      />
                    </Box>
                  </Box>
                </Tooltip>

                <Tooltip title={t('toolbar.fill_color')}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      border: '1px solid',
                      borderColor: 'neutral.outlinedBorder',
                      borderRadius: 'sm',
                      px: 0.5,
                      py: 0.25,
                      position: 'relative',
                      '&:hover': { bgcolor: 'background.level1' },
                    }}
                  >
                    <span style={{ fontSize: '12px' }}>🎨</span>
                    <Box
                      sx={{
                        width: '100%',
                        height: '3px',
                        bgcolor: selectedCellStyle.backgroundColor || 'transparent',
                        position: 'absolute',
                        bottom: 2,
                        left: 0,
                      }}
                    />
                    <Box
                      component="label"
                      sx={{ position: 'absolute', inset: 0, cursor: 'pointer' }}
                    >
                      <input
                        type="color"
                        value={selectedCellStyle.backgroundColor || '#ffffff'}
                        onChange={handleBackgroundColorChange}
                        style={{ width: 0, height: 0, opacity: 0 }}
                      />
                    </Box>
                  </Box>
                </Tooltip>
              </Stack>

              <Divider />

              {/* Alignment */}
              <Stack direction="row" spacing={0.5}>
                <IconButton
                  size="sm"
                  variant={textAlign === 'left' ? 'solid' : 'plain'}
                  onClick={() => onStyleChange({ textAlign: 'left' })}
                >
                  <AlignLeftIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="sm"
                  variant={textAlign === 'center' ? 'solid' : 'plain'}
                  onClick={() => onStyleChange({ textAlign: 'center' })}
                >
                  <AlignCenterIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="sm"
                  variant={textAlign === 'right' ? 'solid' : 'plain'}
                  onClick={() => onStyleChange({ textAlign: 'right' })}
                >
                  <AlignRightIcon fontSize="small" />
                </IconButton>
              </Stack>

              <Divider />

              {/* Vertical Alignment */}
              <Stack direction="row" spacing={0.5}>
                <IconButton
                  size="sm"
                  variant={verticalAlign === 'top' ? 'solid' : 'plain'}
                  onClick={() => onStyleChange({ verticalAlign: 'top' })}
                >
                  <VerticalAlignTopIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="sm"
                  variant={verticalAlign === 'middle' ? 'solid' : 'plain'}
                  onClick={() => onStyleChange({ verticalAlign: 'middle' })}
                >
                  <VerticalAlignCenterIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="sm"
                  variant={verticalAlign === 'bottom' ? 'solid' : 'plain'}
                  onClick={() => onStyleChange({ verticalAlign: 'bottom' })}
                >
                  <VerticalAlignBottomIcon fontSize="small" />
                </IconButton>
              </Stack>

              <Divider />

              {/* Borders */}
              <Stack direction="row" spacing={0.5}>
                <Tooltip title={t('toolbar.borders_all')} size="sm">
                  <IconButton size="sm" variant="plain" onClick={() => applyBorder('all')}>
                    <BorderAllIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title={t('toolbar.borders_outer')} size="sm">
                  <IconButton size="sm" variant="plain" onClick={() => applyBorder('outer')}>
                    <BorderOuterIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title={t('toolbar.borders_none')} size="sm">
                  <IconButton size="sm" variant="plain" onClick={() => applyBorder('none')}>
                    <BorderClearIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>

              <Divider />

              {/* Number formats */}
              <Stack direction="row" spacing={0.5}>
                <Tooltip title={t('toolbar.currency')} size="sm">
                  <IconButton
                    size="sm"
                    variant={selectedCellStyle.numberFormat === 'currency' ? 'solid' : 'plain'}
                    color={selectedCellStyle.numberFormat === 'currency' ? 'primary' : 'neutral'}
                    onClick={() => onNumberFormat?.('currency')}
                  >
                    <Box sx={{ fontSize: '14px', fontWeight: 'bold', minWidth: 16 }}>$</Box>
                  </IconButton>
                </Tooltip>
                <Tooltip title={t('toolbar.percent')} size="sm">
                  <IconButton
                    size="sm"
                    variant={selectedCellStyle.numberFormat === 'percent' ? 'solid' : 'plain'}
                    color={selectedCellStyle.numberFormat === 'percent' ? 'primary' : 'neutral'}
                    onClick={() => onNumberFormat?.('percent')}
                  >
                    <Box sx={{ fontSize: '14px', fontWeight: 'bold', minWidth: 16 }}>%</Box>
                  </IconButton>
                </Tooltip>
                <Tooltip title={t('toolbar.comma')} size="sm">
                  <IconButton
                    size="sm"
                    variant={selectedCellStyle.numberFormat === 'comma' ? 'solid' : 'plain'}
                    color={selectedCellStyle.numberFormat === 'comma' ? 'primary' : 'neutral'}
                    onClick={() => onNumberFormat?.('comma')}
                  >
                    <Box sx={{ fontSize: '12px', fontWeight: 'bold', minWidth: 16 }}>,000</Box>
                  </IconButton>
                </Tooltip>
              </Stack>

              <Divider />

              {/* Merge cells */}
              <Stack direction="row" spacing={0.5}>
                {hasMergeAtSelection ? (
                  <Tooltip title={t('toolbar.unmerge')} size="sm">
                    <IconButton
                      size="sm"
                      variant="solid"
                      color="primary"
                      onClick={() => onUnmerge?.()}
                    >
                      <Box sx={{ fontSize: '11px', fontWeight: 'bold', minWidth: 32 }}>
                        {t('toolbar.unmerge_label')}
                      </Box>
                    </IconButton>
                  </Tooltip>
                ) : (
                  <Tooltip title={t('toolbar.merge')} size="sm">
                    <IconButton size="sm" variant="plain" onClick={() => onMerge?.()}>
                      <Box sx={{ fontSize: '11px', fontWeight: 'bold', minWidth: 32 }}>
                        {t('toolbar.merge_label')}
                      </Box>
                    </IconButton>
                  </Tooltip>
                )}
              </Stack>
            </Stack>
          )}

          {activeTab === 1 && (
            <Stack direction="row" spacing={1} alignItems="center">
              <Tooltip title={t('toolbar.table')}>
                <IconButton size="sm" variant="plain" onClick={() => onInsert?.('table')}>
                  <TableChartIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Divider />

              <Tooltip title={t('toolbar.link')}>
                <IconButton size="sm" variant="plain" onClick={() => onInsert?.('link')}>
                  <LinkIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          )}

          {activeTab === 2 && (
            <Stack direction="row" spacing={1} alignItems="center">
              <Tooltip title={t('toolbar.draw_select')}>
                <IconButton
                  size="sm"
                  variant={activeDrawTool === null ? 'solid' : 'plain'}
                  onClick={() => onDrawToolChange?.(null)}
                >
                  <DrawIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Divider />

              <Tooltip title={t('toolbar.draw_pen')}>
                <IconButton
                  size="sm"
                  variant={activeDrawTool === 'pen' ? 'solid' : 'plain'}
                  color={activeDrawTool === 'pen' ? 'primary' : 'neutral'}
                  onClick={() => onDrawToolChange?.('pen')}
                >
                  <PenIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title={t('toolbar.draw_highlighter')}>
                <IconButton
                  size="sm"
                  variant={activeDrawTool === 'highlighter' ? 'solid' : 'plain'}
                  color={activeDrawTool === 'highlighter' ? 'warning' : 'neutral'}
                  onClick={() => onDrawToolChange?.('highlighter')}
                >
                  <HighlighterIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title={t('toolbar.draw_eraser')}>
                <IconButton
                  size="sm"
                  variant={activeDrawTool === 'eraser' ? 'solid' : 'plain'}
                  onClick={() => onDrawToolChange?.('eraser')}
                >
                  <EraserIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title={t('toolbar.draw_spray')}>
                <IconButton
                  size="sm"
                  variant={activeDrawTool === 'spray' ? 'solid' : 'plain'}
                  color={activeDrawTool === 'spray' ? 'success' : 'neutral'}
                  onClick={() => onDrawToolChange?.('spray')}
                >
                  <SprayIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Divider />

              {/* Pen Color Presets */}
              <Stack direction="row" spacing={0.5} alignItems="center">
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
                      transition: 'transform 0.1s',
                    }}
                  />
                ))}
                {/* Custom color picker */}
                <Tooltip title={t('toolbar.custom_color')} size="sm">
                  <Box
                    component="label"
                    sx={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: !['#000000', '#FF0000', '#0000FF', '#008000'].includes(penColor)
                        ? 'primary.main'
                        : 'divider',
                      boxShadow: !['#000000', '#FF0000', '#0000FF', '#008000'].includes(penColor)
                        ? `0 0 0 2px rgba(0,0,0,0.2)`
                        : 'none',
                      background: !['#000000', '#FF0000', '#0000FF', '#008000'].includes(penColor)
                        ? penColor
                        : 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)',
                      '&:hover': { transform: 'scale(1.2)' },
                      transition: 'transform 0.1s',
                      display: 'block',
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                  >
                    <input
                      type="color"
                      value={penColor}
                      onChange={e => onPenColorChange?.(e.target.value)}
                      style={{ position: 'absolute', width: 0, height: 0, opacity: 0 }}
                    />
                  </Box>
                </Tooltip>
              </Stack>
            </Stack>
          )}

          {activeTab === 3 && (
            <Stack direction="row" spacing={1} alignItems="center">
              <Tooltip title={t('toolbar.insert_function')}>
                <IconButton
                  size="sm"
                  variant="plain"
                  onClick={() => onFormulaAction?.('insert_function')}
                >
                  <FunctionsIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title={t('toolbar.autosum')}>
                <IconButton size="sm" variant="plain" onClick={() => onFormulaAction?.('autosum')}>
                  <FunctionsIcon fontSize="small" sx={{ transform: 'rotate(90deg)' }} />{' '}
                  {/* Sigma approximation */}
                </IconButton>
              </Tooltip>

              <Divider />

              <Tooltip title={t('toolbar.financial')}>
                <IconButton
                  size="sm"
                  variant="plain"
                  onClick={() => onFormulaAction?.('category_financial')}
                >
                  <FinancialIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title={t('toolbar.logical')}>
                <IconButton
                  size="sm"
                  variant="plain"
                  onClick={() => onFormulaAction?.('category_logical')}
                >
                  <LogicalIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title={t('toolbar.text_category')}>
                <IconButton
                  size="sm"
                  variant="plain"
                  onClick={() => onFormulaAction?.('category_text')}
                >
                  <TextFieldsIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title={t('toolbar.date_time')}>
                <IconButton
                  size="sm"
                  variant="plain"
                  onClick={() => onFormulaAction?.('category_date')}
                >
                  <DateTimeIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title={t('toolbar.lookup')}>
                <IconButton
                  size="sm"
                  variant="plain"
                  onClick={() => onFormulaAction?.('category_lookup')}
                >
                  <LookupIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title={t('toolbar.math')}>
                <IconButton
                  size="sm"
                  variant="plain"
                  onClick={() => onFormulaAction?.('category_math')}
                >
                  <MathIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Divider />

              <Tooltip title={t('toolbar.calculate_now')}>
                <IconButton
                  size="sm"
                  variant="plain"
                  onClick={() => onFormulaAction?.('calculate')}
                >
                  <CalculateIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          )}

          {activeTab === 4 && (
            <Stack direction="row" spacing={1} alignItems="center">
              <Tooltip title={t('toolbar.sort_asc')}>
                <IconButton size="sm" variant="plain" onClick={() => onDataAction?.('sort_asc')}>
                  <SortIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title={t('toolbar.sort_desc')}>
                <IconButton size="sm" variant="plain" onClick={() => onDataAction?.('sort_desc')}>
                  <SortIcon fontSize="small" sx={{ transform: 'scaleY(-1)' }} />
                </IconButton>
              </Tooltip>
              <Divider />
              <Tooltip title={t('toolbar.filter')}>
                <IconButton
                  size="sm"
                  variant={filterActive ? 'solid' : 'plain'}
                  color={filterActive ? 'primary' : 'neutral'}
                  onClick={() => onDataAction?.('filter_toggle')}
                >
                  <FilterIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          )}

          {activeTab === 5 && (
            <Stack direction="row" spacing={1} alignItems="center">
              <Tooltip title={t('toolbar.freeze_top_row')} size="sm">
                <IconButton
                  size="sm"
                  variant={frozenRows > 0 ? 'solid' : 'plain'}
                  color={frozenRows > 0 ? 'primary' : 'neutral'}
                  onClick={() => onViewAction?.('freeze_top_row')}
                >
                  <FreezeIcon fontSize="small" />
                  <Box sx={{ ml: 0.5, fontSize: '11px' }}>{t('toolbar.freeze_top_row_label')}</Box>
                </IconButton>
              </Tooltip>
              <Tooltip title={t('toolbar.freeze_first_col')} size="sm">
                <IconButton
                  size="sm"
                  variant={frozenCols > 0 ? 'solid' : 'plain'}
                  color={frozenCols > 0 ? 'primary' : 'neutral'}
                  onClick={() => onViewAction?.('freeze_first_col')}
                >
                  <FreezeIcon fontSize="small" sx={{ transform: 'rotate(90deg)' }} />
                  <Box sx={{ ml: 0.5, fontSize: '11px' }}>
                    {t('toolbar.freeze_first_col_label')}
                  </Box>
                </IconButton>
              </Tooltip>
              {(frozenRows > 0 || frozenCols > 0) && (
                <>
                  <Divider />
                  <Tooltip title={t('toolbar.unfreeze')} size="sm">
                    <IconButton
                      size="sm"
                      variant="plain"
                      onClick={() => onViewAction?.('unfreeze')}
                    >
                      <Box sx={{ fontSize: '11px' }}>{t('toolbar.unfreeze_label')}</Box>
                    </IconButton>
                  </Tooltip>
                </>
              )}
              <Divider />
              <Tooltip title={t('toolbar.gridlines')} size="sm">
                <IconButton
                  size="sm"
                  variant={showGridlines ? 'solid' : 'plain'}
                  color={showGridlines ? 'primary' : 'neutral'}
                  onClick={() => onViewAction?.('toggle_gridlines')}
                >
                  <Box sx={{ fontSize: '11px' }}>{t('toolbar.gridlines_label')}</Box>
                </IconButton>
              </Tooltip>
            </Stack>
          )}
        </Box>
      </Tabs>
    </Box>
  );
};
