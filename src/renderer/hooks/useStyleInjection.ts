import { useEffect } from 'react';
import { WorkbookTab } from '../types/tabs';
import { ManifestSession } from './useFileSessions';
import { ExcelFile } from '../types/excel';

export interface StyleInjectionParams {
  activeTab: WorkbookTab | null;
  manifestSessions: Record<string, ManifestSession>;
  getManifestSessionKey: (file: ExcelFile) => string;
}

/**
 * Hook to inject workbook-level and sheet-level CSS dynamically
 */
export const useStyleInjection = ({
  activeTab,
  manifestSessions,
  getManifestSessionKey,
}: StyleInjectionParams) => {
  useEffect(() => {
    let workbookStyleElement: HTMLStyleElement | null = null;
    const sheetStyleElements: Map<string, HTMLStyleElement> = new Map();

    const currentFile = activeTab?.file;
    const manifestKey = currentFile ? getManifestSessionKey(currentFile) : null;
    const manifestSession = manifestKey ? manifestSessions[manifestKey] : undefined;

    // Inject workbook-level CSS
    if (manifestSession?.workbookCssContent) {
      workbookStyleElement = document.createElement('style');
      workbookStyleElement.type = 'text/css';
      workbookStyleElement.innerHTML = manifestSession.workbookCssContent;
      workbookStyleElement.setAttribute('data-gridpark-style-scope', 'workbook');
      document.head.appendChild(workbookStyleElement);
    }

    // Inject sheet-level CSS for the active sheet
    if (activeTab?.kind === 'sheet' && manifestSession?.sheetCssContents && activeTab.sheetName) {
      const sheetCss = manifestSession.sheetCssContents[activeTab.sheetName];
      if (sheetCss) {
        const styleElement = document.createElement('style');
        styleElement.type = 'text/css';
        styleElement.innerHTML = sheetCss;
        styleElement.setAttribute('data-gridpark-style-scope', 'sheet');
        styleElement.setAttribute('data-gridpark-sheet-name', activeTab.sheetName);
        document.head.appendChild(styleElement);
        sheetStyleElements.set(activeTab.sheetName, styleElement);
      }
    }

    // Cleanup function
    return () => {
      if (workbookStyleElement && workbookStyleElement.parentNode) {
        workbookStyleElement.parentNode.removeChild(workbookStyleElement);
      }
      sheetStyleElements.forEach(element => {
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
      });
    };
  }, [activeTab, manifestSessions, getManifestSessionKey]);
};
