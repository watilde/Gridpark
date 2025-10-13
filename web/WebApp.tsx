import { useEffect } from 'react';
import { App } from '../src/renderer/app/App';

/**
 * Web-specific App wrapper
 * 
 * Handles web-specific initialization and provides
 * web alternatives for Electron-specific features
 */
export const WebApp = () => {
  useEffect(() => {
    // Remove loading screen once React has loaded
    const loadingElement = document.querySelector('.loading');
    if (loadingElement) {
      loadingElement.style.display = 'none';
    }
    
    // Set up web-specific global variables
    if (typeof window !== 'undefined') {
      // Mock Electron APIs for web compatibility
      (window as any).__IS_WEB__ = true;
      (window as any).__IS_ELECTRON__ = false;
      
      // Provide web alternatives for Electron APIs
      (window as any).electron = {
        // Mock IPC for components that might use it
        ipcRenderer: {
          send: (channel: string, ...args: any[]) => {
            console.log(`[Web Mode] IPC Send: ${channel}`, args);
          },
          on: (channel: string, callback: (...args: any[]) => void) => {
            console.log(`[Web Mode] IPC On: ${channel}`);
            return () => {}; // Return cleanup function
          },
          invoke: async (channel: string, ...args: any[]) => {
            console.log(`[Web Mode] IPC Invoke: ${channel}`, args);
            return null; // Return mock response
          },
        },
        
        // File system operations for web
        fs: {
          readFile: async (path: string) => {
            // In web mode, could integrate with File System Access API
            // or use localStorage/IndexedDB
            console.log(`[Web Mode] File Read: ${path}`);
            return null;
          },
          writeFile: async (path: string, data: any) => {
            // Could use File System Access API or download
            console.log(`[Web Mode] File Write: ${path}`, data);
          },
        },
      };
    }
  }, []);

  return <App />;
};