import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import TopicNode from '../nodes/TopicNode';

jest.mock('@xyflow/react', () => ({
    Handle: ({ type, position }) => <div data-testid={`handle-${type}`} />,
    Position: { Top: 'top', Bottom: 'bottom' },
}));

describe('TopicNode', () => {
    const defaultData = { topic: 'Binary Search', support: 12, maxSupport: 20 };

    it('renders topic label', () => {
        render(<TopicNode data={defaultData} selected={false} />);
        expect(screen.getByText('Binary Search')).toBeInTheDocument();
    });

    it('renders handles', () => {
        render(<TopicNode data={defaultData} selected={false} />);
        expect(screen.getByTestId('handle-target')).toBeInTheDocument();
        expect(screen.getByTestId('handle-source')).toBeInTheDocument();
    });

    it('has correct aria-label', () => {
        render(<TopicNode data={defaultData} selected={false} />);
        expect(screen.getByRole('button')).toHaveAttribute(
            'aria-label',
            'Binary Search, 12 cards'
        );
    });

    it('shows tooltip on hover', () => {
        render(<TopicNode data={defaultData} selected={false} />);
        const tooltip = screen.getByText('Binary Search — 12 cards');
        expect(tooltip).toBeInTheDocument();
    });

    it('applies selected ring class', () => {
        const { container } = render(<TopicNode data={defaultData} selected={true} />);
        const circle = container.querySelector('.ring-3');
        expect(circle).toBeInTheDocument();
    });

    it('scales size by support ratio', () => {
        const lowSupport = { topic: 'Small', support: 1, maxSupport: 20 };
        const highSupport = { topic: 'Big', support: 20, maxSupport: 20 };

        const { container: lowContainer } = render(
            <TopicNode data={lowSupport} selected={false} />
        );
        const { container: highContainer } = render(
            <TopicNode data={highSupport} selected={false} />
        );

        const lowNode = lowContainer.firstChild;
        const highNode = highContainer.firstChild;

        const lowWidth = parseInt(lowNode.style.width);
        const highWidth = parseInt(highNode.style.width);
        expect(highWidth).toBeGreaterThan(lowWidth);
    });

    it('handles singular card text', () => {
        const singleCard = { topic: 'Solo', support: 1, maxSupport: 20 };
        render(<TopicNode data={singleCard} selected={false} />);
        expect(screen.getByText('Solo — 1 card')).toBeInTheDocument();
    });

    it('defaults maxSupport to 20', () => {
        const noMax = { topic: 'Test', support: 10 };
        render(<TopicNode data={noMax} selected={false} />);
        expect(screen.getByText('Test')).toBeInTheDocument();
    });
});
