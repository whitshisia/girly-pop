import { useAuth } from '../../hooks/useAuth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useState, useEffect } from 'react';

export default function Profile() {
  const { user, logout } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [stats, setStats] = useState({});

  useEffect(() => {
    if (!user) return;

    const loadProfileData = async () => {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        setProfileData(userSnap.data());
      }

      // Load basic stats (in a real app, these would be calculated)
      setStats({
        cyclesTracked: 12,
        symptomsLogged: 47,
        predictionAccuracy: 78,
        streak: 7
      });
    };

    loadProfileData();
  }, [user]);

  if (!user) {
    return <div>Please log in to view your profile</div>;
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-avatar">
          <div className="avatar-placeholder">
            {user.name?.charAt(0).toUpperCase()}
          </div>
        </div>
        <div className="profile-info">
          <h1>{user.name}</h1>
          <p className="profile-email">{user.email}</p>
          <p className="profile-goal">
            {profileData?.goal ? `Goal: ${profileData.goal.replace('-', ' ')}` : 'No goal set'}
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="profile-stats">
        <h2>Your Tracking Stats</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-value">{stats.cyclesTracked}</span>
            <span className="stat-label">Cycles Tracked</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats.symptomsLogged}</span>
            <span className="stat-label">Symptoms Logged</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats.predictionAccuracy}%</span>
            <span className="stat-label">Prediction Accuracy</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats.streak}</span>
            <span className="stat-label">Day Streak</span>
          </div>
        </div>
      </div>

      {/* Profile Navigation */}
      <div className="profile-navigation">
        <h2>Settings & Preferences</h2>
        <div className="nav-grid">
          <a href="/profile/cycle-settings" className="nav-card">
            <span className="nav-emoji">📅</span>
            <div className="nav-content">
              <h3>Cycle Settings</h3>
              <p>Adjust cycle length, period duration, and prediction settings</p>
            </div>
            <span className="nav-arrow">→</span>
          </a>

          <a href="/profile/notifications" className="nav-card">
            <span className="nav-emoji">🔔</span>
            <div className="nav-content">
              <h3>Notifications</h3>
              <p>Manage reminders for periods, fertility, and symptoms</p>
            </div>
            <span className="nav-arrow">→</span>
          </a>

          <a href="/profile/privacy" className="nav-card">
            <span className="nav-emoji">🔒</span>
            <div className="nav-content">
              <h3>Privacy & Security</h3>
              <p>Control data sharing and privacy settings</p>
            </div>
            <span className="nav-arrow">→</span>
          </a>

          <a href="/profile/data-export" className="nav-card">
            <span className="nav-emoji">📤</span>
            <div className="nav-content">
              <h3>Data Export</h3>
              <p>Download your cycle data and tracking history</p>
            </div>
            <span className="nav-arrow">→</span>
          </a>

          <a href="/profile/theme" className="nav-card">
            <span className="nav-emoji">🎨</span>
            <div className="nav-content">
              <h3>Theme & Appearance</h3>
              <p>Customize the app's look and feel</p>
            </div>
            <span className="nav-arrow">→</span>
          </a>
        </div>
      </div>

      {/* Account Actions */}
      <div className="account-actions">
        <h2>Account</h2>
        <div className="actions-list">
          <button className="action-btn">
            <span className="action-emoji">🔄</span>
            <span>Sync Data</span>
          </button>
          <button className="action-btn">
            <span className="action-emoji">🤝</span>
            <span>Partner Sharing</span>
          </button>
          <button className="action-btn">
            <span className="action-emoji">❓</span>
            <span>Help & Support</span>
          </button>
          <button onClick={logout} className="action-btn logout">
            <span className="action-emoji">🚪</span>
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* App Info */}
      <div className="app-info">
        <p>CycleTracker v1.0.0</p>
        <p>Your data is stored securely and privately</p>
      </div>
    </div>
  );
}