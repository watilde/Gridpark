import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Box,
  Typography,
  Stack,
  Input,
  Button,
  Sheet,
} from "@mui/joy";
import { useFormulaBar } from "../../hooks/useFormulaBar";

interface FormulaBarUIProps {
  formulaBarState: ReturnType<typeof useFormulaBar>;
}

export const FormulaBar: React.FC<FormulaBarUIProps> = ({ formulaBarState }) => {
  const {
    activeCellAddress,
    formulaBarValue,
    handleFormulaInputChange,
    handleFormulaKeyDown,
    formulaBarDisabled,
    formulaMenuOpen,
    setFormulaMenuOpen,
    formulaSearchQuery,
    setFormulaSearchQuery,
    formulaMenuPosition,
    setFormulaMenuPosition,
    formulaInputRef,
    formulaBarContainerRef,
    formulaSearchInputRef,
    filteredFormulaOptions,
    handleFormulaFxToggle,
    handleFormulaOptionSelect,
  } = formulaBarState;

  useEffect(() => {
    if (!formulaMenuOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!formulaBarContainerRef.current?.contains(event.target as Node)) {
        setFormulaMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setFormulaMenuOpen(false);
      }
    };
    const updatePosition = () => {
      const anchor = formulaBarContainerRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      setFormulaMenuPosition({
        top: rect.bottom + 8,
        left: rect.left,
        width: Math.min(rect.width, 420),
      });
    };
    updatePosition();
    const resizeObserver = new ResizeObserver(updatePosition);
    if (formulaBarContainerRef.current) {
      resizeObserver.observe(formulaBarContainerRef.current);
    }
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    requestAnimationFrame(() => {
      formulaSearchInputRef.current?.focus();
    });
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
      resizeObserver.disconnect();
    };
  }, [formulaMenuOpen, formulaBarContainerRef, setFormulaMenuOpen, setFormulaMenuPosition, formulaSearchInputRef]);

  return (
    <Box
      ref={formulaBarContainerRef}
      sx={{
        position: "relative",
        width: "100%",
        overflow: "visible",
        zIndex: 1200,
      }}
    >
      <Sheet
        variant="plain"
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          p: 1,
          borderRadius: "sm",
          backgroundColor: "background.surface",
        }}
      >
        <Box sx={{ minWidth: 120 }}>
          <Input
            variant="soft"
            size="sm"
            value={activeCellAddress || "--"}
            disabled
            sx={{ minWidth: 120 }}
          />
        </Box>
        <Button
          size="sm"
          variant="soft"
          color="neutral"
          onClick={handleFormulaFxToggle}
          aria-haspopup="menu"
          aria-expanded={formulaMenuOpen}
          sx={{
            fontWeight: 700,
            px: 1,
            minWidth: 40,
          }}
        >
          fx
        </Button>
        <Input
          variant="soft"
          size="sm"
          placeholder="Enter value or formula"
          value={formulaBarValue}
          onChange={handleFormulaInputChange}
          onKeyDown={handleFormulaKeyDown}
          disabled={formulaBarDisabled}
          ref={formulaInputRef}
          sx={{ flex: 1 }}
        />
      </Sheet>
      {formulaMenuOpen && formulaMenuPosition &&
        createPortal(
          <Sheet
            role="menu"
            variant="outlined"
            sx={{
              position: "fixed",
              top: formulaMenuPosition.top,
              left: formulaMenuPosition.left,
              width: formulaMenuPosition.width,
              maxWidth: "95vw",
              borderRadius: "sm",
              boxShadow: "lg",
              zIndex: 1600,
              p: 1,
              maxHeight: 420,
              bgcolor: "background.surface",
              display: "flex",
              flexDirection: "column",
              gap: 0.75,
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                overflowY: "auto",
                pr: 0.5,
                flex: 1,
                minHeight: 160,
              }}
            >
              <Stack spacing={0.75}>
                <Box
                  sx={{
                    position: "sticky",
                    top: 0,
                    zIndex: 2,
                    backgroundColor: "background.surface",
                    pt: 0.25,
                    pb: 0.75,
                  }}
                >
                  <Input
                    size="sm"
                    placeholder="Search functions"
                    value={formulaSearchQuery}
                    onChange={(event) => setFormulaSearchQuery(event.target.value)}
                    ref={formulaSearchInputRef}
                    variant="soft"
                    color="neutral"
                    sx={{ borderRadius: "xl" }}
                  />
                </Box>
                {filteredFormulaOptions.map(({ category, items }) => (
                  <Box key={category} role="group" aria-label={category}>
                    <Typography
                      level="body-xs"
                      sx={{
                        textTransform: "uppercase",
                        fontWeight: 700,
                        mb: 0.25,
                      }}
                    >
                      {category}
                    </Typography>
                    <Stack spacing={0.5}>
                      {items.map((option) => (
                        <Button
                          key={option.label}
                          variant="soft"
                          size="sm"
                          onClick={() => handleFormulaOptionSelect(option)}
                          role="menuitem"
                          sx={{
                            justifyContent: "flex-start",
                            textAlign: "left",
                            alignItems: "flex-start",
                            whiteSpace: "normal",
                          }}
                        >
                          <Box sx={{ display: "flex", flexDirection: "column" }}>
                            <Typography level="body-sm" sx={{ fontWeight: 700 }}>
                              {option.label}
                            </Typography>
                            <Typography
                              level="body-xs"
                              sx={{ color: "text.secondary" }}
                            >
                              {option.description}
                            </Typography>
                            <Typography
                              level="body-xs"
                              sx={{
                                color: "success.600",
                                fontFamily: "monospace",
                                mt: 0.5,
                              }}
                            >
                              {option.template}
                            </Typography>
                          </Box>
                        </Button>
                      ))}
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </Box>
          </Sheet>,
          document.body,
        )}
    </Box>
  );
};
