import { useId } from 'react';

/**
 * Hook to generate SSR-safe unique IDs for form elements
 * Uses React's useId hook for proper ID generation
 */
export const useFormIds = (prefix?: string) => {
  const baseId = useId();
  const prefixedId = prefix ? `${prefix}-${baseId}` : baseId;

  return {
    /**
     * Base ID for the form element
     */
    id: prefixedId,

    /**
     * ID for the label element
     */
    labelId: `${prefixedId}-label`,

    /**
     * ID for the helper/error text element
     */
    helperTextId: `${prefixedId}-helper-text`,

    /**
     * ID for the description text element
     */
    descriptionId: `${prefixedId}-description`,

    /**
     * ID for the error message element
     */
    errorId: `${prefixedId}-error`,

    /**
     * Generate a unique ID for a specific field
     */
    fieldId: (fieldName: string) => `${prefixedId}-${fieldName}`,

    /**
     * Generate ARIA attributes for accessibility
     */
    getAriaProps: (options?: {
      hasLabel?: boolean;
      hasDescription?: boolean;
      hasError?: boolean;
      hasHelperText?: boolean;
    }) => {
      const { hasLabel, hasDescription, hasError, hasHelperText } = options ?? {};
      const describedBy: string[] = [];

      if (hasDescription) describedBy.push(`${prefixedId}-description`);
      if (hasHelperText) describedBy.push(`${prefixedId}-helper-text`);
      if (hasError) describedBy.push(`${prefixedId}-error`);

      return {
        id: prefixedId,
        'aria-labelledby': hasLabel ? `${prefixedId}-label` : undefined,
        'aria-describedby': describedBy.length > 0 ? describedBy.join(' ') : undefined,
        'aria-invalid': hasError ? true : undefined,
      };
    },
  };
};

/**
 * Hook to generate unique IDs for tab components
 */
export const useTabIds = (prefix?: string) => {
  const baseId = useId();
  const prefixedId = prefix ? `${prefix}-${baseId}` : baseId;

  return {
    /**
     * Generate tab ID
     */
    tabId: (index: number) => `${prefixedId}-tab-${index}`,

    /**
     * Generate tab panel ID
     */
    tabPanelId: (index: number) => `${prefixedId}-tabpanel-${index}`,

    /**
     * Generate ARIA props for a tab
     */
    getTabAriaProps: (index: number) => ({
      id: `${prefixedId}-tab-${index}`,
      'aria-controls': `${prefixedId}-tabpanel-${index}`,
    }),

    /**
     * Generate ARIA props for a tab panel
     */
    getTabPanelAriaProps: (index: number) => ({
      id: `${prefixedId}-tabpanel-${index}`,
      'aria-labelledby': `${prefixedId}-tab-${index}`,
      role: 'tabpanel',
    }),
  };
};

/**
 * Hook to generate unique IDs for list components
 */
export const useListIds = (prefix?: string) => {
  const baseId = useId();
  const prefixedId = prefix ? `${prefix}-${baseId}` : baseId;

  return {
    /**
     * Generate list item ID
     */
    itemId: (index: number) => `${prefixedId}-item-${index}`,

    /**
     * Generate list item ID by key
     */
    itemIdByKey: (key: string) => `${prefixedId}-item-${key}`,

    /**
     * Generate ARIA props for a list
     */
    getListAriaProps: (label?: string) => ({
      id: prefixedId,
      role: 'list',
      'aria-label': label,
    }),

    /**
     * Generate ARIA props for a list item
     */
    getListItemAriaProps: (index: number) => ({
      id: `${prefixedId}-item-${index}`,
      role: 'listitem',
    }),
  };
};

/**
 * Hook to generate unique IDs for modal/dialog components
 */
export const useModalIds = (prefix?: string) => {
  const baseId = useId();
  const prefixedId = prefix ? `${prefix}-${baseId}` : baseId;

  return {
    /**
     * Modal ID
     */
    modalId: prefixedId,

    /**
     * Modal title ID
     */
    titleId: `${prefixedId}-title`,

    /**
     * Modal description ID
     */
    descriptionId: `${prefixedId}-description`,

    /**
     * Generate ARIA props for a modal
     */
    getModalAriaProps: () => ({
      id: prefixedId,
      role: 'dialog',
      'aria-modal': true,
      'aria-labelledby': `${prefixedId}-title`,
      'aria-describedby': `${prefixedId}-description`,
    }),
  };
};

/**
 * Hook to generate unique IDs for menu/dropdown components
 */
export const useMenuIds = (prefix?: string) => {
  const baseId = useId();
  const prefixedId = prefix ? `${prefix}-${baseId}` : baseId;

  return {
    /**
     * Menu button ID
     */
    buttonId: `${prefixedId}-button`,

    /**
     * Menu ID
     */
    menuId: `${prefixedId}-menu`,

    /**
     * Generate menu item ID
     */
    itemId: (index: number) => `${prefixedId}-item-${index}`,

    /**
     * Generate ARIA props for menu button
     */
    getButtonAriaProps: (isOpen: boolean) => ({
      id: `${prefixedId}-button`,
      'aria-haspopup': true,
      'aria-expanded': isOpen,
      'aria-controls': isOpen ? `${prefixedId}-menu` : undefined,
    }),

    /**
     * Generate ARIA props for menu
     */
    getMenuAriaProps: () => ({
      id: `${prefixedId}-menu`,
      role: 'menu',
      'aria-labelledby': `${prefixedId}-button`,
    }),
  };
};
