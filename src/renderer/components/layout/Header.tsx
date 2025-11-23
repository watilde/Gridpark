import React from 'react';
import { styled } from '@mui/joy/styles';
import { Typography } from '@mui/joy';
import { Button } from '../base/Button/Button';
import { Icon } from '../base/Icon/Icon';

const HeaderContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
  gap: '16px',
}));

const HeaderLeft = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
});

const HeaderCenter = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  flex: 1,
  justifyContent: 'center',
});

const HeaderRight = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
});

const Logo = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: '18px',
  fontWeight: 700,
  color: theme.palette.text.primary,
  fontFamily: theme.fontFamily.display,
}));

const Breadcrumb = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  fontSize: '14px',
  color: theme.palette.text.secondary,
  
  '& .breadcrumb-item': {
    color: theme.palette.text.secondary,
  },
  
  '& .breadcrumb-separator': {
    margin: '0 4px',
    color: theme.palette.text.tertiary,
  },
  
  '& .breadcrumb-current': {
    color: theme.palette.text.primary,
    fontWeight: 500,
  },
}));

export interface HeaderProps {
  /**
   * Application title or logo
   */
  title?: string;
  /**
   * Custom logo component
   */
  logo?: React.ReactNode;
  /**
   * Breadcrumb navigation items
   */
  breadcrumbs?: Array<{ label: string; current?: boolean }>;
  /**
   * Action buttons on the right side
   */
  actions?: React.ReactNode;
  /**
   * Custom content in the center
   */
  centerContent?: React.ReactNode;
  /**
   * Custom left content
   */
  leftContent?: React.ReactNode;
}

/**
 * Gridpark Header Component
 * 
 * Application header with logo, navigation, and actions:
 * - Code-first: Clean, developer-tool inspired layout
 * - Flexible: Configurable logo, breadcrumbs, and actions
 * - Consistent: Uses Gridpark typography and spacing
 * - Accessible: Proper semantic structure and navigation
 */
export const Header: React.FC<HeaderProps> = ({
  title = 'Gridpark',
  logo,
  breadcrumbs,
  actions,
  centerContent,
  leftContent,
}) => {
  const renderBreadcrumbs = () => {
    if (!breadcrumbs || breadcrumbs.length === 0) return null;
    
    return (
      <Breadcrumb>
        {breadcrumbs.map((item, index) => (
          <React.Fragment key={index}>
            <span 
              className={item.current ? 'breadcrumb-current' : 'breadcrumb-item'}
            >
              {item.label}
            </span>
            {index < breadcrumbs.length - 1 && (
              <span className="breadcrumb-separator">/</span>
            )}
          </React.Fragment>
        ))}
      </Breadcrumb>
    );
  };

  return (
    <HeaderContainer>
      <HeaderLeft>
        {leftContent || (
          <>
            {logo || (
              <Logo>
                {/* Gridpark logo placeholder - could be actual logo */}
                <Icon size="lg" color="primary">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L2 7v10c0 5.55 3.84 9.739 9 11 5.16-1.261 9-5.45 9-11V7l-10-5z"/>
                  </svg>
                </Icon>
                {title}
              </Logo>
            )}
            {renderBreadcrumbs()}
          </>
        )}
      </HeaderLeft>

      {centerContent && (
        <HeaderCenter>
          {centerContent}
        </HeaderCenter>
      )}

      <HeaderRight>
        {actions}
      </HeaderRight>
    </HeaderContainer>
  );
};

Header.displayName = 'GridparkHeader';