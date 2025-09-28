import React from 'react';
import { styled } from '@mui/joy/styles';
import { Sheet } from '@mui/joy';

const LayoutContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  backgroundColor: theme.palette.background.body,
  fontFamily: theme.fontFamily.body,
}));

const Header = styled(Sheet)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 20px',
  backgroundColor: theme.palette.background.surface,
  borderBottom: `1px solid ${theme.palette.divider}`,
  zIndex: 100,
  minHeight: '60px',
}));

const MainArea = styled('div')({
  display: 'flex',
  flex: 1,
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

const Content = styled('main')(({ theme }) => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: theme.palette.background.body,
  overflow: 'auto',
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
      {header && (
        <Header variant="outlined">
          {header}
        </Header>
      )}

      <MainArea>
        {!hideSidebar && sidebar && (
          <Sidebar variant="outlined">
            {sidebar}
          </Sidebar>
        )}

        <Content>
          {children}
        </Content>
      </MainArea>

      {!hideFooter && footer && (
        <Footer variant="outlined">
          {footer}
        </Footer>
      )}
    </LayoutContainer>
  );
};

AppLayout.displayName = 'GridparkAppLayout';