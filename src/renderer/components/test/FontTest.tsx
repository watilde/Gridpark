import React from 'react';

export interface FontTestProps {
  /** Test text content */
  text?: string;
}

/**
 * FontTest component to verify Caveat and Noto Sans fonts are loading correctly from Fontsource
 */
export const FontTest: React.FC<FontTestProps> = ({
  text = 'The quick brown fox jumps over the lazy dog',
}) => {
  return (
    <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography level="h1" sx={{ fontFamily: 'body' }}>
        Noto Sans Body Font: {text}
      </Typography>

      <Typography level="h1" sx={{ fontFamily: 'display' }}>
        Caveat Display Font: {text}
      </Typography>

      <Box sx={{ mt: 2 }}>
        <Typography level="body-sm" sx={{ fontFamily: 'body', mb: 1 }}>
          Body font should be: "Noto Sans", system-ui, sans-serif
        </Typography>
        <Typography level="body-sm" sx={{ fontFamily: 'display' }}>
          Display font should be: "Caveat", cursive
        </Typography>
      </Box>
    </Box>
  );
};
