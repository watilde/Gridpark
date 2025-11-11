import React, { useState } from 'react';
import { styled } from '@mui/joy/styles';
import { Box, Typography, Sheet, IconButton } from '@mui/joy';
import FolderIcon from '@mui/icons-material/Folder';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { ExcelFile } from '../../../types/excel';

const TreeContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1),
  height: '100%',
  overflow: 'auto',
}));

const TreeItem = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'depth' && prop !== 'selected',
})<{ depth: number; selected?: boolean }>(({ theme, depth, selected }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: `${theme.spacing(0.5)} ${theme.spacing(1)}`,
  paddingLeft: `${theme.spacing(1 + depth * 2)}`,
  cursor: 'pointer',
  borderRadius: theme.radius.sm,
  backgroundColor: selected ? theme.palette.primary.softBg : 'transparent',
  color: selected ? theme.palette.primary.plainColor : theme.palette.text.primary,
  transition: 'background-color 0.2s',
  '&:hover': {
    backgroundColor: selected 
      ? theme.palette.primary.softBg 
      : theme.palette.neutral.softHoverBg,
  },
}));

const ItemIcon = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginRight: theme.spacing(1),
  color: 'inherit',
}));

const ItemLabel = styled(Typography)({
  flex: 1,
  fontSize: '0.875rem',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  file?: ExcelFile;
}

export interface FileTreeProps {
  files: FileNode[];
  selectedFileId?: string;
  onFileSelect?: (node: FileNode) => void;
}

interface TreeNodeProps {
  node: FileNode;
  depth: number;
  selectedFileId?: string;
  onFileSelect?: (node: FileNode) => void;
}

const TreeNode: React.FC<TreeNodeProps> = ({ node, depth, selectedFileId, onFileSelect }) => {
  const [expanded, setExpanded] = useState(true);
  const isFolder = node.type === 'folder';
  const hasChildren = isFolder && node.children && node.children.length > 0;
  const isSelected = node.id === selectedFileId;

  const handleClick = () => {
    if (isFolder) {
      setExpanded(!expanded);
    } else {
      onFileSelect?.(node);
    }
  };

  return (
    <>
      <TreeItem depth={depth} selected={isSelected} onClick={handleClick}>
        {hasChildren && (
          <IconButton
            size="sm"
            variant="plain"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            sx={{ minWidth: 'auto', minHeight: 'auto', p: 0, mr: 0.5 }}
          >
            {expanded ? <ExpandMoreIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
          </IconButton>
        )}
        <ItemIcon>
          {isFolder ? (
            expanded ? <FolderOpenIcon fontSize="small" /> : <FolderIcon fontSize="small" />
          ) : (
            <InsertDriveFileIcon fontSize="small" />
          )}
        </ItemIcon>
        <ItemLabel>{node.name}</ItemLabel>
      </TreeItem>
      {hasChildren && expanded && (
        <Box>
          {node.children!.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedFileId={selectedFileId}
              onFileSelect={onFileSelect}
            />
          ))}
        </Box>
      )}
    </>
  );
};

/**
 * FileTree Component
 * 
 * Displays a hierarchical file tree for Excel files
 */
export const FileTree: React.FC<FileTreeProps> = ({ files, selectedFileId, onFileSelect }) => {
  return (
    <Sheet
      variant="outlined"
      sx={{
        height: '100%',
        borderRadius: 'sm',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography level="title-md">Files</Typography>
      </Box>
      <TreeContainer>
        {files.map((node) => (
          <TreeNode
            key={node.id}
            node={node}
            depth={0}
            selectedFileId={selectedFileId}
            onFileSelect={onFileSelect}
          />
        ))}
      </TreeContainer>
    </Sheet>
  );
};

FileTree.displayName = 'GridparkFileTree';
