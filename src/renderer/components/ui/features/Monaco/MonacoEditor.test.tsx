import React from 'react';
import { render, screen, fireEvent } from '../../../../../test/utils';
import { MonacoEditor } from './MonacoEditor';
import Editor from '@monaco-editor/react';

jest.mock('@monaco-editor/react', () => {
  const Mock = jest.fn(
    ({ value = '', onChange, readOnly, language, theme }: Record<string, any>) => (
      <textarea
        data-testid="monaco-editor"
        value={value}
        readOnly={readOnly}
        data-language={language}
        data-theme={theme}
        onChange={(event) => onChange?.(event.target.value)}
      />
    ),
  );
  return { __esModule: true, default: Mock };
});

const mockedEditor = Editor as jest.Mock;

describe('MonacoEditor Component', () => {
  it('renders without crashing', () => {
    render(<MonacoEditor />);
    const editorElement = screen.getByTestId('monaco-editor');
    expect(editorElement).toBeInTheDocument();
  });

  it('displays default value when provided', () => {
    const testValue = 'console.log("Hello World");';
    render(<MonacoEditor value={testValue} />);
    
    const editorElement = screen.getByDisplayValue(testValue);
    expect(editorElement).toBeInTheDocument();
  });

  it('passes language and theme props to monaco', () => {
    render(<MonacoEditor language="typescript" theme="vs" />);
    const editorElement = screen.getByTestId('monaco-editor');
    expect(editorElement).toHaveAttribute('data-language', 'typescript');
    expect(editorElement).toHaveAttribute('data-theme', 'vs');
  });

  it('applies correct dimensions', () => {
    render(<MonacoEditor height="400px" width="100%" />);
    
    const container = screen.getByTestId('monaco-editor').parentElement;
    expect(container).toHaveStyle('height: 400px');
    expect(container).toHaveStyle('width: 100%');
  });

  it('handles onChange events', () => {
    const handleChange = jest.fn();
    render(<MonacoEditor value="" onChange={handleChange} />);
    
    const editorElement = screen.getByTestId('monaco-editor');
    fireEvent.change(editorElement, { target: { value: 'new code' } });
    
    expect(handleChange).toHaveBeenCalledWith('new code');
  });

  it('applies readOnly mode correctly', () => {
    render(<MonacoEditor readOnly={true} />);
    
    const editorElement = screen.getByTestId('monaco-editor');
    expect(editorElement).toHaveAttribute('readonly');
  });

  it('applies default props correctly', () => {
    render(<MonacoEditor />);
    
    const editorElement = screen.getByTestId('monaco-editor');
    expect(editorElement).toHaveAttribute('data-language', 'javascript');
    expect(editorElement).toHaveAttribute('data-theme', 'vs-dark');
    expect(editorElement).not.toHaveAttribute('readonly');
  });

  it('passes custom options to monaco', () => {
    render(<MonacoEditor options={{ fontSize: 20 }} />);
    expect(mockedEditor).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({ fontSize: 20 }),
      }),
      expect.anything(),
    );
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
    
    const container = screen.getByTestId('monaco-editor').parentElement;
    expect(container).toHaveStyle('border-radius: 8px');
    expect(container).toHaveStyle('border: 1px solid');
  });

  it('handles different themes', () => {
    const themes = ['vs', 'vs-dark', 'hc-black'] as const;
    
    themes.forEach((theme) => {
      const { unmount } = render(<MonacoEditor theme={theme} />);
      const editorElement = screen.getByTestId('monaco-editor');
      expect(editorElement).toHaveAttribute('data-theme', theme);
      unmount();
    });
  });

  it('supports custom width and height values', () => {
    render(<MonacoEditor height={300} width="50%" />);
    
    const container = screen.getByTestId('monaco-editor').parentElement;
    expect(container).toHaveStyle('height: 300px');
    expect(container).toHaveStyle('width: 50%');
  });

  it('maintains controlled value', () => {
    render(<MonacoEditor value="abc" />);
    expect(screen.getByDisplayValue('abc')).toBeInTheDocument();
  });
});
