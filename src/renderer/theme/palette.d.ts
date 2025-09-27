import '@mui/joy/styles';

declare module '@mui/joy/styles' {
  interface Palette {
    info: { solidBg: string };
  }
  interface PaletteOptions {
    info?: { solidBg: string };
  }
}