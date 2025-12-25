/**
 * Excel View Sidebar Component
 * 
 * VSCode-inspired file explorer for Excel files and sheets
 * Features:
 * - Workbook file tree
 * - Sheet navigation within workbooks
 * - Recent files list
 * - Create/Open file actions
 */

import React, { useState } from 'react';
import { styled } from '@mui/joy/styles';
import { Box, Typography, IconButton, Tooltip } from '@mui/joy';
import {
  Folder,
  InsertDriveFile,
  TableChart,
  Add,
  MoreVert,
  ExpandMore,
  ChevronRight,
  History,
  Star,
  StarBorder,
} from '@mui/icons-material';

// ============================================================================
// Types
// ============================================================================

export interface ExcelFile {
  id: string;
  name: string;
  path: string;
  starred?: boolean;
  sheets: ExcelSheet[];
  lastOpened?: Date;
}

export interface ExcelSheet {
  id: string;
  name: string;
  index: number;
  active?: boolean;
}

export interface ExcelViewSidebarProps {
  files: ExcelFile[];
  activeFileId?: string;
  activeSheetId?: string;
  onFileSelect?: (fileId: string) => void;
  onSheetSelect?: (fileId: string, sheetId: string) => void;
  onFileCreate?: () => void;
  onFileOpen?: () => void;
  onFileStar?: (fileId: string, starred: boolean) => void;
  className?: string;
}

// ============================================================================
// Styled Components (VSCode Style)
// ============================================================================

const SidebarContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  height: '100%',
  backgroundColor: theme.palette.mode === 'dark' ? '#252526' : '#f3f3f3',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
}));

const SidebarHeader = styled(Box)(({ theme }) => ({
  padding: '8px 16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderBottom: `1px solid ${theme.palette.mode === 'dark' ? '#454545' : '#d0d0d0'}`,
  minHeight: '35px',
  backgroundColor: theme.palette.mode === 'dark' ? '#252526' : '#f3f3f3',
}));

const SidebarTitle = styled(Typography)(({ theme }) => ({
  fontSize: '11px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  color: theme.palette.mode === 'dark' ? '#cccccc' : '#6e6e6e',
  userSelect: 'none',
}));

const ActionButtons = styled(Box)({
  display: 'flex',
  gap: '4px',
});

const HeaderIconButton = styled(IconButton)(({ theme }) => ({
  minWidth: '20px',
  minHeight: '20px',
  padding: '2px',
  borderRadius: '4px',
  color: theme.palette.mode === 'dark' ? '#cccccc' : '#6e6e6e',
  
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark' 
      ? 'rgba(255, 255, 255, 0.05)' 
      : 'rgba(0, 0, 0, 0.05)',
  },
  
  '& svg': {
    fontSize: '16px',
  },
}));

const SidebarContent = styled(Box)({
  flex: 1,
  overflowY: 'auto',
  overflowX: 'hidden',
  
  '&::-webkit-scrollbar': {
    width: '10px',
  },
  
  '&::-webkit-scrollbar-track': {
    backgroundColor: 'transparent',
  },
  
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: 'rgba(128, 128, 128, 0.3)',
    borderRadius: '5px',
    
    '&:hover': {
      backgroundColor: 'rgba(128, 128, 128, 0.5)',
    },
  },
});

const Section = styled(Box)({
  marginBottom: '16px',
});

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontSize: '11px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  color: theme.palette.mode === 'dark' ? '#969696' : '#6e6e6e',
  padding: '8px 16px 4px 16px',
  userSelect: 'none',
}));

interface TreeItemProps {
  active?: boolean;
  level?: number;
  hasChildren?: boolean;
}

const TreeItem = styled(Box)<TreeItemProps>(({ theme, active, level = 0, hasChildren }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: '4px 8px 4px ' + (8 + level * 16) + 'px',
  minHeight: '22px',
  cursor: 'pointer',
  userSelect: 'none',
  position: 'relative',
  backgroundColor: active
    ? theme.palette.mode === 'dark'
      ? 'rgba(14, 99, 156, 0.3)'
      : 'rgba(0, 102, 191, 0.1)'
    : 'transparent',
  
  '&:hover': {
    backgroundColor: active
      ? theme.palette.mode === 'dark'
        ? 'rgba(14, 99, 156, 0.4)'
        : 'rgba(0, 102, 191, 0.15)'
      : theme.palette.mode === 'dark'
        ? 'rgba(255, 255, 255, 0.05)'
        : 'rgba(0, 0, 0, 0.05)',
  },
  
  '&:active': {
    backgroundColor: theme.palette.mode === 'dark'
      ? 'rgba(14, 99, 156, 0.5)'
      : 'rgba(0, 102, 191, 0.2)',
  },
}));

const ExpandIcon = styled(Box)(({ theme }) => ({
  width: '16px',
  height: '16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: '4px',
  color: theme.palette.mode === 'dark' ? '#cccccc' : '#6e6e6e',
  flexShrink: 0,
  
  '& svg': {
    fontSize: '16px',
  },
}));

const ItemIcon = styled(Box)(({ theme }) => ({
  width: '16px',
  height: '16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: '6px',
  color: theme.palette.mode === 'dark' ? '#cccccc' : '#6e6e6e',
  flexShrink: 0,
  
  '& svg': {
    fontSize: '16px',
  },
}));

const ItemLabel = styled(Typography)(({ theme }) => ({
  fontSize: '13px',
  color: theme.palette.mode === 'dark' ? '#cccccc' : '#000000',
  flex: 1,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}));

const ItemActions = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '2px',
  marginLeft: '4px',
  opacity: 0,
  
  '.tree-item:hover &': {
    opacity: 1,
  },
});

const ItemActionButton = styled(IconButton)(({ theme }) => ({
  minWidth: '16px',
  minHeight: '16px',
  padding: '2px',
  borderRadius: '3px',
  color: theme.palette.mode === 'dark' ? '#cccccc' : '#6e6e6e',
  
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark' 
      ? 'rgba(255, 255, 255, 0.1)' 
      : 'rgba(0, 0, 0, 0.1)',
  },
  
  '& svg': {
    fontSize: '14px',
  },
}));

// ============================================================================
// Component
// ============================================================================

export const ExcelViewSidebar: React.FC<ExcelViewSidebarProps> = ({
  files,
  activeFileId,
  activeSheetId,
  onFileSelect,
  onSheetSelect,
  onFileCreate,
  onFileOpen,
  onFileStar,
  className,
}) => {
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(
    new Set(files.map(f => f.id))
  );

  const toggleFileExpand = (fileId: string) => {
    const newExpanded = new Set(expandedFiles);
    if (newExpanded.has(fileId)) {
      newExpanded.delete(fileId);
    } else {
      newExpanded.add(fileId);
    }
    setExpandedFiles(newExpanded);
  };

  const handleFileClick = (fileId: string) => {
    if (onFileSelect) {
      onFileSelect(fileId);
    }
  };

  const handleSheetClick = (fileId: string, sheetId: string) => {
    if (onSheetSelect) {
      onSheetSelect(fileId, sheetId);
    }
  };

  const handleStarClick = (e: React.MouseEvent, fileId: string, starred: boolean) => {
    e.stopPropagation();
    if (onFileStar) {
      onFileStar(fileId, !starred);
    }
  };

  // Sort files: starred first, then by last opened
  const sortedFiles = [...files].sort((a, b) => {
    if (a.starred && !b.starred) return -1;
    if (!a.starred && b.starred) return 1;
    if (a.lastOpened && b.lastOpened) {
      return b.lastOpened.getTime() - a.lastOpened.getTime();
    }
    return 0;
  });

  const recentFiles = sortedFiles.filter(f => f.lastOpened).slice(0, 5);

  return (
    <SidebarContainer className={className}>
      {/* Header */}
      <SidebarHeader>
        <SidebarTitle>Explorer</SidebarTitle>
        <ActionButtons>
          <Tooltip title="New File" placement="bottom">
            <HeaderIconButton onClick={onFileCreate} aria-label="New File">
              <Add />
            </HeaderIconButton>
          </Tooltip>
          <Tooltip title="Open File" placement="bottom">
            <HeaderIconButton onClick={onFileOpen} aria-label="Open File">
              <InsertDriveFile />
            </HeaderIconButton>
          </Tooltip>
          <Tooltip title="More Actions" placement="bottom">
            <HeaderIconButton aria-label="More Actions">
              <MoreVert />
            </HeaderIconButton>
          </Tooltip>
        </ActionButtons>
      </SidebarHeader>

      {/* Content */}
      <SidebarContent>
        {/* Recent Files Section */}
        {recentFiles.length > 0 && (
          <Section>
            <SectionTitle>Recent Files</SectionTitle>
            {recentFiles.map(file => (
              <TreeItem
                key={`recent-${file.id}`}
                className="tree-item"
                active={activeFileId === file.id}
                onClick={() => handleFileClick(file.id)}
              >
                <ItemIcon>
                  <History />
                </ItemIcon>
                <ItemLabel>{file.name}</ItemLabel>
                <ItemActions>
                  <ItemActionButton
                    onClick={(e) => handleStarClick(e, file.id, file.starred || false)}
                    aria-label={file.starred ? "Unstar" : "Star"}
                  >
                    {file.starred ? <Star /> : <StarBorder />}
                  </ItemActionButton>
                </ItemActions>
              </TreeItem>
            ))}
          </Section>
        )}

        {/* All Workbooks Section */}
        <Section>
          <SectionTitle>Workbooks</SectionTitle>
          {sortedFiles.map(file => {
            const isExpanded = expandedFiles.has(file.id);
            const isActive = activeFileId === file.id;

            return (
              <Box key={file.id}>
                {/* File Item */}
                <TreeItem
                  className="tree-item"
                  active={isActive && !activeSheetId}
                  hasChildren
                  onClick={() => {
                    handleFileClick(file.id);
                    toggleFileExpand(file.id);
                  }}
                >
                  <ExpandIcon onClick={(e) => {
                    e.stopPropagation();
                    toggleFileExpand(file.id);
                  }}>
                    {isExpanded ? <ExpandMore /> : <ChevronRight />}
                  </ExpandIcon>
                  <ItemIcon>
                    <InsertDriveFile />
                  </ItemIcon>
                  <ItemLabel>{file.name}</ItemLabel>
                  <ItemActions>
                    <ItemActionButton
                      onClick={(e) => handleStarClick(e, file.id, file.starred || false)}
                      aria-label={file.starred ? "Unstar" : "Star"}
                    >
                      {file.starred ? <Star /> : <StarBorder />}
                    </ItemActionButton>
                  </ItemActions>
                </TreeItem>

                {/* Sheet Items (when expanded) */}
                {isExpanded && file.sheets.map(sheet => (
                  <TreeItem
                    key={sheet.id}
                    className="tree-item"
                    level={1}
                    active={isActive && activeSheetId === sheet.id}
                    onClick={() => handleSheetClick(file.id, sheet.id)}
                  >
                    <ExpandIcon /> {/* Spacer */}
                    <ItemIcon>
                      <TableChart />
                    </ItemIcon>
                    <ItemLabel>{sheet.name}</ItemLabel>
                  </TreeItem>
                ))}
              </Box>
            );
          })}
        </Section>
      </SidebarContent>
    </SidebarContainer>
  );
};

ExcelViewSidebar.displayName = 'ExcelViewSidebar';
</TreeItem>
                ))}
              </Box>
            );
          })}
        </Section>
      </SidebarContent>
    </SidebarContainer>
  );
};

ExcelViewSidebar.displayName = 'ExcelViewSidebar';
