/**
 * FormulaWorkerDemo Component
 *
 * Demonstration of Web Worker formula calculation.
 * Shows performance improvements compared to main thread calculation.
 */

import React, { useState, useCallback } from 'react';
import { Box, Button, Typography, Card, Chip, Stack, TextField, Alert } from '@mui/joy';
import { useFormulaWorker } from '../hooks/useFormulaWorker';
import { useFormulaCalculation } from '../hooks/useFormulaCalculation';

interface FormulaWorkerDemoProps {
  tabId: string;
}

export const FormulaWorkerDemo: React.FC<FormulaWorkerDemoProps> = ({ tabId }) => {
  const [formula, setFormula] = useState('=SUM(A1:A1000)');
  const [workerResult, setWorkerResult] = useState<string>('');
  const [mainThreadResult, setMainThreadResult] = useState<string>('');
  const [workerTime, setWorkerTime] = useState<number>(0);
  const [mainThreadTime, setMainThreadTime] = useState<number>(0);

  const { calculate: workerCalculate, isReady, stats } = useFormulaWorker(tabId);
  const { calculate: mainThreadCalculate } = useFormulaCalculation(tabId);

  // Calculate using Web Worker
  const handleWorkerCalculate = useCallback(async () => {
    const startTime = performance.now();
    try {
      const result = await workerCalculate(formula, 'DEMO');
      const endTime = performance.now();
      setWorkerResult(String(result));
      setWorkerTime(endTime - startTime);
    } catch (error) {
      setWorkerResult('Error: ' + (error as Error).message);
    }
  }, [formula, workerCalculate]);

  // Calculate in main thread (for comparison)
  const handleMainThreadCalculate = useCallback(async () => {
    const startTime = performance.now();
    try {
      const result = await mainThreadCalculate(formula);
      const endTime = performance.now();
      setMainThreadResult(String(result));
      setMainThreadTime(endTime - startTime);
    } catch (error) {
      setMainThreadResult('Error: ' + (error as Error).message);
    }
  }, [formula, mainThreadCalculate]);

  // Calculate both for comparison
  const handleCompare = useCallback(async () => {
    await Promise.all([handleWorkerCalculate(), handleMainThreadCalculate()]);
  }, [handleWorkerCalculate, handleMainThreadCalculate]);

  return (
    <Box sx={{ p: 3, maxWidth: 800, margin: '0 auto' }}>
      <Typography level="h2" sx={{ mb: 2 }}>
        Formula Worker Demo
      </Typography>

      <Alert color="info" sx={{ mb: 3 }}>
        Web Worker allows formula calculation without blocking the UI. Try calculating large ranges
        like =SUM(A1:A10000) - the UI stays responsive!
      </Alert>

      {/* Worker Status */}
      <Card sx={{ mb: 3, p: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography level="body-md">Worker Status:</Typography>
          <Chip color={isReady ? 'success' : 'warning'}>
            {isReady ? 'Ready' : 'Initializing...'}
          </Chip>
          <Typography level="body-sm" sx={{ ml: 'auto' }}>
            Total Calculations: {stats.totalCalculations}
          </Typography>
          <Typography level="body-sm">Avg Time: {stats.averageDuration.toFixed(2)}ms</Typography>
        </Stack>
      </Card>

      {/* Formula Input */}
      <Card sx={{ mb: 3, p: 2 }}>
        <Typography level="body-md" sx={{ mb: 1 }}>
          Formula:
        </Typography>
        <TextField
          value={formula}
          onChange={e => setFormula(e.target.value)}
          placeholder="=SUM(A1:A100)"
          sx={{ mb: 2 }}
        />
        <Stack direction="row" spacing={2}>
          <Button onClick={handleWorkerCalculate} disabled={!isReady} color="primary">
            Calculate (Worker)
          </Button>
          <Button onClick={handleMainThreadCalculate} color="neutral">
            Calculate (Main Thread)
          </Button>
          <Button onClick={handleCompare} disabled={!isReady} color="success">
            Compare Both
          </Button>
        </Stack>
      </Card>

      {/* Results */}
      <Stack direction="row" spacing={2}>
        {/* Worker Result */}
        <Card sx={{ flex: 1, p: 2 }}>
          <Typography level="title-md" sx={{ mb: 1 }}>
            🚀 Web Worker
          </Typography>
          <Typography level="body-lg" sx={{ mb: 1, fontWeight: 'bold' }}>
            Result: {workerResult || '-'}
          </Typography>
          <Typography level="body-sm" color={workerTime > 0 ? 'success' : 'neutral'}>
            Time: {workerTime > 0 ? `${workerTime.toFixed(2)}ms` : '-'}
          </Typography>
          <Typography level="body-xs" sx={{ mt: 1, color: 'text.secondary' }}>
            ✅ Non-blocking
            <br />✅ UI stays responsive
          </Typography>
        </Card>

        {/* Main Thread Result */}
        <Card sx={{ flex: 1, p: 2 }}>
          <Typography level="title-md" sx={{ mb: 1 }}>
            🐌 Main Thread
          </Typography>
          <Typography level="body-lg" sx={{ mb: 1, fontWeight: 'bold' }}>
            Result: {mainThreadResult || '-'}
          </Typography>
          <Typography level="body-sm" color={mainThreadTime > 0 ? 'warning' : 'neutral'}>
            Time: {mainThreadTime > 0 ? `${mainThreadTime.toFixed(2)}ms` : '-'}
          </Typography>
          <Typography level="body-xs" sx={{ mt: 1, color: 'text.secondary' }}>
            ⚠️ Blocking
            <br />
            ⚠️ UI can freeze
          </Typography>
        </Card>
      </Stack>

      {/* Performance Comparison */}
      {workerTime > 0 && mainThreadTime > 0 && (
        <Card sx={{ mt: 3, p: 2, bgcolor: 'success.softBg' }}>
          <Typography level="title-md" sx={{ mb: 1 }}>
            📊 Performance Comparison
          </Typography>
          <Typography level="body-md">
            {workerTime < mainThreadTime ? (
              <>
                ✅ Worker is{' '}
                <strong>
                  {(((mainThreadTime - workerTime) / mainThreadTime) * 100).toFixed(1)}%
                </strong>{' '}
                faster
                <br />
                (considering message passing overhead, this is excellent!)
              </>
            ) : (
              <>
                Worker time includes message passing overhead.
                <br />
                For large datasets, the benefit becomes significant!
              </>
            )}
          </Typography>
        </Card>
      )}

      {/* Examples */}
      <Card sx={{ mt: 3, p: 2 }}>
        <Typography level="title-md" sx={{ mb: 2 }}>
          Example Formulas
        </Typography>
        <Stack spacing={1}>
          {[
            '=SUM(A1:A100)',
            '=AVERAGE(A1:A1000)',
            '=COUNT(A1:A500)',
            '=MIN(B1:B100)',
            '=MAX(C1:C100)',
          ].map(example => (
            <Button
              key={example}
              variant="outlined"
              onClick={() => setFormula(example)}
              sx={{ justifyContent: 'flex-start' }}
            >
              {example}
            </Button>
          ))}
        </Stack>
      </Card>
    </Box>
  );
};
