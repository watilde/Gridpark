import { GridparkManifest } from '../types/excel';

/**
 * Deep clone a manifest object
 */
export const cloneManifest = (manifest: GridparkManifest): GridparkManifest =>
  JSON.parse(JSON.stringify(manifest));

/**
 * Create a default manifest for a workbook
 */
export const createDefaultManifest = (fileName: string): GridparkManifest => ({
  name: fileName.replace(/\.[^.]+$/, ''),
  version: '1.0.0',
  description: '',
  apiVersion: 1,
  script: 'script.js',
  style: 'style.css',
  permissions: {
    filesystem: 'workbook',
    network: false,
    runtime: [],
  },
  sheets: {},
});
