/**
 * HyperFormula Demo Component (Phase 3)
 *
 * Demonstrates the full power of HyperFormula integration:
 * - 400+ Excel functions (VLOOKUP, IF, SUMIF, etc.)
 * - Dependency tracking
 * - Circular reference detection
 * - Performance testing with complex formulas
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Card,
  Chip,
  Stack,
  Select,
  Option,
  Alert,
  Divider,
  List,
  ListItem,
} from '@mui/joy';
import { useFormulaWorker } from '../hooks/useFormulaWorker';

interface HyperFormulaDemoProps {
  tabId: string;
}

// Example formulas showcasing different function categories
const EXAMPLE_FORMULAS = {
  'Math & Trig': [
    { label: 'SUM', formula: '=SUM(A1:A100)', description: 'Sum of range' },
    { label: 'AVERAGE', formula: '=AVERAGE(A1:A100)', description: 'Average of values' },
    { label: 'SUMIF', formula: '=SUMIF(A1:A10, ">5", B1:B10)', description: 'Conditional sum' },
    { label: 'ROUND', formula: '=ROUND(A1, 2)', description: 'Round to 2 decimals' },
  ],
  Logical: [
    { label: 'IF', formula: '=IF(A1>10, "High", "Low")', description: 'Simple condition' },
    { label: 'AND', formula: '=AND(A1>5, A1<10)', description: 'Multiple conditions' },
    { label: 'OR', formula: '=OR(A1>10, B1>10)', description: 'Either condition' },
    { label: 'NOT', formula: '=NOT(A1>10)', description: 'Negate condition' },
    {
      label: 'IFS',
      formula: '=IFS(A1>10, "High", A1>5, "Med", TRUE, "Low")',
      description: 'Multiple IF',
    },
  ],
  Lookup: [
    { label: 'VLOOKUP', formula: '=VLOOKUP(A1, B1:D10, 3, FALSE)', description: 'Vertical lookup' },
    {
      label: 'HLOOKUP',
      formula: '=HLOOKUP(A1, B1:E5, 3, FALSE)',
      description: 'Horizontal lookup',
    },
    { label: 'INDEX', formula: '=INDEX(A1:C10, 5, 2)', description: 'Get value by position' },
    { label: 'MATCH', formula: '=MATCH(A1, B1:B10, 0)', description: 'Find position' },
  ],
  Statistical: [
    { label: 'COUNT', formula: '=COUNT(A1:A100)', description: 'Count numbers' },
    { label: 'COUNTA', formula: '=COUNTA(A1:A100)', description: 'Count non-empty' },
    { label: 'COUNTIF', formula: '=COUNTIF(A1:A10, ">5")', description: 'Conditional count' },
    { label: 'MIN', formula: '=MIN(A1:A100)', description: 'Minimum value' },
    { label: 'MAX', formula: '=MAX(A1:A100)', description: 'Maximum value' },
    { label: 'MEDIAN', formula: '=MEDIAN(A1:A100)', description: 'Middle value' },
  ],
  Text: [
    { label: 'CONCATENATE', formula: '=CONCATENATE(A1, " ", B1)', description: 'Join text' },
    { label: 'LEFT', formula: '=LEFT(A1, 5)', description: 'First 5 characters' },
    { label: 'RIGHT', formula: '=RIGHT(A1, 5)', description: 'Last 5 characters' },
    { label: 'MID', formula: '=MID(A1, 2, 5)', description: 'Middle characters' },
    { label: 'UPPER', formula: '=UPPER(A1)', description: 'Convert to uppercase' },
  ],
  'Date & Time': [
    { label: 'TODAY', formula: '=TODAY()', description: 'Current date' },
    { label: 'NOW', formula: '=NOW()', description: 'Current date and time' },
    { label: 'YEAR', formula: '=YEAR(A1)', description: 'Extract year' },
    { label: 'MONTH', formula: '=MONTH(A1)', description: 'Extract month' },
    { label: 'DAY', formula: '=DAY(A1)', description: 'Extract day' },
  ],
};

export const HyperFormulaDemo: React.FC<HyperFormulaDemoProps> = ({ tabId }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Math & Trig');
  const [selectedFormula, setSelectedFormula] = useState<string>(
    EXAMPLE_FORMULAS['Math & Trig'][0].formula
  );
  const [result, setResult] = useState<string>('');
  const [calculationTime, setCalculationTime] = useState<number>(0);
  const [dependencies, setDependencies] = useState<{
    dependencies: string[];
    dependents: string[];
  } | null>(null);
  const [error, setError] = useState<string>('');

  const { calculate, calculateBatch, loadSheet, getDependencies, isReady, isSheetLoaded, stats } =
    useFormulaWorker(tabId);

  // Load sheet on mount
  useEffect(() => {
    if (isReady && !isSheetLoaded) {
      loadSheet().catch(err => {
        console.error('Failed to load sheet:', err);
      });
    }
  }, [isReady, isSheetLoaded, loadSheet]);

  // Calculate single formula
  const handleCalculate = useCallback(async () => {
    setError('');
    setResult('');
    setDependencies(null);

    const startTime = performance.now();
    try {
      const calcResult = await calculate(selectedFormula, 'DEMO1');
      const endTime = performance.now();

      setResult(String(calcResult));
      setCalculationTime(endTime - startTime);
    } catch (err) {
      setError((err as Error).message);
    }
  }, [selectedFormula, calculate]);

  // Get dependencies for the formula
  const handleGetDependencies = useCallback(async () => {
    setError('');
    try {
      const deps = await getDependencies('DEMO1');
      setDependencies(deps);
    } catch (err) {
      setError((err as Error).message);
    }
  }, [getDependencies]);

  // Batch calculate all formulas in category
  const handleBatchCalculate = useCallback(async () => {
    setError('');
    setResult('');

    const formulas = EXAMPLE_FORMULAS[selectedCategory as keyof typeof EXAMPLE_FORMULAS];
    const batchFormulas = formulas.map((f, idx) => ({
      cellRef: `DEMO${idx}`,
      formula: f.formula,
    }));

    const startTime = performance.now();
    try {
      const results = await calculateBatch(batchFormulas);
      const endTime = performance.now();

      const resultsText = results.map((r, idx) => `${formulas[idx].label}: ${r.result}`).join('\n');

      setResult(resultsText);
      setCalculationTime(endTime - startTime);
    } catch (err) {
      setError((err as Error).message);
    }
  }, [selectedCategory, calculateBatch]);

  const categories = Object.keys(EXAMPLE_FORMULAS);
  const currentFormulas = EXAMPLE_FORMULAS[selectedCategory as keyof typeof EXAMPLE_FORMULAS];

  return (
    <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
      <Typography level="h2" sx={{ mb: 2 }}>
        🎉 Phase 3: HyperFormula Integration
      </Typography>

      <Alert color="success" sx={{ mb: 3 }}>
        <Typography level="title-md" sx={{ mb: 1 }}>
          400+ Excel Functions Now Supported!
        </Typography>
        <Typography level="body-sm">
          Full Excel compatibility with VLOOKUP, IF, SUMIF, INDEX/MATCH, and hundreds more. Includes
          dependency tracking and circular reference detection.
        </Typography>
      </Alert>

      {/* Status Bar */}
      <Card sx={{ mb: 3, p: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <Typography level="body-md">Status:</Typography>
          <Chip color={isReady ? 'success' : 'warning'}>
            Worker {isReady ? 'Ready' : 'Initializing'}
          </Chip>
          <Chip color={isSheetLoaded ? 'success' : 'neutral'}>
            Sheet {isSheetLoaded ? 'Loaded' : 'Not Loaded'}
          </Chip>
          <Divider orientation="vertical" />
          <Typography level="body-sm">Total: {stats.totalCalculations} calculations</Typography>
          <Typography level="body-sm">Avg: {stats.averageDuration.toFixed(2)}ms</Typography>
        </Stack>
      </Card>

      <Stack direction="row" spacing={3}>
        {/* Left Panel - Formula Selection */}
        <Box sx={{ flex: 1 }}>
          <Card sx={{ p: 2, mb: 2 }}>
            <Typography level="title-md" sx={{ mb: 2 }}>
              Select Function Category
            </Typography>

            <Select
              value={selectedCategory}
              onChange={(_, value) => {
                if (value) {
                  setSelectedCategory(value);
                  setSelectedFormula(
                    EXAMPLE_FORMULAS[value as keyof typeof EXAMPLE_FORMULAS][0].formula
                  );
                }
              }}
              sx={{ mb: 2 }}
            >
              {categories.map(cat => (
                <Option key={cat} value={cat}>
                  {cat}
                </Option>
              ))}
            </Select>

            <Divider sx={{ my: 2 }} />

            <Typography level="title-sm" sx={{ mb: 1 }}>
              Available Functions:
            </Typography>

            <List size="sm">
              {currentFormulas.map((f, idx) => (
                <ListItem
                  key={idx}
                  sx={{
                    cursor: 'pointer',
                    bgcolor: selectedFormula === f.formula ? 'primary.softBg' : 'transparent',
                    borderRadius: 'sm',
                    '&:hover': { bgcolor: 'primary.softHoverBg' },
                  }}
                  onClick={() => setSelectedFormula(f.formula)}
                >
                  <Box>
                    <Typography level="body-sm" fontWeight="bold">
                      {f.label}
                    </Typography>
                    <Typography level="body-xs" color="neutral">
                      {f.description}
                    </Typography>
                    <Typography
                      level="body-xs"
                      sx={{ fontFamily: 'monospace', color: 'primary.plainColor' }}
                    >
                      {f.formula}
                    </Typography>
                  </Box>
                </ListItem>
              ))}
            </List>
          </Card>

          <Button
            fullWidth
            onClick={handleBatchCalculate}
            disabled={!isReady || !isSheetLoaded}
            color="success"
            size="lg"
          >
            Calculate All in Category
          </Button>
        </Box>

        {/* Right Panel - Results */}
        <Box sx={{ flex: 1 }}>
          <Card sx={{ p: 2, mb: 2 }}>
            <Typography level="title-md" sx={{ mb: 2 }}>
              Selected Formula
            </Typography>

            <Box
              sx={{
                p: 2,
                bgcolor: 'background.level2',
                borderRadius: 'sm',
                fontFamily: 'monospace',
                fontSize: '1.1em',
                mb: 2,
              }}
            >
              {selectedFormula}
            </Box>

            <Stack direction="row" spacing={1}>
              <Button
                onClick={handleCalculate}
                disabled={!isReady || !isSheetLoaded}
                color="primary"
              >
                Calculate
              </Button>
              <Button
                onClick={handleGetDependencies}
                disabled={!isReady || !isSheetLoaded}
                color="neutral"
                variant="outlined"
              >
                Get Dependencies
              </Button>
            </Stack>
          </Card>

          {/* Result Display */}
          {result && (
            <Card sx={{ p: 2, mb: 2, bgcolor: 'success.softBg' }}>
              <Typography level="title-sm" sx={{ mb: 1 }}>
                Result:
              </Typography>
              <Typography
                level="body-lg"
                sx={{
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                  fontWeight: 'bold',
                }}
              >
                {result}
              </Typography>
              <Typography level="body-xs" color="success" sx={{ mt: 1 }}>
                ⚡ Calculated in {calculationTime.toFixed(2)}ms
              </Typography>
            </Card>
          )}

          {/* Error Display */}
          {error && (
            <Alert color="danger" sx={{ mb: 2 }}>
              <Typography level="body-sm">{error}</Typography>
            </Alert>
          )}

          {/* Dependencies Display */}
          {dependencies && (
            <Card sx={{ p: 2, mb: 2 }}>
              <Typography level="title-sm" sx={{ mb: 1 }}>
                📊 Dependency Analysis
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Typography level="body-sm" fontWeight="bold">
                  This cell depends on:
                </Typography>
                <Typography level="body-xs" sx={{ fontFamily: 'monospace' }}>
                  {dependencies.dependencies.length > 0
                    ? dependencies.dependencies.join(', ')
                    : 'No dependencies'}
                </Typography>
              </Box>

              <Box>
                <Typography level="body-sm" fontWeight="bold">
                  Cells that depend on this:
                </Typography>
                <Typography level="body-xs" sx={{ fontFamily: 'monospace' }}>
                  {dependencies.dependents.length > 0
                    ? dependencies.dependents.join(', ')
                    : 'No dependents'}
                </Typography>
              </Box>
            </Card>
          )}

          {/* Info Box */}
          <Card sx={{ p: 2, bgcolor: 'primary.softBg' }}>
            <Typography level="body-sm">
              <strong>💡 Tip:</strong> All calculations run in a Web Worker, so the UI never freezes
              even with complex formulas!
            </Typography>
          </Card>
        </Box>
      </Stack>
    </Box>
  );
};

export default HyperFormulaDemo;
