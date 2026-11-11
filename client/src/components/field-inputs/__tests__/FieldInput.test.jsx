import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import FieldInput from '../index';

// MarkdownFieldInput -> LiveMarkdownEditor -> react-markdown, and
// CodeFieldInput -> CodeEditor -> prismjs CSS -- both ship ESM/CSS this
// project's jest transformIgnorePatterns allowlist (client/package.json)
// doesn't cover. Mock rather than widening that allowlist as a side effect
// of this test file.
jest.mock('react-markdown', () => ({ children }) => <div>{children}</div>);
jest.mock('../../common/CodeEditor', () => ({ value, onChange }) => (
  <textarea data-testid="mock-code-editor" value={value} onChange={(e) => onChange(e.target.value)} />
));
// react-sketch-canvas renders an SVG surface via pointer events jsdom doesn't
// drive; mock it down to its ref API so DrawingFieldInput's own logic (hydrate
// on mount, report { paths, svg } on change) is what gets tested. The ref
// object is shared (not recreated per render) so tests can assert on calls
// made through DrawingFieldInput's toolbar buttons.
const mockCanvasApi = {
  loadPaths: jest.fn(),
  undo: jest.fn(),
  redo: jest.fn(),
  clearCanvas: jest.fn(),
  eraseMode: jest.fn(),
  exportSvg: jest.fn().mockResolvedValue('<svg data-testid="mock-exported-svg"></svg>'),
};
jest.mock('react-sketch-canvas', () => {
  const React = require('react');
  return {
    ReactSketchCanvas: React.forwardRef((props, ref) => {
      React.useImperativeHandle(ref, () => mockCanvasApi);
      return <div data-testid="mock-sketch-canvas" />;
    }),
  };
});

const baseField = (overrides = {}) => ({
  name: 'front',
  displayName: 'Front',
  type: 'text',
  role: 'prompt',
  required: false,
  order: 0,
  ...overrides,
});

describe('FieldInput registry', () => {
  it('renders a text input and reports changes', () => {
    const onChange = jest.fn();
    render(<FieldInput field={baseField()} value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'hello' } });
    expect(onChange).toHaveBeenCalledWith('hello');
  });

  it('renders a link input', () => {
    render(<FieldInput field={baseField({ type: 'link' })} value="https://example.com" onChange={jest.fn()} />);
    expect(screen.getByDisplayValue('https://example.com')).toBeInTheDocument();
  });

  it('renders a markdown editor', () => {
    render(<FieldInput field={baseField({ type: 'markdown' })} value="# Heading" onChange={jest.fn()} />);
    expect(screen.getByDisplayValue('# Heading')).toBeInTheDocument();
  });

  it('renders a code editor', () => {
    const { container } = render(<FieldInput field={baseField({ type: 'code', language: 'python' })} value="print(1)" onChange={jest.fn()} />);
    expect(container.querySelector('textarea')).toBeInTheDocument();
  });

  it('renders an mcq input with add-option behavior', () => {
    const onChange = jest.fn();
    render(<FieldInput field={baseField({ type: 'mcq', name: 'quiz' })} value={undefined} onChange={onChange} />);
    fireEvent.click(screen.getByText('+ Add Option'));
    expect(onChange).toHaveBeenCalled();
    const [{ options }] = onChange.mock.calls[0];
    expect(options).toHaveLength(2);
  });

  it('falls back to an unknown-type placeholder for an unrecognized type', () => {
    render(<FieldInput field={baseField({ type: 'not-a-real-type' })} value="" onChange={jest.fn()} />);
    expect(screen.getByText(/Unknown field type/)).toBeInTheDocument();
  });

  it('renders a drawing canvas with undo/redo/clear controls', () => {
    render(<FieldInput field={baseField({ type: 'drawing', name: 'diagram' })} value={undefined} onChange={jest.fn()} />);
    expect(screen.getByTestId('mock-sketch-canvas')).toBeInTheDocument();
    expect(screen.getByText('Undo')).toBeInTheDocument();
    expect(screen.getByText('Redo')).toBeInTheDocument();
    expect(screen.getByText('Clear')).toBeInTheDocument();
  });

  it('toggles the eraser tool on the drawing canvas', () => {
    render(<FieldInput field={baseField({ type: 'drawing', name: 'diagram' })} value={undefined} onChange={jest.fn()} />);
    const eraserButton = screen.getByText('Eraser');
    expect(eraserButton).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(eraserButton);
    expect(mockCanvasApi.eraseMode).toHaveBeenCalledWith(true);
    expect(eraserButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('switches the drawing canvas from Editing to Panning', () => {
    render(<FieldInput field={baseField({ type: 'drawing', name: 'diagram' })} value={undefined} onChange={jest.fn()} />);
    expect(screen.getByText('Editing')).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByText('Editing'));
    expect(screen.getByText('Panning')).toHaveAttribute('aria-pressed', 'false');
  });

  it('zooms the drawing canvas in and out', () => {
    render(<FieldInput field={baseField({ type: 'drawing', name: 'diagram' })} value={undefined} onChange={jest.fn()} />);
    expect(screen.getByText('100%')).toBeInTheDocument();
    fireEvent.click(screen.getByTitle('Zoom in'));
    expect(screen.getByText('120%')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Reset View'));
    expect(screen.getByText('100%')).toBeInTheDocument();
  });
});
