import React, { useState } from "react";
import { styled } from "@mui/joy/styles";
import {
  Undo as UndoIcon,
  Redo as RedoIcon,
  Save as SaveIcon,
  Search as SearchIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";
import iconImage from '../../../assets/icon.png';

interface HeaderProps {
  onUndo?: () => void;
  onRedo?: () => void;
  onSave?: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onOpenSettings: () => void;
  autoSaveEnabled?: boolean;
  onAutoSaveToggle?: (enabled: boolean) => void;
  canUndo?: boolean;
  canRedo?: boolean;
  hasUnsavedChanges?: boolean;
}

// Excel-style header container
const HeaderContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  height: '48px',
  padding: '0 16px',
  backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#f3f3f3',
  borderBottom: `1px solid ${theme.palette.mode === 'dark' ? '#333' : '#d0d0d0'}`,
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
    backgroundColor: theme.palette.mode === 'dark' ? '#333' : '#e5e5e5',
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
  color: theme.palette.mode === 'dark' ? '#cccccc' : '#555555',
  fontSize: '13px',
  fontFamily: theme.fontFamily.body,
  cursor: 'pointer',
  borderRadius: '4px',
  transition: 'background-color 0.15s ease',
  whiteSpace: 'nowrap',
  position: 'relative',
  
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark' ? '#333' : '#e5e5e5',
  },
  
  '&::before': {
    content: '""',
    display: 'block',
    width: '32px',
    height: '16px',
    backgroundColor: enabled ? '#107c41' : theme.palette.mode === 'dark' ? '#555' : '#999',
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
const ActionButton = styled('button')<{ disabled?: boolean; active?: boolean }>(({ theme, disabled, active }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '32px',
  height: '32px',
  padding: 0,
  border: 'none',
  backgroundColor: active ? (theme.palette.mode === 'dark' ? '#107c4122' : '#107c4111') : 'transparent',
  color: disabled 
    ? (theme.palette.mode === 'dark' ? '#555' : '#aaa')
    : active 
    ? '#107c41'
    : (theme.palette.mode === 'dark' ? '#cccccc' : '#555555'),
  cursor: disabled ? 'not-allowed' : 'pointer',
  borderRadius: '4px',
  transition: 'all 0.15s ease',
  opacity: disabled ? 0.4 : 1,
  
  '&:hover': {
    backgroundColor: disabled 
      ? 'transparent' 
      : active
      ? (theme.palette.mode === 'dark' ? '#107c4133' : '#107c4122')
      : (theme.palette.mode === 'dark' ? '#333' : '#e5e5e5'),
  },
  
  '& svg': {
    fontSize: '18px',
  },
}));

// Search input container
const SearchContainer = styled('div')({
  width: '100%',
  display: 'flex',
  alignItems: 'center',
});

// Search input field
const SearchInput = styled('input')(({ theme }) => ({
  width: '100%',
  height: '32px',
  padding: '0 12px 0 36px',
  border: `1px solid ${theme.palette.mode === 'dark' ? '#555' : '#d0d0d0'}`,
  borderRadius: '4px',
  backgroundColor: theme.palette.mode === 'dark' ? '#252525' : '#ffffff',
  color: theme.palette.mode === 'dark' ? '#d4d4d4' : '#000000',
  fontSize: '13px',
  fontFamily: theme.fontFamily.body,
  outline: 'none',
  transition: 'border-color 0.15s ease',
  
  '&::placeholder': {
    color: theme.palette.mode === 'dark' ? '#666' : '#999',
  },
  
  '&:focus': {
    borderColor: theme.palette.mode === 'dark' ? '#107c41' : '#107c41',
  },
}));

// Search icon overlay
const SearchIconOverlay = styled('div')(({ theme }) => ({
  position: 'absolute',
  left: '12px',
  top: '50%',
  transform: 'translateY(-50%)',
  color: theme.palette.mode === 'dark' ? '#999' : '#666',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  
  '& svg': {
    fontSize: '16px',
  },
}));

// Settings button (gear icon)
const SettingsButton = styled('button')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '32px',
  height: '32px',
  padding: 0,
  border: 'none',
  backgroundColor: 'transparent',
  color: theme.palette.mode === 'dark' ? '#cccccc' : '#555555',
  cursor: 'pointer',
  borderRadius: '4px',
  transition: 'background-color 0.15s ease',
  
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark' ? '#333' : '#e5e5e5',
  },
  
  '& svg': {
    fontSize: '20px',
  },
}));

/**
 * Excel-Style WorkspaceHeader Component
 * 
 * Minimalist header bar matching Excel's design:
 * - Left: Gridpark icon, AutoSave toggle, Save button, Undo, Redo
 * - Center: Search bar spanning across columns
 * - Right: Settings/user icon
 * - Dark theme optimized with icon-based interface
 */
export const WorkspaceHeader: React.FC<HeaderProps> = ({
  onUndo,
  onRedo,
  onSave,
  searchQuery,
  onSearchChange,
  onOpenSettings,
  autoSaveEnabled = false,
  onAutoSaveToggle,
  canUndo = false,
  canRedo = false,
  hasUnsavedChanges = false,
}) => {
  const [localAutoSave, setLocalAutoSave] = useState(autoSaveEnabled);



  const handleAutoSaveToggle = () => {
    const newValue = !localAutoSave;
    setLocalAutoSave(newValue);
    onAutoSaveToggle?.(newValue);
  };

  return (
    <HeaderContainer>
      <LeftSection>
        <AppIconButton
          onClick={() => console.log('Gridpark icon clicked')}
          title="Gridpark"
        >
          <img src={iconImage} alt="Gridpark" />
        </AppIconButton>
        
        <AutoSaveToggle
          enabled={localAutoSave}
          onClick={handleAutoSaveToggle}
          title={`AutoSave: ${localAutoSave ? 'On' : 'Off'}`}
        >
          AutoSave
        </AutoSaveToggle>
        
        <ActionButton
          onClick={() => {
            console.log('[WorkspaceHeader] Save button clicked', { hasUnsavedChanges });
            onSave?.();
          }}
          disabled={!hasUnsavedChanges}
          active={hasUnsavedChanges}
          title={hasUnsavedChanges ? "Save (Ctrl+S)" : "No changes to save"}
        >
          <SaveIcon />
        </ActionButton>
        
        <ActionButton
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Cmd+Z)"
        >
          <UndoIcon />
        </ActionButton>
        
        <ActionButton
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Cmd+Shift+Z)"
        >
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
            placeholder="検索"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            spellCheck={false}
            autoComplete="off"
          />
        </SearchContainer>
      </CenterSection>
      
      <RightSection>
        <SettingsButton
          onClick={onOpenSettings}
          title="Settings"
        >
          <SettingsIcon />
        </SettingsButton>
      </RightSection>
    </HeaderContainer>
  );
};
