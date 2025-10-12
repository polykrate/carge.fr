import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppProvider } from './contexts/AppContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import './lib/i18n'; // Initialize i18n

// Lazy load heavy pages for better performance
const Workflows = lazy(() => import('./pages/Workflows').then(m => ({ default: m.Workflows })));
const QuickSign = lazy(() => import('./pages/QuickSign').then(m => ({ default: m.QuickSign })));
const Verify = lazy(() => import('./pages/Verify').then(m => ({ default: m.Verify })));
const About = lazy(() => import('./pages/About').then(m => ({ default: m.About })));
const WalletDebug = lazy(() => import('./pages/WalletDebug').then(m => ({ default: m.WalletDebug })));

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppProvider>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                borderRadius: '8px',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
                duration: 5000,
              },
            }}
          />
          <Layout>
                    <Suspense fallback={<PageLoader />}>
                      <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/workflows" element={<Workflows />} />
                        <Route path="/quick-sign" element={<QuickSign />} />
                        <Route path="/verify" element={<Verify />} />
                        <Route path="/about" element={<About />} />
                        <Route path="/wallet-debug" element={<WalletDebug />} />
                      </Routes>
                    </Suspense>
          </Layout>
        </AppProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
