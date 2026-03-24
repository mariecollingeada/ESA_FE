import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

vi.mock('./pages/Home', () => ({
  default: () => <div>Home Mock</div>,
}));

describe('App Component', () => {
  it('should render without crashing', () => {
    const { container } = render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    expect(container).toBeInTheDocument();
  });
});
