import React from 'react';
import { render, screen, fireEvent } from '../../../../../test/utils';
import { Input } from './Input';

describe('Input Component', () => {
  it('renders without crashing', () => {
    render(<Input />);
    const inputElement = screen.getByRole('textbox');
    expect(inputElement).toBeInTheDocument();
  });

  it('displays label when provided', () => {
    render(<Input label="Test Label" />);
    expect(screen.getByText('Test Label')).toBeInTheDocument();
  });

  it('displays helper text when provided', () => {
    render(<Input helperText="This is helper text" />);
    expect(screen.getByText('This is helper text')).toBeInTheDocument();
  });

  it('handles string error prop correctly', () => {
    render(<Input error="This is an error message" />);
    
    // Should display the error message
    expect(screen.getByText('This is an error message')).toBeInTheDocument();
    
    // Should set Joy UI error prop to true (boolean)
    const inputElement = screen.getByRole('textbox');
    expect(inputElement).toHaveAttribute('aria-invalid', 'true');
  });

  it('prioritizes error message over other helper text', () => {
    render(
      <Input 
        error="Error message" 
        success="Success message"
        helperText="Regular helper text"
      />
    );
    
    // Should show error message, not success or helper text
    expect(screen.getByText('Error message')).toBeInTheDocument();
    expect(screen.queryByText('Success message')).not.toBeInTheDocument();
    expect(screen.queryByText('Regular helper text')).not.toBeInTheDocument();
  });

  it('displays success message when no error is present', () => {
    render(
      <Input 
        success="Success message"
        helperText="Regular helper text"
      />
    );
    
    // Should show success message, not helper text
    expect(screen.getByText('Success message')).toBeInTheDocument();
    expect(screen.queryByText('Regular helper text')).not.toBeInTheDocument();
  });

  it('applies code styling when code prop is true', () => {
    render(<Input code={true} />);
    // The data-code attribute is on the styled component, not the input itself
    const inputContainer = document.querySelector('[data-code="true"]');
    expect(inputContainer).toBeInTheDocument();
  });

  it('handles onChange events', () => {
    const handleChange = jest.fn();
    render(<Input onChange={handleChange} />);
    
    const inputElement = screen.getByRole('textbox');
    fireEvent.change(inputElement, { target: { value: 'test value' } });
    
    expect(handleChange).toHaveBeenCalled();
  });

  it('applies custom color prop', () => {
    render(<Input color="primary" />);
    const inputElement = screen.getByRole('textbox');
    
    // Joy UI should apply the color class
    expect(inputElement.closest('.MuiInput-root')).toHaveClass(/primary/i);
  });

  it('sets error color when error prop is provided', () => {
    render(<Input error="Error message" />);
    const inputElement = screen.getByRole('textbox');
    
    // Should apply danger color for errors
    expect(inputElement.closest('.MuiInput-root')).toHaveClass(/danger/i);
  });

  it('sets success color when success prop is provided', () => {
    render(<Input success="Success message" />);
    const inputElement = screen.getByRole('textbox');
    
    // Should apply success color
    expect(inputElement.closest('.MuiInput-root')).toHaveClass(/success/i);
  });

  it('forwards props to underlying Joy UI Input', () => {
    render(<Input placeholder="Test placeholder" disabled />);
    const inputElement = screen.getByRole('textbox');
    
    expect(inputElement).toHaveAttribute('placeholder', 'Test placeholder');
    expect(inputElement).toBeDisabled();
  });

  it('maintains form control structure with label and helper text', () => {
    render(
      <Input 
        label="Form Label"
        helperText="Helper text"
        error=""
      />
    );
    
    // Should have proper form control structure
    const formControl = screen.getByRole('textbox').closest('.MuiFormControl-root');
    expect(formControl).toBeInTheDocument();
    
    const label = screen.getByText('Form Label');
    const helperText = screen.getByText('Helper text');
    
    expect(label).toBeInTheDocument();
    expect(helperText).toBeInTheDocument();
  });

  it('handles boolean error conversion correctly', () => {
    const { rerender } = render(<Input />);
    
    // No error - should not have error attribute
    let inputElement = screen.getByRole('textbox');
    expect(inputElement).not.toHaveAttribute('aria-invalid', 'true');
    
    // Empty string error - should not have error attribute
    rerender(<Input error="" />);
    inputElement = screen.getByRole('textbox');
    expect(inputElement).not.toHaveAttribute('aria-invalid', 'true');
    
    // Non-empty string error - should have error attribute
    rerender(<Input error="Some error" />);
    inputElement = screen.getByRole('textbox');
    expect(inputElement).toHaveAttribute('aria-invalid', 'true');
  });

  it('has correct display name', () => {
    expect(Input.displayName).toBe('GridparkInput');
  });
});