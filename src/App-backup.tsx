import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from './contexts/ConfigContext';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import SessionPage from './pages/SessionPage';
import GeneratorPage from './pages/GeneratorPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <ConfigProvider>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/sessions" element={<HomePage />} />
              <Route path="/sessions/:sessionId" element={<SessionPage />} />
              <Route path="/generator" element={<GeneratorPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </Layout>
        </Router>
      </QueryClientProvider>
    </ConfigProvider>
  );
}

export default App;