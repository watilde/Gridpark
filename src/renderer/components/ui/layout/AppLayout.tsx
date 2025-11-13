import React from 'react';
import { styled } from '@mui/joy/styles';
import { Sheet } from '@mui/joy';

const LayoutContainer = styled('div', {
  shouldForwardProp: (prop) => prop !== 'fullHeight',
})<{ fullHeight: boolean }>(({ theme, fullHeight }) => ({
  display: 'flex',
  flex: 1,
  height: fullHeight ? '100vh' : 'auto',
  backgroundColor: theme.palette.background.body,
  fontFamily: theme.fontFamily.body,
}));

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

const HeaderBar = styled(Sheet)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 20px',
  backgroundColor: theme.palette.background.surface,
  borderBottom: `1px solid ${theme.palette.divider}`,
  minHeight: '60px',
  zIndex: 1,
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
      {!hideSidebar && sidebar && <Sidebar variant="outlined">{sidebar}</Sidebar>}
      <MainContent>
        {header && <HeaderBar variant="outlined">{header}</HeaderBar>}
        <Content>{children}</Content>
        {!hideFooter && footer && <Footer variant="outlined">{footer}</Footer>}
      </MainContent>
    </LayoutContainer>
  );
};

AppLayout.displayName = 'GridparkAppLayout';
