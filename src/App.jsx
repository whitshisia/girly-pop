import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import Layout from './components/Layout';
import Home from './app/index';
import Calendar from './app/calendar';
import DailyLog from './app/log/[date]';
import Insights from './app/cycle/insights';
import PregnancyDashboard from './app/pregnancy/dashboard';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/log/:date" element={<DailyLog />} />
            <Route path="/cycle/insights" element={<Insights />} />
            <Route path="/pregnancy/dashboard" element={<PregnancyDashboard />} />
            {/* Add other routes */}
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;