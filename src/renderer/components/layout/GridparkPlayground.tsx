import React from 'react';
import { styled } from '@mui/joy/styles';

const PlaygroundWrapper = styled('div')(({ theme }) => ({
  display: 'flex',
  width: '100%',
  minHeight: '100vh',
  position: 'relative',
  overflow: 'hidden',
  background: `radial-gradient(circle at 15% 20%, ${theme.palette.primary.solidBg}33, transparent 45%),
               radial-gradient(circle at 80% 15%, ${theme.palette.info.solidBg}33, transparent 45%),
               radial-gradient(circle at 20% 80%, ${theme.palette.success.solidBg}33, transparent 45%),
               linear-gradient(135deg,
                 ${theme.palette.primary.solidBg},
                 ${theme.palette.info.solidBg},
                 ${theme.palette.success.solidBg},
                 ${theme.palette.warning.solidBg})`,
  backgroundSize: '500% 500%',
  animation: 'gridparkGradient 24s ease infinite',
  '&::after': {
    content: '""',
    position: 'absolute',
    inset: 0,
    backgroundImage:
      'linear-gradient(transparent 96%, #FFFFFF0D 96%), linear-gradient(90deg, transparent 96%, #FFFFFF0D 96%)',
    backgroundSize: '48px 48px',
    mixBlendMode: 'soft-light',
    opacity: 0.8,
    pointerEvents: 'none',
  },
  '@keyframes gridparkGradient': {
    '0%': { backgroundPosition: '0% 50%' },
    '50%': { backgroundPosition: '100% 50%' },
    '100%': { backgroundPosition: '0% 50%' },
  },
}));

const PlaygroundBackdrop = styled('div')({
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  zIndex: 0,
});

const PlaygroundContent = styled('div')({
  position: 'relative',
  zIndex: 1,
  flex: 1,
  width: '100%',
});

const Bubble = styled('span')(({ theme }) => ({
  position: 'absolute',
  borderRadius: '50%',
  opacity: 0.35,
  background: theme.palette.primary.solidBg,
  mixBlendMode: 'screen',
  animation: 'gridparkBubble 18s ease-in-out infinite',
  filter: 'blur(0.5px)',
  '@keyframes gridparkBubble': {
    '0%': { transform: 'translate3d(0,0,0) scale(0.9)' },
    '50%': { transform: 'translate3d(-30px,-25px,0) scale(1.2)' },
    '100%': { transform: 'translate3d(0,0,0) scale(0.9)' },
  },
}));

const Polygon = styled('span')(({ theme }) => ({
  position: 'absolute',
  width: 36,
  height: 36,
  opacity: 0.25,
  border: `2px solid ${theme.palette.info.solidBg}`,
  transformOrigin: 'center',
  animation: 'gridparkSpin 20s linear infinite',
  clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
  '@keyframes gridparkSpin': {
    '0%': { transform: 'rotate(0deg) scale(1)' },
    '50%': { transform: 'rotate(180deg) scale(1.1)' },
    '100%': { transform: 'rotate(360deg) scale(1)' },
  },
}));

const Sparkle = styled('span')(({ theme }) => ({
  position: 'absolute',
  width: 8,
  height: 8,
  borderRadius: '50%',
  background: theme.palette.success.solidBg,
  opacity: 0.6,
  animation: 'gridparkSparkle 3.2s ease-in-out infinite',
  mixBlendMode: 'screen',
  '&::before, &::after': {
    content: '""',
    position: 'absolute',
    inset: 0,
    borderRadius: 'inherit',
    border: `1px solid ${theme.palette.warning.solidBg}`,
    opacity: 0.7,
  },
  '&::after': {
    filter: 'blur(2px)',
  },
  '@keyframes gridparkSparkle': {
    '0%': { transform: 'scale(0) translateY(0)', opacity: 0 },
    '25%': { transform: 'scale(1) translateY(-4px)', opacity: 1 },
    '100%': { transform: 'scale(0) translateY(-10px)', opacity: 0 },
  },
}));

const playgroundShapes = [
  { top: '12%', left: '8%', size: 240, type: 'bubble' },
  { top: '65%', left: '15%', size: 180, type: 'bubble' },
  { top: '25%', left: '78%', size: 260, type: 'bubble' },
  { top: '70%', left: '75%', type: 'polygon' },
  { top: '18%', left: '55%', type: 'polygon' },
  { top: '40%', left: '30%', type: 'polygon' },
  { top: '35%', left: '12%', type: 'sparkle' },
  { top: '58%', left: '60%', type: 'sparkle' },
  { top: '72%', left: '42%', type: 'sparkle' },
];

export const GridparkPlayground: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <PlaygroundWrapper>
    <PlaygroundBackdrop>
      {playgroundShapes.map((shape, index) => {
        if (shape.type === 'bubble') {
          return (
            <Bubble
              key={`bubble-${index}`}
              sx={{
                top: shape.top,
                left: shape.left,
                width: shape.size,
                height: shape.size,
                animationDelay: `${index * 1.1}s`,
              }}
            />
          );
        }
        if (shape.type === 'polygon') {
          return (
            <Polygon
              key={`polygon-${index}`}
              sx={{
                top: shape.top,
                left: shape.left,
                animationDelay: `${index * 1.4}s`,
              }}
            />
          );
        }
        return (
          <Sparkle
            key={`sparkle-${index}`}
            sx={{
              top: shape.top,
              left: shape.left,
              animationDelay: `${index * 0.7}s`,
            }}
          />
        );
      })}
    </PlaygroundBackdrop>
    <PlaygroundContent>{children}</PlaygroundContent>
  </PlaygroundWrapper>
);
