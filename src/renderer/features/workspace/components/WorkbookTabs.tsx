import React from "react";
import {
  Box,
  Tabs,
  TabList,
  Tab,
  IconButton,
} from "@mui/joy";
import CloseIcon from "@mui/icons-material/Close";
import { WorkbookTab } from "../../../types/tabs";
import { colors } from "../../../theme/tokens";

interface WorkbookTabsProps {
  openTabs: WorkbookTab[];
  activeTabId: string;
  onTabChange: (event: React.SyntheticEvent | null, value: string | number | null) => void;
  onCloseTab: (tabId: string) => void;
  tabIsDirty: (tab: WorkbookTab) => boolean;
}

const unsavedDotSx = {
  width: 6,
  height: 6,
  borderRadius: "50%",
  backgroundColor: colors.accent.orange.main,
  display: "inline-block",
  animation: "gridparkPulse 1.5s ease-in-out infinite",
  boxShadow: `0 0 8px ${colors.accent.orange.main}66`,
  "@keyframes gridparkPulse": {
    "0%": { transform: "scale(0.9)", opacity: 0.7 },
    "50%": { transform: "scale(1.2)", opacity: 1 },
    "100%": { transform: "scale(0.9)", opacity: 0.7 },
  },
};

export const WorkbookTabs: React.FC<WorkbookTabsProps> = ({
  openTabs,
  activeTabId,
  onTabChange,
  onCloseTab,
  tabIsDirty,
}) => {
  if (openTabs.length === 0) return null;

  return (
    <Tabs
      value={activeTabId}
      onChange={onTabChange}
      sx={{
        backgroundColor: "background.surface",
        borderRadius: "sm",
        boxShadow: "sm",
      }}
    >
      <TabList
        variant="soft"
        sx={{
          gap: 0.25,
          flexWrap: "nowrap",
          overflowX: "auto",
          scrollbarWidth: "thin",
          minHeight: "24px",
          "&::-webkit-scrollbar": { height: 4 },
        }}
      >
        {openTabs.map((tab) => {
          const dirty = tabIsDirty(tab);
          return (
            <Tab
              key={tab.id}
              value={tab.id}
              sx={{
                textTransform: "none",
                minHeight: "24px",
                height: "24px",
                fontWeight: 500,
                fontSize: "0.75rem",
                px: 0.75,
                py: 0,
                flexShrink: 0,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
                <span>
                  {tab.kind === "sheet"
                    ? tab.sheetName
                    : tab.kind === "manifest"
                      ? `${tab.fileName} Manifest`
                      : tab.codeFile.name}
                </span>
                {dirty && (
                  <Box
                    component="span"
                    aria-hidden="true"
                    sx={{ ...unsavedDotSx, ml: 0.25 }}
                  />
                )}
                <IconButton
                  component="span"
                  tabIndex={-1}
                  size="sm"
                  variant="plain"
                  onClick={(event) => {
                    event.stopPropagation();
                    onCloseTab(tab.id);
                  }}
                  role="button"
                  aria-label="Close tab"
                  sx={{
                    minWidth: "16px",
                    minHeight: "16px",
                    width: "16px",
                    height: "16px",
                    fontSize: "0.75rem",
                  }}
                >
                  <CloseIcon fontSize="inherit" />
                </IconButton>
              </Box>
            </Tab>
          );
        })}
      </TabList>
    </Tabs>
  );
};
