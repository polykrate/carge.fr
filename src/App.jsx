import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppProvider } from './contexts/AppContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/Layout';
import './lib/i18n'; // Initialize i18n

// 🚀 Lazy load ALL pages for optimal performance
// Each page loads only when user navigates to it
const Home = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const Workflows = lazy(() => import('./pages/Workflows').then(m => ({ default: m.Workflows })));
const Agent = lazy(() => import('./pages/Agent').then(m => ({ default: m.Agent })));
const QuickSign = lazy(() => import('./pages/QuickSign').then(m => ({ default: m.QuickSign })));
const Verify = lazy(() => import('./pages/Verify').then(m => ({ default: m.Verify })));
const About = lazy(() => import('./pages/About').then(m => ({ default: m.About })));
const WalletDebug = lazy(() => import('./pages/WalletDebug').then(m => ({ default: m.WalletDebug })));

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003399]"></div>
  </div>
);

// Error fallback for lazy loading failures
const LazyLoadError = ({ error, resetErrorBoundary }) => (
  <div className="flex items-center justify-center min-h-screen p-6">
    <div className="max-w-md w-full bg-red-50 border border-red-200 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-red-900 mb-2">Failed to load page</h2>
      <p className="text-sm text-red-700 mb-4">
        The page failed to load. This might be a temporary network issue.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
      >
        Reload Page
      </button>
    </div>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppProvider>
          <Toaster position="top-right" />
          <Layout>
                    <Suspense fallback={<PageLoader />}>
                      <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/workflows" element={<Workflows />} />
                        <Route path="/agent" element={<Agent />} />
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
