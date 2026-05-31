import React, { useMemo, useState } from 'react';
import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import Input from '@mui/joy/Input';
import Sheet from '@mui/joy/Sheet';
import Typography from '@mui/joy/Typography';
import { useTheme } from '@mui/joy/styles';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import SearchIcon from '@mui/icons-material/Search';
import { FileTree, FileNode } from '../../features/file-explorer/FileTree';
import { useT } from '../../i18n/I18nProvider';

interface SidebarExplorerProps {
  workbookNodes: FileNode[];
  searchQuery?: string; // kept for API compat but not used
  selectedNodeId: string;
  onNodeSelect: (node: FileNode) => void;
  dirtyNodeIds: Record<string, boolean>;
  title?: string;
  onOpenFile?: () => void;
}

export const SidebarExplorer: React.FC<SidebarExplorerProps> = ({
  workbookNodes,
  selectedNodeId,
  onNodeSelect,
  dirtyNodeIds,
  onOpenFile,
}) => {
  const theme = useTheme();
  const t = useT();
  const [query, setQuery] = useState('');

  const filteredNodes = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return workbookNodes;
    const filter = (node: FileNode): FileNode | null => {
      if (node.name.toLowerCase().includes(q)) return node;
      if (node.children?.length) {
        const children = node.children.map(filter).filter((n): n is FileNode => n !== null);
        if (children.length) return { ...node, children };
      }
      return null;
    };
    return workbookNodes.map(filter).filter((n): n is FileNode => n !== null);
  }, [query, workbookNodes]);

  const noMatches = query.trim() !== '' && filteredNodes.length === 0;

  const searchBar = (
    <Box sx={{ padding: '14px 14px 13px 13px', borderBottom: '1px solid', borderColor: 'divider' }}>
      <Input
        size="sm"
        placeholder={t('sidebar.explore')}
        value={query}
        onChange={e => setQuery(e.target.value)}
        startDecorator={<SearchIcon sx={{ fontSize: 16 }} />}
        sx={{ '--Input-focusedThickness': '1px' }}
      />
    </Box>
  );

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
        {searchBar}
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
      {searchBar}
      <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        <FileTree
          files={filteredNodes}
          selectedNodeId={selectedNodeId}
          onNodeSelect={onNodeSelect}
          dirtyNodeIds={dirtyNodeIds}
          fullHeight={false}
        />
        {noMatches && (
          <Sheet
            variant="plain"
            sx={{ p: 2, color: 'text.secondary', backgroundColor: 'transparent' }}
          >
            <Typography level="body-sm">
              {t('sidebar.no_files_match', { query: query.trim() })}
            </Typography>
          </Sheet>
        )}
      </Box>
    </Box>
  );
};
