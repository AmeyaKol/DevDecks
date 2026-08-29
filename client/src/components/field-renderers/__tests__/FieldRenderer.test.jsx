import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import FieldRenderer from '../index';

// react-markdown and react-syntax-highlighter both ship ESM this project's
// jest transformIgnorePatterns allowlist (client/package.json) doesn't
// cover. Mock rather than widening that allowlist as a side effect of this
// test file.
jest.mock('react-markdown', () => ({ children }) => <div>{children}</div>);
jest.mock('react-syntax-highlighter', () => ({ Prism: ({ children }) => <pre>{children}</pre> }));
jest.mock('react-syntax-highlighter/dist/esm/styles/prism', () => ({ atomDark: {} }));

const baseField = (overrides = {}) => ({
  name: 'front',
  displayName: 'Front',
  type: 'text',
  role: 'prompt',
  order: 0,
  ...overrides,
});

describe('FieldRenderer registry', () => {
  it('renders text values', () => {
    render(<FieldRenderer field={baseField()} value="Hello world" />);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('renders nothing for an empty value instead of throwing', () => {
    const { container } = render(<FieldRenderer field={baseField()} value="" />);
    expect(container.textContent).toBe('');
  });

  it('renders a link as an anchor', () => {
    render(<FieldRenderer field={baseField({ type: 'link' })} value="https://example.com" />);
    expect(screen.getByRole('link')).toHaveAttribute('href', 'https://example.com');
  });

  it('renders markdown content through the markdown renderer', () => {
    render(<FieldRenderer field={baseField({ type: 'markdown' })} value="some markdown text" />);
    expect(screen.getByText('some markdown text')).toBeInTheDocument();
  });

  it('renders mcq options without revealing the answer up front', () => {
    render(
      <FieldRenderer
        field={baseField({ type: 'mcq', displayName: 'Quiz' })}
        value={{ mcqType: 'single-correct', options: [{ text: 'Yes', isCorrect: true }, { text: 'No', isCorrect: false }] }}
      />
    );
    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();
    expect(screen.getByText('Show Answer')).toBeInTheDocument();
    expect(screen.queryByText('Correct Answer(s)')).not.toBeInTheDocument();
  });

  it('reveals the correct mcq option on click, matching the GRE-MCQ interaction', () => {
    render(
      <FieldRenderer
        field={baseField({ type: 'mcq', displayName: 'Quiz' })}
        value={{ mcqType: 'single-correct', options: [{ text: 'Yes', isCorrect: true }, { text: 'No', isCorrect: false }] }}
      />
    );
    fireEvent.click(screen.getByText('Show Answer'));
    expect(screen.getByText('Correct Answer(s)')).toBeInTheDocument();
    expect(screen.getByText('Hide Answer')).toBeInTheDocument();
    expect(screen.getByText('A. Yes')).toBeInTheDocument();
  });

  it('falls back to an unknown-type placeholder for an unrecognized type', () => {
    render(<FieldRenderer field={baseField({ type: 'not-a-real-type' })} value="x" />);
    expect(screen.getByText(/Unknown field type/)).toBeInTheDocument();
  });

  it('applies the callout style wrapper class', () => {
    const { container } = render(<FieldRenderer field={baseField({ style: 'callout' })} value="Hi" />);
    expect(container.firstChild).toHaveClass('border-l-4');
  });
});
