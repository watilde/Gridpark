import React from 'react';
import { render, screen, fireEvent } from '../../../../../test/utils';
import { MonacoEditor } from './MonacoEditor';

describe('MonacoEditor Component', () => {
  it('renders without crashing', () => {
    render(<MonacoEditor />);
    const editorElement = screen.getByRole('textbox');
    expect(editorElement).toBeInTheDocument();
  });

  it('displays default value when provided', () => {
    const testValue = 'console.log("Hello World");';
    render(<MonacoEditor value={testValue} />);
    
    const editorElement = screen.getByDisplayValue(testValue);
    expect(editorElement).toBeInTheDocument();
  });

  it('displays placeholder text', () => {
    render(<MonacoEditor language="javascript" />);
    
    // Check placeholder attribute instead of text content
    const editorElement = screen.getByRole('textbox');
    expect(editorElement).toHaveAttribute('placeholder', expect.stringContaining('javascript code editor'));
    expect(editorElement).toHaveAttribute('placeholder', expect.stringContaining('Install @monaco-editor/react'));
  });

  it('applies correct dimensions', () => {
    render(<MonacoEditor height="400px" width="100%" />);
    
    const container = screen.getByRole('textbox').parentElement;
    expect(container).toHaveStyle('height: 400px');
    expect(container).toHaveStyle('width: 100%');
  });

  it('handles onChange events', () => {
    const handleChange = jest.fn();
    render(<MonacoEditor value="" onChange={handleChange} />);
    
    const editorElement = screen.getByRole('textbox');
    fireEvent.change(editorElement, { target: { value: 'new code' } });
    
    expect(handleChange).toHaveBeenCalledWith('new code');
  });

  it('applies readOnly mode correctly', () => {
    render(<MonacoEditor readOnly={true} />);
    
    const editorElement = screen.getByRole('textbox');
    expect(editorElement).toHaveAttribute('readonly');
  });

  it('sets correct data attributes for language and theme', () => {
    render(<MonacoEditor language="typescript" theme="vs-dark" />);
    
    const editorElement = screen.getByRole('textbox');
    expect(editorElement).toHaveAttribute('data-language', 'typescript');
    expect(editorElement).toHaveAttribute('data-theme', 'vs-dark');
  });

  it('applies default props correctly', () => {
    render(<MonacoEditor />);
    
    const editorElement = screen.getByRole('textbox');
    expect(editorElement).toHaveAttribute('data-language', 'javascript');
    expect(editorElement).toHaveAttribute('data-theme', 'vs-dark');
    expect(editorElement).not.toHaveAttribute('readonly');
  });

  it('passes through custom options', () => {
    const customOptions = {
      'data-testid': 'custom-editor',
      tabIndex: 0,
    };
    
    render(<MonacoEditor options={customOptions} />);
    
    const editorElement = screen.getByTestId('custom-editor');
    expect(editorElement).toBeInTheDocument();
    expect(editorElement).toHaveAttribute('tabIndex', '0');
  });

  it('applies monospace font styling', () => {
    render(<MonacoEditor />);
    
    const editorElement = screen.getByRole('textbox');
    expect(editorElement).toHaveStyle('font-family: "JetBrains Mono", monospace');
    expect(editorElement).toHaveStyle('font-size: 14px');
    expect(editorElement).toHaveStyle('line-height: 1.6');
  });

  it('supports different languages in placeholder', () => {
    const { rerender } = render(<MonacoEditor language="python" />);
    let editorElement = screen.getByRole('textbox');
    expect(editorElement).toHaveAttribute('placeholder', expect.stringContaining('python code editor'));
    
    rerender(<MonacoEditor language="json" />);
    editorElement = screen.getByRole('textbox');
    expect(editorElement).toHaveAttribute('placeholder', expect.stringContaining('json code editor'));
  });

  it('handles empty value correctly', () => {
    render(<MonacoEditor value="" />);
    
    const editorElement = screen.getByRole('textbox');
    expect(editorElement).toHaveValue('');
  });

  it('updates value when prop changes', () => {
    const { rerender } = render(<MonacoEditor value="initial value" />);
    
    let editorElement = screen.getByDisplayValue('initial value');
    expect(editorElement).toBeInTheDocument();
    
    rerender(<MonacoEditor value="updated value" />);
    editorElement = screen.getByDisplayValue('updated value');
    expect(editorElement).toBeInTheDocument();
  });

  it('has correct display name', () => {
    expect(MonacoEditor.displayName).toBe('GridparkMonacoEditor');
  });

  it('applies container styling correctly', () => {
    render(<MonacoEditor />);
    
    const container = screen.getByRole('textbox').parentElement;
    expect(container).toHaveStyle('overflow: hidden');
    expect(container).toHaveStyle('border-radius: 8px'); // Actual theme value
  });

  it('handles different themes', () => {
    const themes = ['vs', 'vs-dark', 'hc-black'] as const;
    
    themes.forEach((theme, index) => {
      const { container } = render(<MonacoEditor theme={theme} />);
      const editorElement = container.querySelector('textarea');
      expect(editorElement).toHaveAttribute('data-theme', theme);
    });
  });

  it('supports custom width and height values', () => {
    render(<MonacoEditor height={300} width="50%" />);
    
    const container = screen.getByRole('textbox').parentElement;
    expect(container).toHaveStyle('height: 300px');
    expect(container).toHaveStyle('width: 50%');
  });

  it('maintains proper textarea styling', () => {
    render(<MonacoEditor />);
    
    const editorElement = screen.getByRole('textbox');
    expect(editorElement).toHaveStyle('outline: none');
    expect(editorElement).toHaveStyle('resize: none');
    expect(editorElement).toHaveStyle('background-color: rgba(0, 0, 0, 0)'); // transparent in rgba format
    // Note: border style may be overridden by Joy UI theme
  });
});