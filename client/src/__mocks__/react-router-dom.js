const React = require('react');

const mockNavigate = jest.fn();
const mockLocation = { pathname: '/', search: '', hash: '', state: null };

module.exports = {
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
    useParams: () => ({}),
    useSearchParams: () => [new URLSearchParams(), jest.fn()],
    MemoryRouter: ({ children }) => React.createElement('div', null, children),
    BrowserRouter: ({ children }) => React.createElement('div', null, children),
    Routes: ({ children }) => React.createElement('div', null, children),
    Route: () => null,
    Link: ({ children, to, ...props }) => React.createElement('a', { href: to, ...props }, children),
    NavLink: ({ children, to, ...props }) => React.createElement('a', { href: to, ...props }, children),
    Navigate: () => null,
    Outlet: () => null,
    __mockNavigate: mockNavigate,
    __mockLocation: mockLocation,
};
