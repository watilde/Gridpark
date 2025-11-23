import React from "react";
import { Sheet, Typography, Drawer, Divider, Box, Select, Option } from "@mui/joy";
import { themeOptions } from "../../theme/ThemeProvider";
import type { ThemePresetId } from "../../theme/theme";
import { useSettings } from "../../hooks/useSettings";

interface SettingsDrawerProps {
  settings: ReturnType<typeof useSettings>;
}

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({ settings }) => {
  const {
    presetId,
    setPresetId,
    settingsOpen,
    setSettingsOpen,
  } = settings;

  return (
    <Drawer
      anchor="right"
      open={settingsOpen}
      onClose={() => setSettingsOpen(false)}
      size="md"
      sx={{ "& .MuiDrawer-paper": { borderRadius: 0, maxWidth: 360 } }}
    >
      <Sheet
        sx={{
          p: 3,
          display: "flex",
          flexDirection: "column",
          gap: 2,
          height: "100%",
        }}
      >
        <Typography level="title-lg">Settings</Typography>
        <Divider />
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Typography level="title-sm">Theme</Typography>
          <Select
            size="sm"
            value={presetId}
            onChange={(_event, value) => {
              if (value && typeof value === "string") {
                setPresetId(value as ThemePresetId);
              }
            }}
          >
            {themeOptions.map((option) => (
              <Option key={option.id} value={option.id}>
                {option.name}
              </Option>
            ))}
          </Select>
        </Box>
      </Sheet>
    </Drawer>
  );
};
