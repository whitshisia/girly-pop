export default function Offline() {
  return (
    <div className="offline-page">
      <div className="offline-content">
        <div className="offline-icon">📶</div>
        <h1>You're Offline</h1>
        <p>Don't worry! You can still access your tracked data.</p>
        
        <div className="offline-features">
          <div className="feature">
            <span className="feature-emoji">📝</span>
            <span>Log symptoms and periods</span>
          </div>
          <div className="feature">
            <span className="feature-emoji">📅</span>
            <span>View your calendar</span>
          </div>
          <div className="feature">
            <span className="feature-emoji">🔍</span>
            <span>Check predictions</span>
          </div>
        </div>

        <p className="offline-note">
          Your data will sync when you're back online
        </p>

        <button 
          onClick={() => window.location.reload()}
          className="retry-btn"
        >
          Retry Connection
        </button>
      </div>
    </div>
  );
}