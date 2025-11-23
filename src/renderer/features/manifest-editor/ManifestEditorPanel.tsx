import React, { useMemo } from 'react';
import {
  Sheet,
  Box,
  Typography,
  Stack,
  Input,
  Textarea,
  Button,
  IconButton,
  Chip,
  Alert,
  Select,
  Option,
  Switch,
  Checkbox,
  CircularProgress,
  FormControl,
  FormLabel,
} from '@mui/joy';
import SaveIcon from '@mui/icons-material/Save';
import RefreshIcon from '@mui/icons-material/Refresh';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ShieldIcon from '@mui/icons-material/Shield';
import { GridparkManifest } from '../../../../types/excel';

const runtimeOptions = [
  { value: 'worker', label: 'Worker Threads' },
  { value: 'timer', label: 'Timers' },
];

type PlatformPermissions = {
  platform: 'electron' | 'web';
  canAccessFileSystem: boolean;
  canWorkOffline: boolean;
  hasNativeMenus: boolean;
  canManageWindows: boolean;
  hasSystemIntegration: boolean;
  canAutoUpdate: boolean;
  hasNativeNotifications: boolean;
  canAccessClipboard: boolean;
};

export interface ManifestEditorPanelProps {
  manifest: GridparkManifest;
  loading: boolean;
  saving: boolean;
  isDirty: boolean;
  error?: string;
  editable: boolean;
  platformCapabilities: PlatformPermissions;
  onChange: (next: GridparkManifest) => void;
  onSave: () => void;
  onReload: () => void;
}

export const ManifestEditorPanel: React.FC<ManifestEditorPanelProps> = ({
  manifest,
  loading,
  saving,
  isDirty,
  error,
  editable,
  platformCapabilities,
  onChange,
  onSave,
  onReload,
}) => {
  const permissions = manifest.permissions ?? {
    filesystem: 'workbook',
    network: false,
    runtime: [],
  };

  const runtimeSet = useMemo(() => new Set(permissions.runtime ?? []), [permissions.runtime]);
  const readOnlyPlatform = !editable;
  const disableInputs = loading || saving;
  const isElectron = platformCapabilities.platform === 'electron';

  const updateManifest = (next: Partial<GridparkManifest>) => {
    onChange({ ...manifest, ...next });
  };

  const updatePermissions = (next: typeof permissions) => {
    onChange({
      ...manifest,
      permissions: next,
    });
  };

  const handleRuntimeToggle = (value: string, checked: boolean) => {
    const updatedRuntime = new Set(runtimeSet);
    if (checked) {
      updatedRuntime.add(value);
    } else {
      updatedRuntime.delete(value);
    }
    updatePermissions({
      ...permissions,
      runtime: Array.from(updatedRuntime),
    });
  };

  if (loading && !isDirty) {
    return (
      <Sheet
        variant="outlined"
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
        }}
      >
        <CircularProgress size="sm" />
        <Typography level="body-sm" sx={{ color: 'neutral.500' }}>
          Loading manifest…
        </Typography>
      </Sheet>
    );
  }

  return (
    <Sheet
      variant="outlined"
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        p: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ flex: 1, minWidth: 220 }}>
          <Typography level="title-lg" sx={{ fontWeight: 600 }}>
            Workbook Manifest
          </Typography>
          <Typography level="body-sm" sx={{ color: 'neutral.500' }}>
            Configure workbook metadata, entry points, and permissions.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          {isDirty && (
            <Chip size="sm" variant="soft" color="warning">
              Unsaved changes
            </Chip>
          )}
          {readOnlyPlatform && (
            <Chip size="sm" variant="outlined" color="neutral" startDecorator={<InfoOutlinedIcon fontSize="small" />}>
              Desktop save required
            </Chip>
          )}
          <Button
            size="sm"
            startDecorator={<SaveIcon fontSize="small" />}
            onClick={onSave}
            disabled={!isDirty || disableInputs || readOnlyPlatform}
            loading={saving}
          >
            Save Manifest
          </Button>
          <IconButton
            size="sm"
            variant="outlined"
            color="neutral"
            onClick={onReload}
            disabled={loading || saving || readOnlyPlatform}
            aria-label="Reload manifest"
          >
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Box>

  {error && (
    <Alert variant="soft" color="danger">
      {error}
    </Alert>
  )}

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          alignItems: 'stretch',
        }}
      >
        <Stack
          direction={{ xs: 'column', lg: 'row' }}
          spacing={2}
          sx={{ minHeight: 0, flexShrink: 0 }}
        >
          <Sheet
            variant="outlined"
            sx={{
              p: 2,
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
            }}
          >
            <Typography level="title-md">Metadata</Typography>
            <FormControl size="sm">
              <FormLabel>Name</FormLabel>
              <Input
                value={manifest.name}
                onChange={(event) => updateManifest({ name: event.target.value })}
                disabled={disableInputs}
              />
            </FormControl>
            <FormControl size="sm">
              <FormLabel>Version</FormLabel>
              <Input
                value={manifest.version}
                onChange={(event) => updateManifest({ version: event.target.value })}
                disabled={disableInputs}
              />
            </FormControl>
            <FormControl size="sm">
              <FormLabel>API Version</FormLabel>
              <Input
                type="number"
                value={manifest.apiVersion ?? ''}
                onChange={(event) => updateManifest({ apiVersion: Number(event.target.value) || undefined })}
                disabled={disableInputs}
              />
            </FormControl>
            <FormControl size="sm">
              <FormLabel>Description</FormLabel>
              <Textarea
                minRows={3}
                value={manifest.description ?? ''}
                onChange={(event) => updateManifest({ description: event.target.value })}
                disabled={disableInputs}
              />
            </FormControl>
          </Sheet>

          <Sheet
            variant="outlined"
            sx={{
              p: 2,
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
            }}
          >
            <Typography level="title-md">Entry Points & Permissions</Typography>
            <FormControl size="sm">
              <FormLabel>Script</FormLabel>
              <Input
                value={manifest.main ?? ''}
                onChange={(event) => updateManifest({ main: event.target.value })}
                disabled={disableInputs}
              />
            </FormControl>
            <FormControl size="sm">
              <FormLabel>Stylesheet</FormLabel>
              <Input
                value={manifest.style ?? ''}
                onChange={(event) => updateManifest({ style: event.target.value })}
                disabled={disableInputs}
              />
            </FormControl>
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                <Typography level="body-sm" sx={{ fontWeight: 600 }}>
                  Permissions
                </Typography>
                <Chip
                  size="sm"
                  variant="soft"
                  color={isElectron ? 'success' : 'neutral'}
                  startDecorator={<ShieldIcon fontSize="small" />}
                >
                  {isElectron ? 'Electron Runtime' : 'Web Preview'}
                </Chip>
              </Stack>
              <Stack spacing={1.5}>
                <FormControl size="sm">
                  <FormLabel>Filesystem Scope</FormLabel>
                  <Select
                    value={permissions.filesystem ?? 'workbook'}
                    onChange={(_, value) => updatePermissions({ ...permissions, filesystem: value ?? undefined })}
                    disabled={disableInputs}
                  >
                    <Option value="workbook">Workbook</Option>
                    <Option value="none" disabled={isElectron}>
                      None
                    </Option>
                  </Select>
                  {isElectron ? (
                    <Typography level="body-xs" sx={{ color: 'neutral.500', mt: 0.5 }}>
                      Electron always sandboxes access to the workbook folder.
                    </Typography>
                  ) : (
                    <Typography level="body-xs" sx={{ color: 'neutral.500', mt: 0.5 }}>
                      Applies once the workbook runs in Electron.
                    </Typography>
                  )}
                </FormControl>

                <Box>
                  <FormLabel>Network Access</FormLabel>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Switch
                      checked={Boolean(permissions.network)}
                      onChange={(event) =>
                        updatePermissions({
                          ...permissions,
                          network: event.target.checked,
                        })
                      }
                      disabled={disableInputs}
                    />
                    {!isElectron && (
                      <Typography level="body-xs" sx={{ color: 'neutral.500' }}>
                        Applies when opened in Electron.
                      </Typography>
                    )}
                  </Stack>
                </Box>

                <Box>
                  <FormLabel>Runtime Capabilities</FormLabel>
                  <Stack direction="row" spacing={1} sx={{ mt: 0.5, flexWrap: 'wrap' }}>
                    {runtimeOptions.map((option) => (
                      <Checkbox
                        key={option.value}
                        label={option.label}
                        checked={runtimeSet.has(option.value)}
                        onChange={(event) => handleRuntimeToggle(option.value, event.target.checked)}
                        disabled={disableInputs}
                        size="sm"
                      />
                    ))}
                  </Stack>
                  {!isElectron && (
                    <Typography level="body-xs" sx={{ color: 'neutral.500', mt: 0.5 }}>
                      Runtime switches apply once the workbook runs in Electron.
                    </Typography>
                  )}
                </Box>
              </Stack>
            </Box>
          </Sheet>
        </Stack>
        <Stack
          direction={{ xs: 'column', lg: 'row' }}
          spacing={2}
          sx={{ flexShrink: 0 }}
        >
          <Sheet
            variant="outlined"
            sx={{
              flex: 1,
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
              <Typography level="title-md">Runtime Environment</Typography>
              <Chip
                size="sm"
                variant="soft"
                color={isElectron ? 'success' : 'neutral'}
                startDecorator={<ShieldIcon fontSize="small" />}
              >
                {isElectron ? 'Electron' : 'Web'}
              </Chip>
            </Stack>
            <Typography level="body-sm" sx={{ color: 'neutral.500' }}>
              These capabilities are host-provided and read-only.
            </Typography>
            <Stack spacing={1} sx={{ mt: 1 }}>
              {[
                { label: 'Native menus', enabled: platformCapabilities.hasNativeMenus },
                { label: 'Window management', enabled: platformCapabilities.canManageWindows },
                { label: 'System integration', enabled: platformCapabilities.hasSystemIntegration },
                { label: 'Auto updates', enabled: platformCapabilities.canAutoUpdate },
                { label: 'Notifications', enabled: platformCapabilities.hasNativeNotifications },
                { label: 'Clipboard access', enabled: platformCapabilities.canAccessClipboard },
                { label: 'Offline support', enabled: platformCapabilities.canWorkOffline },
              ].map((item) => (
                <FormControl
                  key={item.label}
                  size="sm"
                  orientation="horizontal"
                  sx={{ alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <FormLabel>{item.label}</FormLabel>
                  <Switch checked={item.enabled} disabled />
                </FormControl>
              ))}
            </Stack>
          </Sheet>
          <Sheet
            variant="outlined"
            sx={{
              flex: 1,
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
              <Typography level="title-md">Raw Manifest Preview</Typography>
              <Chip size="sm" variant="outlined" color="neutral">
                Read-only
              </Chip>
            </Stack>
            <Typography level="body-sm" sx={{ color: 'neutral.500' }}>
              This mirrors the file saved as <code>manifest.json</code>.
            </Typography>
            <Textarea
              value={JSON.stringify(manifest, null, 2)}
              readOnly
              minRows={10}
              sx={{ fontFamily: 'JetBrains Mono, monospace' }}
            />
          </Sheet>
        </Stack>
      </Box>
    </Sheet>
  );
};

ManifestEditorPanel.displayName = 'GridparkManifestEditorPanel';
