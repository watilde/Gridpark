import React, { useMemo } from 'react';
import Box from '@mui/joy/Box';
import Sheet from '@mui/joy/Sheet';
import Typography from '@mui/joy/Typography';
import IconButton from '@mui/joy/IconButton';
import AddIcon from '@mui/icons-material/Add';
import { useTheme } from '@mui/joy/styles';
import { FileTree, FileNode } from '../../features/file-explorer/FileTree';

interface SidebarExplorerProps {
  workbookNodes: FileNode[];
  searchQuery: string;
  selectedNodeId: string;
  onNodeSelect: (node: FileNode) => void;
  dirtyNodeIds: Record<string, boolean>;
  title?: string;
  onFileCreate?: () => void;
}

export const SidebarExplorer: React.FC<SidebarExplorerProps> = ({
  workbookNodes,
  searchQuery,
  selectedNodeId,
  onNodeSelect,
  dirtyNodeIds,
  title = 'Explore',
  onFileCreate,
}) => {
  const theme = useTheme();

  // Filter nodes based on search query
  const filteredTreeNodes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return workbookNodes;
    }
    const filterNode = (node: FileNode): FileNode | null => {
      const nameMatches = node.name.toLowerCase().includes(query);
      if (nameMatches) {
        return node;
      }
      if (node.children && node.children.length > 0) {
        const filteredChildren = node.children
          .map(filterNode)
          .filter((child): child is FileNode => Boolean(child));
        if (filteredChildren.length > 0) {
          return {
            ...node,
            children: filteredChildren,
          };
        }
      }
      return null;
    };
    return workbookNodes.map(filterNode).filter((node): node is FileNode => Boolean(node));
  }, [searchQuery, workbookNodes]);

  const isFiltering = Boolean(searchQuery.trim());
  const displayNodes = isFiltering ? filteredTreeNodes : workbookNodes;
  const noMatches = isFiltering && filteredTreeNodes.length === 0;

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: theme.palette.background.surface,
      }}
    >
      {onFileCreate && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            px: 1,
            py: 0.5,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <IconButton
            size="sm"
            variant="plain"
            color="neutral"
            onClick={onFileCreate}
            aria-label="New File"
            title="New File"
            sx={{ minWidth: 'auto', minHeight: 'auto' }}
          >
            <AddIcon fontSize="small" />
          </IconButton>
        </Box>
      )}
      {workbookNodes.length > 0 && (
        <>
          <FileTree
            files={displayNodes}
            selectedNodeId={selectedNodeId}
            onNodeSelect={onNodeSelect}
            title={title}
            dirtyNodeIds={dirtyNodeIds}
            fullHeight
          />
          {noMatches && (
            <Sheet
              variant="plain"
              sx={{
                p: 2,
                borderTop: '1px solid',
                borderColor: 'divider',
                color: 'text.secondary',
                backgroundColor: 'transparent',
              }}
            >
              <Typography level="body-sm">No files match "{searchQuery.trim()}"</Typography>
            </Sheet>
          )}
        </>
      )}
    </Box>
  );
};
