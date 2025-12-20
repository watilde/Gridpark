import React, { useState } from 'react';
import { styled } from '@mui/joy/styles';
import Box from '@mui/joy/Box';
import Typography from '@mui/joy/Typography';
import IconButton from '@mui/joy/IconButton';
import Sheet from '@mui/joy/Sheet';
import FolderIcon from '@mui/icons-material/Folder';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import TableChartIcon from '@mui/icons-material/TableChart';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { ExcelFile } from '../../../types/excel';

const TreeContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1),
  height: '100%',
  overflow: 'auto',
}));

const TreeItem = styled(Box, {
  shouldForwardProp: prop => prop !== 'depth' && prop !== 'selected',
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
    backgroundColor: selected ? theme.palette.primary.softBg : theme.palette.neutral.softHoverBg,
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
  display: 'flex',
  alignItems: 'center',
  gap: 6,
});

const DirtyDot = styled('span')(({ theme }) => ({
  width: 6,
  height: 6,
  borderRadius: '50%',
  backgroundColor: theme.palette.warning[400],
  display: 'inline-block',
  animation: 'gridparkPulse 1.5s ease-in-out infinite',
  boxShadow: `0 0 8px ${theme.palette.warning[400]}55`,
  '@keyframes gridparkPulse': {
    '0%': { transform: 'scale(0.9)', opacity: 0.6 },
    '50%': { transform: 'scale(1.2)', opacity: 1 },
    '100%': { transform: 'scale(0.9)', opacity: 0.6 },
  },
}));

export interface FileNode {
  id: string;
  name: string;
  type: 'folder' | 'workbook' | 'sheet';
  parentId?: string;
  workbookId?: string;
  sheetIndex?: number;
  children?: FileNode[];
  file?: ExcelFile;
}

export interface FileTreeProps {
  files: FileNode[];
  selectedNodeId?: string;
  onNodeSelect?: (node: FileNode) => void;
  title?: string;
  fullHeight?: boolean;
  dirtyNodeIds?: Record<string, boolean>;
}

interface TreeNodeProps {
  node: FileNode;
  depth: number;
  selectedNodeId?: string;
  onNodeSelect?: (node: FileNode) => void;
  dirtyNodeIds?: Record<string, boolean>;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  depth,
  selectedNodeId,
  onNodeSelect,
  dirtyNodeIds,
}) => {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = Boolean(node.children && node.children.length > 0);
  const isSelected = node.id === selectedNodeId;
  const isSelectable = node.type !== 'folder';
  const isDirty = Boolean(dirtyNodeIds?.[node.id]);

  const handleClick = () => {
    if (isSelectable) {
      onNodeSelect?.(node);
    } else if (hasChildren) {
      setExpanded(!expanded);
    }
  };

  return (
    <>
      <TreeItem depth={depth} selected={isSelected} onClick={handleClick}>
        {hasChildren && (
          <IconButton
            size="sm"
            variant="plain"
            onClick={e => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            sx={{ minWidth: 'auto', minHeight: 'auto', p: 0, mr: 0.5 }}
          >
            {expanded ? <ExpandMoreIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
          </IconButton>
        )}
        <ItemIcon>
          {node.type === 'folder' ? (
            expanded ? (
              <FolderOpenIcon fontSize="small" />
            ) : (
              <FolderIcon fontSize="small" />
            )
          ) : node.type === 'sheet' ? (
            <TableChartIcon fontSize="small" />
          ) : (
            <InsertDriveFileIcon fontSize="small" />
          )}
        </ItemIcon>
        <ItemLabel>
          <span>{node.name}</span>
          {isDirty && <DirtyDot aria-hidden="true" />}
        </ItemLabel>
      </TreeItem>
      {hasChildren && expanded && (
        <Box>
          {node.children!.map(child => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedNodeId={selectedNodeId}
              onNodeSelect={onNodeSelect}
              dirtyNodeIds={dirtyNodeIds}
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
export const FileTree: React.FC<FileTreeProps> = ({
  files,
  selectedNodeId,
  onNodeSelect,
  title,
  fullHeight = true,
  dirtyNodeIds,
}) => {
  return (
    <Sheet
      variant="plain"
      sx={{
        height: fullHeight ? '100%' : 'auto',
        borderRadius: 0,
        overflow: 'hidden',
      }}
    >
      {title && (
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography level="title-md">{title}</Typography>
        </Box>
      )}
      <TreeContainer>
        {files.map(node => (
          <TreeNode
            key={node.id}
            node={node}
            depth={0}
            selectedNodeId={selectedNodeId}
            onNodeSelect={onNodeSelect}
            dirtyNodeIds={dirtyNodeIds}
          />
        ))}
      </TreeContainer>
    </Sheet>
  );
};

FileTree.displayName = 'GridparkFileTree';
