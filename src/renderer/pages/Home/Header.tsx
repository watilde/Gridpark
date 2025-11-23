import React from "react";
import { Box, IconButton, Input, Stack } from "@mui/joy";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import SearchIcon from "@mui/icons-material/Search";
import SettingsIcon from "@mui/icons-material/SettingsOutlined";

interface HeaderProps {
  onBack: () => void;
  onProceed: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onBack,
  onProceed,
  searchQuery,
  onSearchChange,
  onOpenSettings,
}) => {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1, width: "100%" }}>
      <Box sx={{ display: "flex", alignItems: "center", width: "100%", gap: 2 }}>
        <Stack direction="row" spacing={0.5}>
          <IconButton
            size="sm"
            variant="plain"
            color="neutral"
            onClick={onBack}
            aria-label="Go back"
          >
            <ArrowBackIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="sm"
            variant="plain"
            color="neutral"
            onClick={onProceed}
            aria-label="Go forward"
          >
            <ArrowForwardIcon fontSize="small" />
          </IconButton>
        </Stack>
        <Input
          placeholder="Search files or sheets"
          size="sm"
          startDecorator={<SearchIcon fontSize="small" />}
          variant="soft"
          color="neutral"
          sx={{ flex: 1, minWidth: 200 }}
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
        />
        <IconButton
          size="sm"
          variant="outlined"
          color="neutral"
          onClick={onOpenSettings}
          aria-label="Open settings"
        >
          <SettingsIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
};
