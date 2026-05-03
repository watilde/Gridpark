import React, { useState, useCallback } from 'react';
import Drawer from '@mui/joy/Drawer';
import Sheet from '@mui/joy/Sheet';
import Box from '@mui/joy/Box';
import Typography from '@mui/joy/Typography';
import Button from '@mui/joy/Button';
import Select from '@mui/joy/Select';
import Option from '@mui/joy/Option';
import Alert from '@mui/joy/Alert';
import Divider from '@mui/joy/Divider';
import {
  themeOptions,
  useThemePreset,
  type ColorSchemePreference,
} from '../../theme/ThemeProvider';
import type { ThemePresetId } from '../../theme/theme';
import { useSettings } from '../../hooks/useSettings';
import { resetDatabase, getDatabaseStats } from '../../../lib/db';
import { persistor, useAppDispatch } from '../../../stores';
import { resetSpreadsheetState } from '../../../stores/spreadsheetSlice';
import { useI18n, type Locale } from '../../i18n/I18nProvider';
import type { TranslationKey } from '../../i18n/locales/en';

interface SettingsDrawerProps {
  settings: ReturnType<typeof useSettings>;
}

const colorSchemeOptions: { value: ColorSchemePreference; labelKey: TranslationKey }[] = [
  { value: 'system', labelKey: 'settings.color_mode.system' },
  { value: 'light', labelKey: 'settings.color_mode.light' },
  { value: 'dark', labelKey: 'settings.color_mode.dark' },
];

const localeOptions: { value: Locale; labelKey: TranslationKey }[] = [
  { value: 'en', labelKey: 'settings.language.en' },
  { value: 'ja', labelKey: 'settings.language.ja' },
];

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({ settings }) => {
  const { presetId, setPresetId, settingsOpen, setSettingsOpen } = settings;

  const { colorScheme, setColorScheme } = useThemePreset();
  const dispatch = useAppDispatch();
  const { t, locale, setLocale } = useI18n();

  const [isResetting, setIsResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Reset in-memory database
  const handleResetDatabase = useCallback(async () => {
    if (!confirm(t('settings.reset_db_confirm'))) {
      return;
    }

    setIsResetting(true);
    setResetMessage(null);

    try {
      const statsBefore = await getDatabaseStats();
      console.log('[Settings] Database stats before reset:', statsBefore);

      await resetDatabase();

      setResetMessage({
        type: 'success',
        text: `Database reset successfully. Cleared ${statsBefore.cells} cells, ${statsBefore.sheets} sheets, ${statsBefore.workbooks} workbooks.`,
      });

      console.log('[Settings] Database reset completed');
    } catch (error) {
      console.error('[Settings] Database reset failed:', error);
      setResetMessage({
        type: 'error',
        text: `Failed to reset database: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setIsResetting(false);
    }
  }, [t]);

  // Reset Redux persist
  const handleResetRedux = useCallback(async () => {
    if (!confirm(t('settings.reset_redux_confirm'))) {
      return;
    }

    setIsResetting(true);
    setResetMessage(null);

    try {
      // Reset Redux state
      dispatch(resetSpreadsheetState());

      // Purge redux-persist storage
      await persistor.purge();

      setResetMessage({
        type: 'success',
        text: 'Redux state reset successfully. All tabs and dirty state cleared.',
      });

      console.log('[Settings] Redux state reset completed');

      // Reload page to fully reset
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('[Settings] Redux reset failed:', error);
      setResetMessage({
        type: 'error',
        text: `Failed to reset Redux: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setIsResetting(false);
    }
  }, [dispatch, t]);

  // Reset everything
  const handleResetAll = useCallback(async () => {
    if (!confirm(t('settings.reset_all_confirm'))) {
      return;
    }

    setIsResetting(true);
    setResetMessage(null);

    try {
      // Reset database
      await resetDatabase();

      // Reset Redux
      dispatch(resetSpreadsheetState());
      await persistor.purge();

      setResetMessage({
        type: 'success',
        text: 'All data reset successfully. Reloading application...',
      });

      console.log('[Settings] Complete reset completed');

      // Reload page
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('[Settings] Complete reset failed:', error);
      setResetMessage({
        type: 'error',
        text: `Failed to reset: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setIsResetting(false);
    }
  }, [dispatch, t]);

  return (
    <Drawer
      anchor="right"
      open={settingsOpen}
      onClose={() => setSettingsOpen(false)}
      size="md"
      sx={{ '& .MuiDrawer-paper': { borderRadius: 0, maxWidth: 360 } }}
    >
      <Sheet
        sx={{
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          height: '100%',
        }}
      >
        <Typography level="title-lg">{t('settings.title')}</Typography>
        <Divider />

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography level="title-sm">{t('settings.language')}</Typography>
          <Select
            size="sm"
            value={locale}
            onChange={(_event, value) => {
              if (value) setLocale(value as Locale);
            }}
          >
            {localeOptions.map(option => (
              <Option key={option.value} value={option.value}>
                {t(option.labelKey)}
              </Option>
            ))}
          </Select>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography level="title-sm">{t('settings.color_mode')}</Typography>
          <Select
            size="sm"
            value={colorScheme}
            onChange={(_event, value) => {
              if (value) {
                setColorScheme(value as ColorSchemePreference);
              }
            }}
          >
            {colorSchemeOptions.map(option => (
              <Option key={option.value} value={option.value}>
                {t(option.labelKey)}
              </Option>
            ))}
          </Select>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography level="title-sm">{t('settings.theme')}</Typography>
          <Select
            size="sm"
            value={presetId}
            onChange={(_event, value) => {
              if (value && typeof value === 'string') {
                setPresetId(value as ThemePresetId);
              }
            }}
          >
            {themeOptions.map(option => (
              <Option key={option.id} value={option.id}>
                {option.name}
              </Option>
            ))}
          </Select>
        </Box>

        <Divider />

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography level="title-sm" color="danger">
            {t('settings.danger_zone')}
          </Typography>

          {resetMessage && (
            <Alert color={resetMessage.type === 'success' ? 'success' : 'danger'}>
              {resetMessage.text}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography level="body-sm">{t('settings.reset_db')}</Typography>
            <Typography level="body-xs" color="neutral">
              {t('settings.reset_db_desc')}
            </Typography>
            <Button
              size="sm"
              color="danger"
              variant="outlined"
              onClick={handleResetDatabase}
              disabled={isResetting}
              loading={isResetting}
            >
              {t('settings.reset_db')}
            </Button>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography level="body-sm">{t('settings.reset_redux')}</Typography>
            <Typography level="body-xs" color="neutral">
              {t('settings.reset_redux_desc')}
            </Typography>
            <Button
              size="sm"
              color="danger"
              variant="outlined"
              onClick={handleResetRedux}
              disabled={isResetting}
              loading={isResetting}
            >
              {t('settings.reset_redux')}
            </Button>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography level="body-sm">{t('settings.reset_all')}</Typography>
            <Typography level="body-xs" color="neutral">
              {t('settings.reset_all_desc')}
            </Typography>
            <Button
              size="sm"
              color="danger"
              variant="solid"
              onClick={handleResetAll}
              disabled={isResetting}
              loading={isResetting}
            >
              {t('settings.reset_all_button')}
            </Button>
          </Box>
        </Box>
      </Sheet>
    </Drawer>
  );
};
