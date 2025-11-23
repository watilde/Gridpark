import React from 'react';
import { styled } from '@mui/joy/styles';
import { Sheet } from '@mui/joy';

const LayoutContainer = styled('div', {
  shouldForwardProp: (prop) => prop !== 'fullHeight',
})<{ fullHeight: boolean }>(({ theme, fullHeight }) => ({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  height: fullHeight ? '100vh' : 'auto',
  backgroundColor: theme.palette.background.body,
  fontFamily: theme.fontFamily.body,
}));

// Container for sidebar and main content (below header)
const BodyContainer = styled('div')({
  display: 'flex',
  flex: 1,
  minHeight: 0,
  overflow: 'hidden',
});

const Sidebar = styled(Sheet)(({ theme }) => ({
  width: '280px',
  backgroundColor: theme.palette.background.surface,
  borderRight: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'auto',
}));

const MainContent = styled('div')({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
  minHeight: 0,
});

// Full-width header bar (spans entire width)
const HeaderBar = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  backgroundColor: theme.palette.background.surface,
  zIndex: 100,
  flexShrink: 0,
}));

const Content = styled('main')(({ theme }) => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: theme.palette.background.body,
  overflow: 'auto',
  minHeight: 0,
}));

const Footer = styled(Sheet)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '8px 20px',
  backgroundColor: theme.palette.background.surface,
  borderTop: `1px solid ${theme.palette.divider}`,
  fontSize: '12px',
  color: theme.palette.text.secondary,
  minHeight: '32px',
}));

export interface AppLayoutProps {
  header?: React.ReactNode;
  sidebar?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  hideSidebar?: boolean;
  hideFooter?: boolean;
  className?: string;
  fullHeight?: boolean;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  header,
  sidebar,
  children,
  footer,
  hideSidebar = false,
  hideFooter = false,
  className,
  fullHeight = true,
}) => {
  return (
    <LayoutContainer className={className} fullHeight={fullHeight}>
      {/* Header spans full width at the top */}
      {header && <HeaderBar>{header}</HeaderBar>}
      
      {/* Body contains sidebar and main content side by side */}
      <BodyContainer>
        {!hideSidebar && sidebar && <Sidebar variant="outlined">{sidebar}</Sidebar>}
        <MainContent>
          <Content>{children}</Content>
          {!hideFooter && footer && <Footer variant="outlined">{footer}</Footer>}
        </MainContent>
      </BodyContainer>
    </LayoutContainer>
  );
};

AppLayout.displayName = 'GridparkAppLayout';

/**
 * Excel-style layout with full-width header:
 * 
 * ┌─────────────────────────────────────────┐
 * │          Full Width Header              │
 * ├──────────┬──────────────────────────────┤
 * │          │                              │
 * │ Sidebar  │      Main Content            │
 * │          │                              │
 * └──────────┴──────────────────────────────┘
 */
