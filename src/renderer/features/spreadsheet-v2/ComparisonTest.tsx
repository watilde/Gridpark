/**
 * Comparison Test Page
 * 
 * Side-by-side comparison of:
 * - Old: ExcelViewer (1,633 lines, 223ms latency)
 * - New: SpreadsheetContainer (~100 lines, 10-20ms latency)
 */

import React, { useState } from 'react';
import { Box, Typography, Button, Stack } from '@mui/joy';
import { ExcelViewerDB } from '../workbook/components/ExcelViewerDB';
import { SpreadsheetContainer } from '../spreadsheet-v2';
import { ExcelFile } from '../../../types/excel';

export const ComparisonTest: React.FC = () => {
  const [view, setView] = useState<'old' | 'new' | 'split'>('split');
  const [testFile, setTestFile] = useState<ExcelFile | null>(null);

  // Performance metrics
  const [oldMetrics, setOldMetrics] = useState({ latency: 0, memory: 0 });
  const [newMetrics, setNewMetrics] = useState({ latency: 0, memory: 0 });

  // Measure performance
  const measurePerformance = (label: string) => {
    const start = performance.now();
    const memBefore = (performance as any).memory?.usedJSHeapSize ?? 0;
    
    return () => {
      const end = performance.now();
      const memAfter = (performance as any).memory?.usedJSHeapSize ?? 0;
      const latency = Math.round(end - start);
      const memory = Math.round((memAfter - memBefore) / 1024); // KB
      
      console.log(`[${label}] Latency: ${latency}ms, Memory: ${memory}KB`);
      
      if (label === 'Old') {
        setOldMetrics({ latency, memory });
      } else {
        setNewMetrics({ latency, memory });
      }
    };
  };

  return (
    <Box sx={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography level="h4">
            📊 Spreadsheet v1 vs v2 Comparison
          </Typography>
          
          <Button
            variant={view === 'old' ? 'solid' : 'outlined'}
            onClick={() => setView('old')}
          >
            Old (v1)
          </Button>
          
          <Button
            variant={view === 'new' ? 'solid' : 'outlined'}
            onClick={() => setView('new')}
          >
            New (v2)
          </Button>
          
          <Button
            variant={view === 'split' ? 'solid' : 'outlined'}
            onClick={() => setView('split')}
          >
            Split View
          </Button>
        </Stack>
        
        {/* Metrics */}
        <Stack direction="row" spacing={4} sx={{ mt: 2 }}>
          <Box>
            <Typography level="body-sm" sx={{ fontWeight: 'bold' }}>
              Old (v1):
            </Typography>
            <Typography level="body-xs">
              Latency: {oldMetrics.latency}ms | Memory: {oldMetrics.memory}KB
            </Typography>
          </Box>
          
          <Box>
            <Typography level="body-sm" sx={{ fontWeight: 'bold' }}>
              New (v2):
            </Typography>
            <Typography level="body-xs">
              Latency: {newMetrics.latency}ms | Memory: {newMetrics.memory}KB
            </Typography>
          </Box>
          
          <Box>
            <Typography level="body-sm" sx={{ fontWeight: 'bold' }}>
              Improvement:
            </Typography>
            <Typography level="body-xs" sx={{ color: 'success.main' }}>
              {oldMetrics.latency > 0 
                ? `${Math.round((1 - newMetrics.latency / oldMetrics.latency) * 100)}% faster`
                : 'N/A'
              }
            </Typography>
          </Box>
        </Stack>
      </Box>
      
      {/* Content */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {(view === 'old' || view === 'split') && (
          <Box
            sx={{
              flex: 1,
              borderRight: view === 'split' ? '1px solid #e0e0e0' : 'none',
              position: 'relative',
            }}
            onClick={measurePerformance('Old')}
          >
            <Box sx={{ position: 'absolute', top: 8, left: 8, zIndex: 10 }}>
              <Typography
                level="body-sm"
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  p: 1,
                  borderRadius: 4,
                  fontWeight: 'bold',
                }}
              >
                OLD (v1) - 1,633 lines
              </Typography>
            </Box>
            <ExcelViewerDB
              tabId="test-old"
              file={testFile}
              sheetIndex={0}
            />
          </Box>
        )}
        
        {(view === 'new' || view === 'split') && (
          <Box
            sx={{ flex: 1, position: 'relative' }}
            onClick={measurePerformance('New')}
          >
            <Box sx={{ position: 'absolute', top: 8, left: 8, zIndex: 10 }}>
              <Typography
                level="body-sm"
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  p: 1,
                  borderRadius: 4,
                  fontWeight: 'bold',
                  color: 'success.main',
                }}
              >
                NEW (v2) - ~100 lines
              </Typography>
            </Box>
            <SpreadsheetContainer
              file={testFile}
              sheetIndex={0}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
};
