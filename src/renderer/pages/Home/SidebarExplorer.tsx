import React, { useMemo } from "react";
import { Box, Sheet, Typography } from "@mui/joy";
import { FileTree, FileNode } from "../../features/FileTree/FileTree";

interface SidebarExplorerProps {
  workbookNodes: FileNode[];
  searchQuery: string;
  selectedNodeId: string;
  onNodeSelect: (node: FileNode) => void;
  dirtyNodeIds: Record<string, boolean>;
  title?: string;
}

export const SidebarExplorer: React.FC<SidebarExplorerProps> = ({
  workbookNodes,
  searchQuery,
  selectedNodeId,
  onNodeSelect,
  dirtyNodeIds,
  title = "Explore",
}) => {
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
    return workbookNodes
      .map(filterNode)
      .filter((node): node is FileNode => Boolean(node));
  }, [searchQuery, workbookNodes]);

  const isFiltering = Boolean(searchQuery.trim());
  const displayNodes = isFiltering ? filteredTreeNodes : workbookNodes;
  const noMatches = isFiltering && filteredTreeNodes.length === 0;

  if (workbookNodes.length === 0) {
    return null;
  }

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
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
            borderTop: "1px solid",
            borderColor: "divider",
            color: "text.secondary",
          }}
        >
          <Typography level="body-sm">
            No files match "{searchQuery.trim()}"
          </Typography>
        </Sheet>
      )}
    </Box>
  );
};
