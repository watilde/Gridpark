import React, { useMemo } from 'react';
import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import Sheet from '@mui/joy/Sheet';
import Typography from '@mui/joy/Typography';
import { useTheme } from '@mui/joy/styles';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import { FileTree, FileNode } from '../../features/file-explorer/FileTree';
import { useT } from '../../i18n/I18nProvider';

interface SidebarExplorerProps {
  workbookNodes: FileNode[];
  searchQuery: string;
  selectedNodeId: string;
  onNodeSelect: (node: FileNode) => void;
  dirtyNodeIds: Record<string, boolean>;
  title?: string;
  onOpenFile?: () => void;
}

export const SidebarExplorer: React.FC<SidebarExplorerProps> = ({
  workbookNodes,
  searchQuery,
  selectedNodeId,
  onNodeSelect,
  dirtyNodeIds,
  title,
  onOpenFile,
}) => {
  const theme = useTheme();
  const t = useT();
  const resolvedTitle = title ?? t('sidebar.explore');

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

  if (workbookNodes.length === 0) {
    return (
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: theme.palette.background.surface,
        }}
      >
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography level="title-md">{resolvedTitle}</Typography>
        </Box>
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            p: 3,
          }}
        >
          <FolderOpenIcon sx={{ fontSize: 40, color: 'text.tertiary', opacity: 0.5 }} />
          <Typography level="body-sm" textAlign="center" textColor="text.secondary">
            {t('sidebar.open_file_hint')}
          </Typography>
          <Button
            size="sm"
            variant="outlined"
            color="neutral"
            startDecorator={<FolderOpenIcon />}
            onClick={onOpenFile}
          >
            {t('sidebar.open_file')}
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: theme.palette.background.surface,
      }}
    >
      <FileTree
        files={displayNodes}
        selectedNodeId={selectedNodeId}
        onNodeSelect={onNodeSelect}
        title={resolvedTitle}
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
          <Typography level="body-sm">
            {t('sidebar.no_files_match', { query: searchQuery.trim() })}
          </Typography>
        </Sheet>
      )}
    </Box>
  );
};
