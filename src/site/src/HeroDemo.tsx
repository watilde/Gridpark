import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type SyntheticEvent,
} from "react";
import {
  Box,
  Tabs,
  TabList,
  Tab,
  IconButton,
  Input,
  Stack,
  Sheet,
} from "@mui/joy";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import SettingsIcon from "@mui/icons-material/SettingsOutlined";
import { AppLayout } from "@renderer/components/layout/AppLayout";
import { FileTree, type FileNode } from "@renderer/features/file-explorer/FileTree";
import {
  ExcelViewer,
  type SheetSessionState,
} from "@renderer/features/workbook/components/ExcelViewer";
import { CodeEditorPanel } from "@renderer/features/code-editor/CodeEditorPanel";
import type { GridparkCodeFile } from "@renderer/types/excel";
import {
  demoWorkbook,
  demoFileNodes,
  codeContents,
} from "./demoData";
import { registerCodeContent } from "./mockElectron";

type SheetDemoTab = {
  kind: "sheet";
  id: string;
  label: string;
  sheetIndex: number;
};

type CodeDemoTab = {
  kind: "code";
  id: string;
  label: string;
  codeFile: GridparkCodeFile;
};

type DemoTab = SheetDemoTab | CodeDemoTab;

const flattenNodes = (nodes: FileNode[]): FileNode[] =>
  nodes.flatMap((node) => [
    node,
    ...(node.children ? flattenNodes(node.children) : []),
  ]);

const demoFlatNodes = flattenNodes(demoFileNodes);
const filterTreeByName = (nodes: FileNode[], term: string): FileNode[] => {
  if (!term.trim()) return nodes;
  const lower = term.toLowerCase();

  const walk = (items: FileNode[]): FileNode[] => {
    return items
      .map((item) => {
        const children = item.children ? walk(item.children) : [];
        const matches = item.name.toLowerCase().includes(lower) || children.length > 0;
        if (!matches) return null;
        return {
          ...item,
          children: children.length ? children : item.children,
        };
      })
      .filter((item): item is FileNode => Boolean(item));
  };

  return walk(nodes);
};
const sheetTabsCatalog: SheetDemoTab[] = demoFlatNodes
  .filter(
    (node): node is FileNode & { sheetIndex: number } =>
      node.type === "sheet" && typeof node.sheetIndex === "number",
  )
  .map((node) => ({
    kind: "sheet",
    id: node.id,
    label: node.name,
    sheetIndex: node.sheetIndex!,
  }));
const codeTabsCatalog: CodeDemoTab[] = demoFlatNodes
  .filter(
    (node): node is FileNode & { codeFile: GridparkCodeFile } =>
      node.type === "code" && Boolean(node.codeFile),
  )
  .map((node) => ({
    kind: "code",
    id: node.id,
    label: node.name,
    codeFile: node.codeFile!,
  }));
const tabCatalog: Record<string, DemoTab> = [...sheetTabsCatalog, ...codeTabsCatalog].reduce(
  (acc, tab) => {
    acc[tab.id] = tab;
    return acc;
  },
  {} as Record<string, DemoTab>,
);
const walkSheetTab = sheetTabsCatalog.find((tab) => tab.label === "Walk_Data");
const walkSheetCodeMainTab = codeTabsCatalog.find(
  (tab): tab is CodeDemoTab =>
    tab.kind === "code" &&
    tab.codeFile.sheetName === "Walk_Data" &&
    tab.codeFile.role === "main",
);
const walkSheetCodeStyleTab = codeTabsCatalog.find(
  (tab): tab is CodeDemoTab =>
    tab.kind === "code" &&
    tab.codeFile.sheetName === "Walk_Data" &&
    tab.codeFile.role === "style",
);

const defaultTabs: DemoTab[] = [
  walkSheetTab,
  walkSheetCodeMainTab,
  walkSheetCodeStyleTab,
].filter(Boolean) as DemoTab[];

const unsavedDotSx = {
  width: 6,
  height: 6,
  borderRadius: "50%",
  backgroundColor: "#f7b731",
  display: "inline-flex",
  boxShadow: "0 0 6px rgba(247, 183, 49, 0.8)",
};

export const HeroDemo = () => {
  useEffect(() => {
    registerCodeContent(
      demoWorkbook.gridparkPackage?.files ?? [],
      codeContents,
    );
  }, []);

  const [openTabs, setOpenTabs] = useState<DemoTab[]>(
    defaultTabs.length ? defaultTabs : sheetTabsCatalog.slice(0, 1),
  );
  const [activeTabId, setActiveTabId] = useState(
    defaultTabs[0]?.id ?? sheetTabsCatalog[0]?.id ?? "",
  );
  const [selectedNodeId, setSelectedNodeId] = useState(
    defaultTabs[0]?.id ?? sheetTabsCatalog[0]?.id ?? "",
  );
  const [sheetSessions, setSheetSessions] = useState<
    Record<string, SheetSessionState | undefined>
  >({});
  const [sheetDirty, setSheetDirty] = useState<Record<string, boolean>>({});
  const [codeDirty, setCodeDirty] = useState<Record<string, boolean>>({});
  const [codeContentState, setCodeContentState] = useState<
    Record<string, string>
  >(() => ({ ...codeContents }));
  const [searchTerm, setSearchTerm] = useState("");

  const activeTab = useMemo(
    () => openTabs.find((tab) => tab.id === activeTabId),
    [activeTabId, openTabs],
  );

  const dirtyNodeIds = useMemo(
    () => ({ ...sheetDirty, ...codeDirty }),
    [sheetDirty, codeDirty],
  );

  const activateTab = useCallback((tab: DemoTab) => {
    setOpenTabs((prev) => {
      if (prev.some((existing) => existing.id === tab.id)) {
        return prev;
      }
      return [...prev, tab];
    });
    setActiveTabId(tab.id);
    setSelectedNodeId(tab.id);
  }, []);

  const handleNodeSelect = useCallback(
    (node: FileNode) => {
      setSelectedNodeId(node.id);
      const tab = tabCatalog[node.id];
      if (tab) {
        activateTab(tab);
      }
    },
    [activateTab],
  );

  const handleCloseTab = useCallback(
    (tabId: string) => {
      setOpenTabs((prev) => {
        if (prev.length <= 1) return prev;
        const nextTabs = prev.filter((tab) => tab.id !== tabId);
        if (!nextTabs.length) {
          return prev;
        }
        if (activeTabId === tabId) {
          const fallback = nextTabs[nextTabs.length - 1]?.id ?? nextTabs[0].id;
          setActiveTabId(fallback);
          setSelectedNodeId(fallback);
        }
        return nextTabs;
      });
    },
    [activeTabId],
  );

  const handleTabChange = useCallback(
    (_event: SyntheticEvent | null, value: string | number | null) => {
      if (!value) return;
      const id = String(value);
      setActiveTabId(id);
      setSelectedNodeId(id);
    },
    [],
  );

  const handleSheetDirtyChange = useCallback((tabId: string, dirty: boolean) => {
    setSheetDirty((prev) => ({
      ...prev,
      [tabId]: dirty,
    }));
  }, []);

  const handleSheetSave = useCallback((tabId: string, session: SheetSessionState) => {
    setSheetSessions((prev) => ({
      ...prev,
      [tabId]: session,
    }));
  }, []);

  const handleCodeChange = useCallback((tab: CodeDemoTab, value: string) => {
    console.log('[HeroDemo] handleCodeChange called', {
      tabId: tab.id,
      codeFileId: tab.codeFile.id,
      absolutePath: tab.codeFile.absolutePath,
      valueLength: value.length,
    });
    setCodeContentState((prev) => ({
      ...prev,
      [tab.codeFile.absolutePath]: value,
    }));
    setCodeDirty((prev) => ({
      ...prev,
      [tab.id]: true,
    }));
  }, []);

  const handleCodeSave = useCallback(
    async (tab: CodeDemoTab) => {
      const latestContent = codeContentState[tab.codeFile.absolutePath] ?? "";
      await window.electronAPI?.gridpark?.writeFile?.({
        path: tab.codeFile.absolutePath,
        rootDir: tab.codeFile.rootDir,
        content: latestContent,
      });
      setCodeDirty((prev) => ({
        ...prev,
        [tab.id]: false,
      }));
    },
    [codeContentState],
  );

  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.currentTarget.value);
  }, []);

  const handlePrevTab = useCallback(() => {
    if (openTabs.length < 2) return;
    const currentIndex = openTabs.findIndex((tab) => tab.id === activeTabId);
    if (currentIndex === -1) return;
    const prevIndex = (currentIndex - 1 + openTabs.length) % openTabs.length;
    const tab = openTabs[prevIndex];
    setActiveTabId(tab.id);
    setSelectedNodeId(tab.id);
  }, [activeTabId, openTabs]);

  const handleNextTab = useCallback(() => {
    if (openTabs.length < 2) return;
    const currentIndex = openTabs.findIndex((tab) => tab.id === activeTabId);
    if (currentIndex === -1) return;
    const nextIndex = (currentIndex + 1) % openTabs.length;
    const tab = openTabs[nextIndex];
    setActiveTabId(tab.id);
    setSelectedNodeId(tab.id);
  }, [activeTabId, openTabs]);

  const filteredTreeNodes = useMemo(
    () => (searchTerm ? filterTreeByName(demoFileNodes, searchTerm) : demoFileNodes),
    [searchTerm],
  );

  const activeContent = useMemo(() => {
    console.log('[HeroDemo] activeContent recalculating', {
      activeTab,
      activeTabId: activeTab?.id,
      codeDirty: activeTab?.kind === 'code' ? codeDirty[activeTab.id] : undefined,
    });

    if (!activeTab) {
      return (
        <Box
          sx={{
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "neutral.500",
          }}
        >
          Select a sheet or file to preview
        </Box>
      );
    }

    if (activeTab.kind === "sheet") {
      return (
        <ExcelViewer
          file={demoWorkbook}
          sheetIndex={activeTab.sheetIndex}
          sessionState={sheetSessions[activeTab.id]}
          onSaveSession={(state) => handleSheetSave(activeTab.id, state)}
          onDirtyChange={(dirty) => handleSheetDirtyChange(activeTab.id, dirty)}
        />
      );
    }

    const codeContent =
      codeContentState[activeTab.codeFile.absolutePath] ?? "";

    console.log('[HeroDemo] Rendering CodeEditorPanel', {
      tabId: activeTab.id,
      isDirty: Boolean(codeDirty[activeTab.id]),
      contentLength: codeContent.length,
    });

    return (
      <CodeEditorPanel
        codeFile={activeTab.codeFile}
        content={codeContent}
        loading={false}
        saving={false}
        isDirty={Boolean(codeDirty[activeTab.id])}
        onChange={(value) => handleCodeChange(activeTab, value)}
        onSave={() => handleCodeSave(activeTab)}
        onCloseTab={() => handleCloseTab(activeTab.id)}
      />
    );
  }, [
    activeTab,
    handleSheetSave,
    codeContentState,
    codeDirty,
    handleCodeChange,
    handleCodeSave,
    handleCloseTab,
    handleSheetDirtyChange,
    sheetSessions,
  ]);

  const headerControls = (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
      <Stack direction="row" spacing={0.5}>
        <IconButton
          size="sm"
          variant="plain"
          color="neutral"
          aria-label="Go back"
          onClick={handlePrevTab}
        >
          <ArrowBackIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="sm"
          variant="plain"
          color="neutral"
          aria-label="Go forward"
          onClick={handleNextTab}
        >
          <ArrowForwardIcon fontSize="small" />
        </IconButton>
      </Stack>
      <Input
        size="sm"
        startDecorator={<SearchIcon fontSize="small" />}
        placeholder="Search files or sheets"
        sx={{ flex: 1, minWidth: 160 }}
        value={searchTerm}
        onChange={handleSearchChange}
        type="search"
      />
      <IconButton
        size="sm"
        variant="outlined"
        color="neutral"
        aria-label="Open settings"
      >
        <SettingsIcon fontSize="small" />
      </IconButton>
    </Box>
  );

  return (
    <Box className="demo-shell">
      <AppLayout
        className="demo-app-layout"
        fullHeight={false}
        header={headerControls}
        sidebar={
          <FileTree
            files={filteredTreeNodes}
            title="Files"
            selectedNodeId={selectedNodeId}
            onNodeSelect={handleNodeSelect}
            fullHeight
            dirtyNodeIds={dirtyNodeIds}
          />
        }
        hideFooter
      >
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
          {openTabs.length > 0 && (
            <Tabs
              value={activeTabId}
              onChange={handleTabChange}
              sx={{
                backgroundColor: "background.surface",
                borderRadius: "sm",
                boxShadow: "sm",
                px: 1,
                py: 0.5,
              }}
            >
              <TabList
                variant="soft"
                sx={{
                  gap: 0.5,
                  flexWrap: "nowrap",
                  overflowX: "auto",
                  scrollbarWidth: "thin",
                  width: "100%",
                  "&::-webkit-scrollbar": { height: 4 },
                }}
              >
                {openTabs.map((tab) => {
                  const tabIsDirty =
                    tab.kind === "sheet"
                      ? sheetDirty[tab.id]
                      : codeDirty[tab.id];
                  return (
                    <Tab
                      key={tab.id}
                      value={tab.id}
                      sx={{
                        textTransform: "none",
                        minHeight: "28px",
                        fontWeight: 500,
                        fontSize: "0.85rem",
                        px: 1,
                        flexShrink: 0,
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <span>{tab.label}</span>
                        {tabIsDirty && <Box component="span" sx={unsavedDotSx} />}
                        <IconButton
                          component="span"
                          tabIndex={-1}
                          size="sm"
                          variant="plain"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleCloseTab(tab.id);
                          }}
                          role="button"
                          aria-label={`Close ${tab.label}`}
                        >
                          <CloseIcon fontSize="inherit" />
                        </IconButton>
                      </Box>
                    </Tab>
                  );
                })}
              </TabList>
            </Tabs>
          )}
          <Sheet
            variant="outlined"
            sx={{
              flex: 1,
              minHeight: 0,
              borderRadius: "sm",
              overflow: "hidden",
              backgroundColor: "background.level1",
            }}
          >
            {activeContent}
          </Sheet>
        </Box>
      </AppLayout>
    </Box>
  );
};
