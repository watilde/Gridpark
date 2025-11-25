import path from 'path';
import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { MakerDMG } from '@electron-forge/maker-dmg';
import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives';
import { VitePlugin } from '@electron-forge/plugin-vite';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';
import { execSync } from 'node:child_process';

// ---------------------------------------------------------------------
// 🔥 GitHub Actions での hdiutil detach エラー対策
// 問題: DMGボリュームがマウントされていない、または既にdetachされている場合のエラー
// 解決策: detach前にボリュームの存在を確認し、存在する場合のみdetachする
// ---------------------------------------------------------------------
const originalMake = MakerDMG.prototype.make;
MakerDMG.prototype.make = async function (...args) {
  console.log('[DMG] Starting DMG creation with improved error handling...');

  // 既存のマウントポイントをクリーンアップ
  try {
    const volumes = execSync('ls /Volumes', { encoding: 'utf8' });
    if (volumes.includes('Gridpark')) {
      console.log('[DMG] Found existing Gridpark volume, attempting to detach...');
      try {
        execSync('hdiutil detach "/Volumes/Gridpark" -force', { encoding: 'utf8' });
        console.log('[DMG] Successfully detached existing volume');
      } catch (detachError: any) {
        console.warn('[DMG] Failed to detach existing volume:', detachError.message);
        // Continue anyway - it might have been detached already
      }
      // Wait a bit for the system to process the detach
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  } catch (error: any) {
    console.warn('[DMG] Error checking volumes:', error.message);
  }

  try {
    const result = await originalMake.apply(this, args);
    console.log('[DMG] DMG creation completed successfully');
    return result;
  } catch (error: any) {
    console.error('[DMG] DMG creation failed:', error.message);

    // クリーンアップを試みる
    try {
      execSync('hdiutil detach "/Volumes/Gridpark" -force 2>/dev/null || true', {
        encoding: 'utf8',
      });
    } catch {
      // Ignore cleanup errors
    }

    throw error;
  }
};
// ---------------------------------------------------------------------

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    icon: path.resolve(__dirname, 'assets/icon'),
    extraResource: ['assets'],
    executableName: 'Gridpark',
  },

  rebuildConfig: {},

  makers: [
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin', 'linux', 'win32'],
      config: {},
    },
    {
      name: '@electron-forge/maker-dmg',
      platforms: ['darwin'],
      config: {
        name: 'Gridpark', // ★ DMGファイル名
        title: 'Gridpark', // ★ Volume名を固定
        overwrite: true, // ★ CIビルドの競合防止
        format: 'ULFO', // ★ Apple Silicon に最適（既定値より安定）
        // ★ GitHub Actions環境での安定性向上
        additionalDMGOptions: {
          window: {
            size: {
              width: 540,
              height: 380,
            },
          },
        },
      },
    },
    {
      name: '@electron-forge/maker-squirrel',
      platforms: ['win32'],
      config: {},
    },
    {
      name: '@electron-forge/maker-deb',
      platforms: ['linux'],
      config: {
        options: {
          bin: 'Gridpark',
        },
      },
    },
    {
      name: '@electron-forge/maker-rpm',
      platforms: ['linux'],
      config: {
        options: {
          bin: 'Gridpark',
        },
      },
    },
  ],

  plugins: [
    new AutoUnpackNativesPlugin({}),
    new VitePlugin({
      build: [
        {
          entry: 'src/main/index.ts',
          config: 'vite.main.config.ts',
        },
        {
          entry: 'src/main/preload.ts',
          config: 'vite.preload.config.ts',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.ts',
        },
      ],
    }),

    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};

export default config;
