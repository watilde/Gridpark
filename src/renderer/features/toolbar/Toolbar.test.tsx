import React from 'react';
import { render, screen, fireEvent, createMockAction } from '../../../../../test/utils';
import { Toolbar } from './Toolbar';

describe('Toolbar Component', () => {
  it('renders without crashing', () => {
    render(<Toolbar />);
    // Should render the toolbar container
    const toolbar = document.querySelector('.MuiBox-root');
    expect(toolbar).toBeInTheDocument();
  });

  it('renders individual actions correctly', () => {
    const actions = [
      createMockAction('action1', { tooltip: 'Action 1' }),
      createMockAction('action2', { tooltip: 'Action 2' }),
    ];

    render(<Toolbar actions={actions} />);

    // Should render both action buttons
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);
  });

  it('handles action clicks correctly', () => {
    const mockClick1 = jest.fn();
    const mockClick2 = jest.fn();

    const actions = [
      createMockAction('action1', { onClick: mockClick1 }),
      createMockAction('action2', { onClick: mockClick2 }),
    ];

    render(<Toolbar actions={actions} />);

    const buttons = screen.getAllByRole('button');

    fireEvent.click(buttons[0]);
    expect(mockClick1).toHaveBeenCalledTimes(1);
    expect(mockClick2).not.toHaveBeenCalled();

    fireEvent.click(buttons[1]);
    expect(mockClick2).toHaveBeenCalledTimes(1);
  });

  it('shows tooltips for actions with tooltip prop', async () => {
    const actions = [createMockAction('action1', { tooltip: 'Save File' })];

    render(<Toolbar actions={actions} />);

    const button = screen.getByRole('button');

    // Hover over the button to show tooltip
    fireEvent.mouseEnter(button);

    // Wait for tooltip to appear
    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip).toHaveTextContent('Save File');
  });

  it('renders actions without tooltips correctly', () => {
    const actions = [createMockAction('action1', { tooltip: undefined })];

    render(<Toolbar actions={actions} />);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();

    // Should not have tooltip wrapper
    fireEvent.mouseEnter(button);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('renders grouped actions with dividers', () => {
    const group1 = [createMockAction('group1-action1'), createMockAction('group1-action2')];
    const group2 = [createMockAction('group2-action1')];

    render(<Toolbar groups={[group1, group2]} />);

    // Should render all buttons
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(3);

    // Should render divider between groups
    const separators = screen.getAllByRole('separator');
    expect(separators).toHaveLength(1);
  });

  it('combines individual actions and groups correctly', () => {
    const actions = [createMockAction('individual')];
    const groups = [[createMockAction('grouped')]];

    render(<Toolbar actions={actions} groups={groups} />);

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);

    // Should have divider between individual actions and groups
    const separators = screen.getAllByRole('separator');
    expect(separators).toHaveLength(1);
  });

  it('renders custom children correctly', () => {
    const customContent = <span data-testid="custom-content">Custom Content</span>;

    render(<Toolbar>{customContent}</Toolbar>);

    expect(screen.getByTestId('custom-content')).toBeInTheDocument();
    expect(screen.getByText('Custom Content')).toBeInTheDocument();
  });

  it('adds dividers before custom children when actions exist', () => {
    const actions = [createMockAction('action1')];
    const customContent = <span data-testid="custom">Custom</span>;

    render(<Toolbar actions={actions}>{customContent}</Toolbar>);

    // Should have button, divider, and custom content
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByRole('separator')).toBeInTheDocument();
    expect(screen.getByTestId('custom')).toBeInTheDocument();
  });

  it('handles disabled actions correctly', () => {
    const actions = [
      createMockAction('enabled', { disabled: false }),
      createMockAction('disabled', { disabled: true }),
    ];

    render(<Toolbar actions={actions} />);

    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).not.toBeDisabled();
    expect(buttons[1]).toBeDisabled();
  });

  it('applies active state correctly', () => {
    const actions = [
      createMockAction('inactive', { active: false }),
      createMockAction('active', { active: true }),
    ];

    render(<Toolbar actions={actions} />);

    const buttons = screen.getAllByRole('button');

    // Active button should have different variant/color
    expect(buttons[1]).toHaveClass(/MuiIconButton-colorPrimary/);
    expect(buttons[0]).not.toHaveClass(/MuiIconButton-colorPrimary/);
  });

  it('supports different button variants', () => {
    const actions = [
      createMockAction('plain', { variant: 'plain' }),
      createMockAction('outlined', { variant: 'outlined' }),
      createMockAction('soft', { variant: 'soft' }),
    ];

    render(<Toolbar actions={actions} />);

    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toHaveClass(/variantPlain/);
    expect(buttons[1]).toHaveClass(/variantOutlined/);
    expect(buttons[2]).toHaveClass(/variantSoft/);
  });

  it('supports different sizes', () => {
    const actions = [createMockAction('action1')];

    const { rerender } = render(<Toolbar actions={actions} size="sm" />);
    let button = screen.getByRole('button');
    expect(button).toHaveClass(/sizeSm/);

    rerender(<Toolbar actions={actions} size="lg" />);
    button = screen.getByRole('button');
    expect(button).toHaveClass(/sizeLg/);
  });

  it('renders string icons correctly', () => {
    const actions = [createMockAction('action1', { icon: 'save' })];

    render(<Toolbar actions={actions} />);

    // Should render string icon wrapped in Icon component
    expect(screen.getByText('save')).toBeInTheDocument();
  });

  it('renders React node icons correctly', () => {
    const customIcon = <span data-testid="custom-icon">★</span>;
    const actions = [createMockAction('action1', { icon: customIcon })];

    render(<Toolbar actions={actions} />);

    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('handles multiple action groups with proper dividers', () => {
    const group1 = [createMockAction('g1-a1')];
    const group2 = [createMockAction('g2-a1')];
    const group3 = [createMockAction('g3-a1')];

    render(<Toolbar groups={[group1, group2, group3]} />);

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(3);

    // Should have 2 dividers (between 3 groups)
    const separators = screen.getAllByRole('separator');
    expect(separators).toHaveLength(2);
  });

  it('has correct display name', () => {
    expect(Toolbar.displayName).toBe('GridparkToolbar');
  });

  it('applies correct container styling', () => {
    render(<Toolbar />);

    const container = document.querySelector('.MuiBox-root');
    expect(container).toHaveStyle('display: flex');
    expect(container).toHaveStyle('align-items: center');
    expect(container).toHaveStyle('min-height: 48px');
  });
});
