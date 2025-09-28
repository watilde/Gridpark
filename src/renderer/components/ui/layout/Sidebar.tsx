import React from 'react';
import { styled } from '@mui/joy/styles';
import { Typography, Divider } from '@mui/joy';
import { Icon } from '../base/Icon/Icon';

const SidebarContainer = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  overflow: 'hidden',
});

const SidebarSection = styled('div')(({ theme }) => ({
  padding: '12px 16px',
  
  '& .section-title': {
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: theme.palette.text.secondary,
    marginBottom: '8px',
  },
}));

const SidebarContent = styled('div')({
  flex: 1,
  overflow: 'auto',
});

const MenuList = styled('ul')({
  listStyle: 'none',
  margin: 0,
  padding: 0,
});

const MenuItem = styled('li')<{ active?: boolean }>(({ theme, active }) => ({
  margin: '2px 0',
  
  '& .menu-item': {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    borderRadius: theme.radius.sm,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    fontSize: '14px',
    color: active ? theme.palette.primary[600] : theme.palette.text.primary,
    backgroundColor: active ? theme.palette.primary[100] : 'transparent',
    
    '&:hover': {
      backgroundColor: active 
        ? theme.palette.primary[200] 
        : theme.palette.neutral[100],
    },
    
    '& .menu-icon': {
      opacity: active ? 1 : 0.7,
    },
    
    '& .menu-label': {
      flex: 1,
    },
    
    '& .menu-badge': {
      fontSize: '11px',
      padding: '2px 6px',
      borderRadius: '10px',
      backgroundColor: theme.palette.neutral[200],
      color: theme.palette.text.secondary,
    },
  },
}));

export interface SidebarItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
  active?: boolean;
  onClick?: () => void;
}

export interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

export interface SidebarProps {
  /**
   * Sidebar sections with navigation items
   */
  sections?: SidebarSection[];
  /**
   * Custom sidebar content
   */
  children?: React.ReactNode;
  /**
   * Active item ID
   */
  activeItemId?: string;
  /**
   * Item click handler
   */
  onItemClick?: (item: SidebarItem) => void;
}

/**
 * Gridpark Sidebar Component
 * 
 * Navigation sidebar with sections and menu items:
 * - Code-first: IDE-inspired navigation structure
 * - Organized: Clear sections with visual separation
 * - Interactive: Hover states and active item indication
 * - Flexible: Support for icons, badges, and custom content
 */
export const Sidebar: React.FC<SidebarProps> = ({
  sections,
  children,
  activeItemId,
  onItemClick,
}) => {
  const handleItemClick = (item: SidebarItem) => {
    onItemClick?.(item);
    item.onClick?.();
  };

  const renderMenuItem = (item: SidebarItem) => {
    const isActive = item.active || item.id === activeItemId;
    
    return (
      <MenuItem key={item.id} active={isActive}>
        <div 
          className="menu-item"
          onClick={() => handleItemClick(item)}
        >
          {item.icon && (
            <div className="menu-icon">
              <Icon size="sm" color={isActive ? 'primary' : 'neutral'}>
                {item.icon}
              </Icon>
            </div>
          )}
          <span className="menu-label">{item.label}</span>
          {item.badge && (
            <span className="menu-badge">{item.badge}</span>
          )}
        </div>
      </MenuItem>
    );
  };

  const renderSection = (section: SidebarSection, index: number) => (
    <React.Fragment key={section.title}>
      <SidebarSection>
        <div className="section-title">{section.title}</div>
        <MenuList>
          {section.items.map(renderMenuItem)}
        </MenuList>
      </SidebarSection>
      {index < (sections?.length || 0) - 1 && <Divider />}
    </React.Fragment>
  );

  return (
    <SidebarContainer>
      {children ? (
        children
      ) : (
        <SidebarContent>
          {sections?.map(renderSection)}
        </SidebarContent>
      )}
    </SidebarContainer>
  );
};

Sidebar.displayName = 'GridparkSidebar';