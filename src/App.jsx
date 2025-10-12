import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';

// Lazy load heavy pages for better performance
const Workflows = lazy(() => import('./pages/Workflows').then(m => ({ default: m.Workflows })));
const QuickSign = lazy(() => import('./pages/QuickSign').then(m => ({ default: m.QuickSign })));
const Verify = lazy(() => import('./pages/Verify').then(m => ({ default: m.Verify })));
const About = lazy(() => import('./pages/About').then(m => ({ default: m.About })));

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Layout>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/workflows" element={<Workflows />} />
              <Route path="/quick-sign" element={<QuickSign />} />
              <Route path="/verify" element={<Verify />} />
              <Route path="/about" element={<About />} />
            </Routes>
          </Suspense>
        </Layout>
      </AppProvider>
    </BrowserRouter>
  );
}

export default App;
