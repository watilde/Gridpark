import type { JSX } from 'react';

import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import Link from '@mui/joy/Link';
import Stack from '@mui/joy/Stack';
import Typography from '@mui/joy/Typography';

export const Home = (): JSX.Element => (
  <Box
    sx={{
      minHeight: '100vh',
      bgcolor: 'background.body',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      px: 4,
      py: 10,
    }}
  >
    <Stack spacing={3} alignItems="center" textAlign="center" maxWidth={440} sx={{ width: '100%' }}>
      <Stack spacing={1}>
        <Typography level="h1" fontSize={{ xs: '2.5rem', md: '3rem' }}>
          Gridpark
        </Typography>
        <Typography level="body-lg" sx={{ color: 'neutral.600' }}>
          Kickstart your Electron + React app with Joy UI design tokens and theming in place.
        </Typography>
      </Stack>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} useFlexGap>
        <Button
          component="a"
          href="https://www.electronforge.io/"
          target="_blank"
          rel="noreferrer"
          variant="solid"
        >
          Electron Forge Docs
        </Button>
        <Button
          component="a"
          href="https://mui.com/joy-ui/getting-started/overview/"
          target="_blank"
          rel="noreferrer"
          variant="outlined"
        >
          Joy UI Overview
        </Button>
      </Stack>
      <Typography level="body-sm" sx={{ color: 'neutral.500' }}>
        Need to add more pages? Create them under `src/renderer/pages` and hook them up through the router
        of your choice.
      </Typography>
      <Link
        href="https://github.com/electron/forge"
        target="_blank"
        rel="noreferrer"
        fontWeight="lg"
        sx={{ color: 'primary.plainColor' }}
      >
        View on GitHub
      </Link>
    </Stack>
  </Box>
);

export default Home;
