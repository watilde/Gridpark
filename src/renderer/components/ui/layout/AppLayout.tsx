import React from 'react';
import { styled } from '@mui/joy/styles';
import { Sheet } from '@mui/joy';

const LayoutContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  flex: 1,
  height: '100vh',
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
  /**
   * Header content (toolbar, navigation, etc.)
   */
  header?: React.ReactNode;
  /**
   * Sidebar content (panels, navigation, etc.)
   */
  sidebar?: React.ReactNode;
  /**
   * Main content area
   */
  children: React.ReactNode;
  /**
   * Footer content (status bar, info, etc.)
   */
  footer?: React.ReactNode;
  /**
   * Hide sidebar completely
   */
  hideSidebar?: boolean;
  /**
   * Hide footer completely
   */
  hideFooter?: boolean;
}

/**
 * Gridpark AppLayout Component
 * 
 * Main application layout with header, sidebar, content, and footer areas:
 * - Code-first: IDE-like layout with familiar zones
 * - Flexible: Optional sidebar and footer
 * - Responsive: Proper overflow handling and scrolling
 * - Developer-friendly: Clear content separation and z-index management
 */
export const AppLayout: React.FC<AppLayoutProps> = ({
  header,
  sidebar,
  children,
  footer,
  hideSidebar = false,
  hideFooter = false,
}) => {
  return (
    <LayoutContainer>
      {!hideSidebar && sidebar && (
        <Sidebar variant="outlined">
          {sidebar}
        </Sidebar>
      )}

      <MainContent>
        {header && (
          <HeaderBar variant="outlined">
            {header}
          </HeaderBar>
        )}

        <Content>
          {children}
        </Content>

        {!hideFooter && footer && (
          <Footer variant="outlined">
            {footer}
          </Footer>
        )}
      </MainContent>
    </LayoutContainer>
  );
};

AppLayout.displayName = 'GridparkAppLayout';
