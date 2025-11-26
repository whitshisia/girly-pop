import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useCyclePredictor } from '../hooks/useCyclePredictor';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { predictions } = useCyclePredictor();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigation = [
    { name: 'Home', href: '/', icon: '🏠' },
    { name: 'Calendar', href: '/calendar', icon: '📅' },
    { name: 'Log', href: `/log/${new Date().toISOString().split('T')[0]}`, icon: '📝' },
    { name: 'Insights', href: '/cycle/insights', icon: '📊' },
    { name: 'Pregnancy', href: '/pregnancy/dashboard', icon: '👶' },
    { name: 'Profile', href: '/profile', icon: '👤' },
    { name: 'Community', href: '/community', icon: '👥' }

];

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <h2>CycleTracker</h2>
        {predictions.nextPeriod && (
          <span className="nav-prediction">
            Next period in {Math.ceil((predictions.nextPeriod - new Date()) / (1000 * 60 * 60 * 24))} days
          </span>
        )}
      </div>

      <div className="nav-links">
        {navigation.map((item) => (
          <a key={item.name} href={item.href} className="nav-link">
            <span className="nav-icon">{item.icon}</span>
            {item.name}
          </a>
        ))}
      </div>

      <div className="nav-user">
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="user-menu-btn">
          <span>👤</span>
        </button>
        
        {isMenuOpen && (
          <div className="user-dropdown">
            <p>Hello, {user?.name}</p>
            <a href="/profile">Settings</a>
            <a href="/profile/privacy">Privacy</a>
            <button onClick={logout} className="logout-btn">Logout</button>
          </div>
        )}
      </div>
    </nav>
  );
}