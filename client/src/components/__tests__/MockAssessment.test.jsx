import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import MockAssessment from '../MockAssessment';

const problems = [
  { ID: '1', Title: 'two-sum', Difficulty: 'Easy', companies: ['Acme'] },
  { ID: '2', Title: 'add-two-numbers', Difficulty: 'Medium', companies: ['Acme'] },
];

test('starts a company mock and keeps safe links when tabs are blocked', () => {
  const open = jest.spyOn(window, 'open').mockImplementation(() => null);
  render(<MockAssessment problems={problems} companies={['Acme']} />);
  const start = screen.getByRole('button', { name: 'Start mock OA' });
  expect(start.disabled).toBe(true);
  fireEvent.change(screen.getByLabelText('Company'), { target: { value: 'Acme' } });
  expect(start.disabled).toBe(false);
  fireEvent.click(start);
  expect(open).toHaveBeenCalledTimes(2);
  expect(open).toHaveBeenCalledWith('https://leetcode.com/problems/two-sum/description/', '_blank', 'noopener,noreferrer');
  expect(screen.getAllByRole('link')).toHaveLength(2);
  expect(screen.queryByText('two-sum')).toBeNull();
  fireEvent.change(screen.getByLabelText('Problems'), { target: { value: '4' } });
  expect(start.disabled).toBe(true);
  expect(screen.getByRole('status').textContent).toContain('Choose 2 problems');
  expect(screen.getAllByRole('link')).toHaveLength(2);
  open.mockRestore();
});
