import React from 'react';
import { Modal as JoyModal, ModalDialog, DialogTitle, DialogContent, DialogActions, Divider } from '@mui/joy';
import type { ModalProps as JoyModalProps } from '@mui/joy';
import { styled } from '@mui/joy/styles';
import { Close } from '@mui/icons-material';
import { Button } from '../Button/Button';

const GridparkModalDialog = styled(ModalDialog)(({ theme }) => ({
  borderRadius: theme.radius.lg,
  border: `1px solid ${theme.palette.divider}`,
  maxWidth: '90vw',
  maxHeight: '90vh',
  
  // Code-first experience: keyboard focus management
  '&:focus': {
    outline: 'none',
  },
}));

const ModalHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '20px 24px 0 24px',
  
  '& .modal-title': {
    fontFamily: theme.fontFamily.body,
    fontSize: '20px',
    fontWeight: 600,
    color: theme.palette.text.primary,
    margin: 0,
  },

  '& .modal-close-button': {
    minWidth: '32px',
    minHeight: '32px',
    padding: '8px',
  },
}));

const ModalBody = styled(DialogContent)({
  padding: '24px',
  overflow: 'auto',
});

const ModalFooter = styled(DialogActions)({
  padding: '0 24px 20px 24px',
  gap: '8px',
  justifyContent: 'flex-end',
});

export interface ModalProps extends Omit<JoyModalProps, 'children'> {
  /**
   * Modal title
   */
  title?: string;
  /**
   * Modal content
   */
  children: React.ReactNode;
  /**
   * Action buttons in footer
   */
  actions?: React.ReactNode;
  /**
   * Show close button in header
   */
  showCloseButton?: boolean;
  /**
   * Modal size
   */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /**
   * Close handler
   */
  onClose?: () => void;
}

/**
 * Gridpark Modal Component
 * 
 * Accessible modal dialog following Gridpark design principles:
 * - Code-first: Keyboard navigation and focus management
 * - Immediate feedback: Clear open/close states
 * - Hackable: Flexible composition with header, content, actions
 * - Developer-friendly: Easy integration with forms and complex content
 */
export const Modal: React.FC<ModalProps> = ({
  title,
  children,
  actions,
  showCloseButton = true,
  size = 'md',
  onClose,
  open,
  ...props
}) => {
  const handleClose = () => {
    onClose?.();
  };

  const getSizeProps = () => {
    switch (size) {
      case 'sm':
        return { minWidth: '400px', maxWidth: '500px' };
      case 'lg':
        return { minWidth: '700px', maxWidth: '900px' };
      case 'xl':
        return { minWidth: '900px', maxWidth: '1200px' };
      default:
        return { minWidth: '500px', maxWidth: '700px' };
    }
  };

  return (
    <JoyModal
      open={open}
      onClose={handleClose}
      {...props}
    >
      <GridparkModalDialog
        variant="outlined"
        sx={getSizeProps()}
      >
        {(title || showCloseButton) && (
          <>
            <ModalHeader>
              {title && <h2 className="modal-title">{title}</h2>}
              {showCloseButton && (
                <Button
                  variant="plain"
                  color="neutral"
                  size="sm"
                  className="modal-close-button"
                  onClick={handleClose}
                  aria-label="Close modal"
                >
                  <Close />
                </Button>
              )}
            </ModalHeader>
            <Divider sx={{ mx: 0 }} />
          </>
        )}

        <ModalBody>
          {children}
        </ModalBody>

        {actions && (
          <>
            <Divider sx={{ mx: 0 }} />
            <ModalFooter>
              {actions}
            </ModalFooter>
          </>
        )}
      </GridparkModalDialog>
    </JoyModal>
  );
};

Modal.displayName = 'GridparkModal';