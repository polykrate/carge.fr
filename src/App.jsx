import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Workflows } from './pages/Workflows';
import { Verify } from './pages/Verify';
import { About } from './pages/About';

function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/workflows" element={<Workflows />} />
            <Route path="/verify" element={<Verify />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </Layout>
      </AppProvider>
    </BrowserRouter>
  );
}

export default App;
