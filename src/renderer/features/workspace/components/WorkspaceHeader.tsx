import React, { useState, useRef, useEffect } from 'react';
import { styled } from '@mui/joy/styles';
import {
  Undo as UndoIcon,
  Redo as RedoIcon,
  Save as SaveIcon,
  Search as SearchIcon,
  SaveAs as ExportIcon,
  Publish as ImportIcon,
} from '@mui/icons-material';
import iconImage from '../../../assets/icon.png';

interface HeaderProps {
  onUndo?: () => void;
  onRedo?: () => void;
  onSave?: () => void;
  onSaveAs?: (format?: string) => void;
  onImport?: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onOpenSettings: () => void;
  autoSaveEnabled?: boolean;
  onAutoSaveToggle?: (enabled: boolean) => void;
  canUndo?: boolean;
  canRedo?: boolean;
  hasUnsavedChanges?: boolean;
  disabled?: boolean;
}

// Excel-style header container
const HeaderContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  height: '48px',
  padding: '0 16px',
  backgroundColor: theme.palette.background.surface,
  borderBottom: `1px solid ${theme.palette.divider}`,
  borderTop: `2px solid ${theme.palette.primary.outlinedColor}`,
  gap: '16px',
}));

// Left section with app icon and controls
const LeftSection = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
});

// Center section with search bar
const CenterSection = styled('div')({
  flex: 1,
  display: 'flex',
  justifyContent: 'center',
  maxWidth: '600px',
  margin: '0 auto',
});

// Right section with settings
const RightSection = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
});

// App icon button
const AppIconButton = styled('button')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '32px',
  height: '32px',
  padding: '4px',
  border: 'none',
  backgroundColor: 'transparent',
  cursor: 'pointer',
  borderRadius: '4px',
  transition: 'background-color 0.15s ease',

  '&:hover': {
    backgroundColor: theme.palette.background.level1,
  },

  '& img': {
    width: '24px',
    height: '24px',
    objectFit: 'contain',
  },
}));

// AutoSave toggle button
const AutoSaveToggle = styled('button')<{ enabled: boolean }>(({ theme, enabled }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '4px 8px',
  border: 'none',
  backgroundColor: 'transparent',
  color: theme.palette.text.secondary,
  fontSize: '13px',
  fontFamily: theme.fontFamily.body,
  cursor: 'pointer',
  borderRadius: '4px',
  transition: 'background-color 0.15s ease',
  whiteSpace: 'nowrap',
  position: 'relative',

  '&:hover': {
    backgroundColor: theme.palette.background.level1,
  },

  '&:disabled': {
    cursor: 'not-allowed',
    opacity: 0.5,
    '&:hover': {
      backgroundColor: 'transparent',
    },
  },

  '&::before': {
    content: '""',
    display: 'block',
    width: '32px',
    height: '16px',
    backgroundColor: enabled ? theme.palette.success[500] : theme.palette.neutral[500],
    borderRadius: '8px',
    transition: 'background-color 0.2s ease',
    flexShrink: 0,
  },

  '&::after': {
    content: '""',
    display: 'block',
    width: '12px',
    height: '12px',
    backgroundColor: '#ffffff',
    borderRadius: '50%',
    position: 'absolute',
    left: enabled ? '28px' : '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    transition: 'left 0.2s ease',
    pointerEvents: 'none',
  },
}));

// Action button (Save, Undo, Redo)
const ActionButton = styled('button')<{ disabled?: boolean; active?: boolean }>(
  ({ theme, disabled, active }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    padding: 0,
    border: 'none',
    backgroundColor: active ? `${theme.palette.primary.outlinedColor}22` : 'transparent',
    color: disabled
      ? theme.palette.text.tertiary
      : active
        ? theme.palette.primary.outlinedColor
        : theme.palette.text.secondary,
    cursor: disabled ? 'not-allowed' : 'pointer',
    borderRadius: '6px',
    transition: 'all 0.15s ease',
    opacity: disabled ? 0.38 : 1,

    '&:hover': {
      backgroundColor: disabled
        ? 'transparent'
        : active
          ? `${theme.palette.primary.outlinedColor}33`
          : theme.palette.background.level1,
      color: disabled ? undefined : active ? theme.palette.primary.outlinedColor : theme.palette.text.primary,
    },

    '& svg': {
      fontSize: '18px',
    },
  })
);

// Search input container
const SearchContainer = styled('div')({
  width: '100%',
  display: 'flex',
  alignItems: 'center',
});

// Search input field
const SearchInput = styled('input')(({ theme }) => ({
  width: '100%',
  height: '30px',
  padding: '0 12px 0 36px',
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: '6px',
  backgroundColor: theme.palette.background.body,
  color: theme.palette.text.primary,
  fontSize: '13px',
  fontFamily: theme.fontFamily.body,
  outline: 'none',
  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',

  '&::placeholder': {
    color: theme.palette.text.tertiary,
  },

  '&:focus': {
    borderColor: theme.palette.primary.outlinedColor,
    boxShadow: `0 0 0 2px ${theme.palette.primary.outlinedColor}22`,
  },

  '&:disabled': {
    backgroundColor: theme.palette.background.level1,
    color: theme.palette.text.tertiary,
    cursor: 'not-allowed',
  },
}));

// Search icon overlay
const SearchIconOverlay = styled('div')(({ theme }) => ({
  position: 'absolute',
  left: '12px',
  top: '50%',
  transform: 'translateY(-50%)',
  color: theme.palette.text.tertiary,
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',

  '& svg': {
    fontSize: '16px',
  },
}));

const ExportMenu = styled('div')(({ theme }) => ({
  position: 'absolute',
  right: 0,
  top: 'calc(100% + 4px)',
  zIndex: 10000,
  backgroundColor: theme.palette.background.surface,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: '8px',
  boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
  minWidth: '220px',
  padding: '4px 0',
  overflow: 'hidden',
}));

const ExportMenuItem = styled('button')(({ theme }) => ({
  display: 'block',
  width: '100%',
  padding: '8px 16px',
  border: 'none',
  background: 'none',
  color: theme.palette.text.primary,
  fontSize: '13px',
  fontFamily: theme.fontFamily.body,
  cursor: 'pointer',
  textAlign: 'left',
  '&:hover': { backgroundColor: theme.palette.background.level1 },
}));

/**
 * Excel-Style WorkspaceHeader Component
 *
 * Minimalist header bar matching Excel's design:
 * - Left: Gridpark icon, AutoSave toggle, Save button, Undo, Redo
 * - Center: Search bar spanning across columns
 * - Right: Export (Save As)
 * - Dark theme optimized with icon-based interface
 */
export const WorkspaceHeader: React.FC<HeaderProps> = ({
  onUndo,
  onRedo,
  onSave,
  onSaveAs,
  onImport,
  searchQuery,
  onSearchChange,
  onOpenSettings,
  autoSaveEnabled = false,
  onAutoSaveToggle,
  canUndo = false,
  canRedo = false,
  hasUnsavedChanges = false,
  disabled = false,
}) => {
  const [localAutoSave, setLocalAutoSave] = useState(autoSaveEnabled);
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!exportOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [exportOpen]);

  const handleAutoSaveToggle = () => {
    if (disabled) return;
    const newValue = !localAutoSave;
    setLocalAutoSave(newValue);
    onAutoSaveToggle?.(newValue);
  };

  return (
    <HeaderContainer>
      <LeftSection>
        <AppIconButton onClick={() => console.log('Gridpark icon clicked')} title="Gridpark">
          <img src={iconImage} alt="Gridpark" />
        </AppIconButton>

        <AutoSaveToggle
          enabled={localAutoSave}
          onClick={handleAutoSaveToggle}
          title={`AutoSave: ${localAutoSave ? 'On' : 'Off'}`}
          disabled={disabled}
        >
          AutoSave
        </AutoSaveToggle>

        <ActionButton
          onClick={onImport}
          title="Import (.xlsx, .csv, .gridpark)"
          disabled={disabled}
        >
          <ImportIcon />
        </ActionButton>

        <ActionButton
          onClick={() => {
            console.log('[WorkspaceHeader] Save button clicked', { hasUnsavedChanges });
            onSave?.();
          }}
          disabled={disabled || !hasUnsavedChanges}
          active={hasUnsavedChanges}
          title={hasUnsavedChanges ? 'Save (Ctrl+S)' : 'No changes to save'}
        >
          <SaveIcon />
        </ActionButton>

        <ActionButton onClick={onUndo} disabled={disabled || !canUndo} title="Undo (Cmd+Z)">
          <UndoIcon />
        </ActionButton>

        <ActionButton onClick={onRedo} disabled={disabled || !canRedo} title="Redo (Cmd+Shift+Z)">
          <RedoIcon />
        </ActionButton>
      </LeftSection>

      <CenterSection>
        <SearchContainer style={{ position: 'relative' }}>
          <SearchIconOverlay>
            <SearchIcon />
          </SearchIconOverlay>
          <SearchInput
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            spellCheck={false}
            autoComplete="off"
            disabled={disabled}
          />
        </SearchContainer>
      </CenterSection>

      <RightSection>
        <div ref={exportRef} style={{ position: 'relative' }}>
          <ActionButton
            title="Export (Save As)"
            disabled={disabled}
            onClick={() => setExportOpen(prev => !prev)}
          >
            <ExportIcon />
          </ActionButton>
          {exportOpen && (
            <ExportMenu>
              <ExportMenuItem onClick={() => { onSaveAs?.('xlsx'); setExportOpen(false); }}>
                Excel Workbook (.xlsx)
              </ExportMenuItem>
              <ExportMenuItem onClick={() => { onSaveAs?.('csv'); setExportOpen(false); }}>
                Comma Separated Values (.csv)
              </ExportMenuItem>
              <ExportMenuItem onClick={() => { onSaveAs?.('gridpark'); setExportOpen(false); }}>
                Gridpark Project (.gridpark)
              </ExportMenuItem>
            </ExportMenu>
          )}
        </div>
      </RightSection>
    </HeaderContainer>
  );
};
