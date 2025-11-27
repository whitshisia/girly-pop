import { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';

export default function Anonymous() {
  const { loginAnonymously, loading } = useAuth();
  const [userName, setUserName] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await loginAnonymously(userName || 'Anonymous User');
      // Redirect to onboarding
      window.location.href = '/auth/onboarding';
    } catch (error) {
      console.error('Anonymous login failed:', error);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>Anonymous Mode</h1>
          <p>Use the app without creating an account. Your data stays on this device.</p>
        </div>

        <div className="anonymous-features">
          <div className="feature-item">
            <span className="feature-icon">🔒</span>
            <div>
              <h4>Local Only</h4>
              <p>Data never leaves your device</p>
            </div>
          </div>
          
          <div className="feature-item">
            <span className="feature-icon">📱</span>
            <div>
              <h4>Full Features</h4>
              <p>Access all tracking features</p>
            </div>
          </div>
          
          <div className="feature-item">
            <span className="feature-icon">⚡</span>
            <div>
              <h4>No Setup</h4>
              <p>Start tracking immediately</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="anonymousName">Your Name (Optional)</label>
            <input
              id="anonymousName"
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="What should we call you?"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary auth-submit"
          >
            {loading ? 'Starting...' : 'Start Tracking'}
          </button>
        </form>

        <div className="auth-links">
          <a href="/auth/register">Create account to sync across devices</a>
        </div>
      </div>
    </div>
  );
}