import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from '../../contexts/AppContext';
import { Layout } from '../Layout';

describe('Layout', () => {
  it('should render header and children', () => {
    render(
      <BrowserRouter>
        <AppProvider>
          <Layout>
            <div data-testid="child-content">Test Content</div>
          </Layout>
        </AppProvider>
      </BrowserRouter>
    );

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByTestId('child-content')).toHaveTextContent('Test Content');
  });

  it('should render navigation links', () => {
    render(
      <BrowserRouter>
        <AppProvider>
          <Layout>
            <div>Content</div>
          </Layout>
        </AppProvider>
      </BrowserRouter>
    );

    expect(screen.getByText(/Home/i)).toBeInTheDocument();
  });
});

