import Navbar from './Navbar';
import { useAuth } from '../hooks/useAuth';

export default function Layout({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading your cycle data...</p>
      </div>
    );
  }

  return (
    <div className="app-layout">
      {user && <Navbar />}
      <main className="main-content">
        {children}
      </main>
      
      {user && (
        <footer className="app-footer">
          <p>Your data is secure and private</p>
        </footer>
      )}
    </div>
  );
}