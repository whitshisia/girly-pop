import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function Privacy() {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    dataSharing: false,
    anonymousAnalytics: true,
    personalizedAds: false,
    autoBackup: true,
    clearDataOnClose: false
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user) return;

    const loadSettings = async () => {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (userData.privacySettings) {
          setSettings(prev => ({ ...prev, ...userData.privacySettings }));
        }
      }
    };

    loadSettings();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    const userRef = doc(db, 'users', user.uid);

    try {
      await updateDoc(userRef, {
        privacySettings: settings
      });
      alert('Privacy settings saved!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearData = () => {
    if (window.confirm(
      'Are you sure you want to clear all your local data? This action cannot be undone. ' +
      'Make sure you have exported any important data first.'
    )) {
      // Clear IndexedDB and localStorage
      indexedDB.deleteDatabase('CycleTracker');
      localStorage.clear();
      alert('Local data cleared. The page will now reload.');
      window.location.reload();
    }
  };

  const handleExportData = () => {
    // In a real app, this would generate and download a JSON file
    alert('Data export functionality would generate a downloadable file with all your cycle data.');
  };

  return (
    <div className="privacy-page">
      <div className="privacy-header">
        <h1>Privacy & Security</h1>
        <p>Control how your data is stored, used, and shared</p>
      </div>

      <div className="privacy-content">
        {/* Data Storage */}
        <div className="settings-section">
          <h2>Data Storage</h2>
          
          <div className="privacy-option">
            <div className="option-info">
              <h4>Auto Backup</h4>
              <p>Automatically backup your data to secure cloud storage</p>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={settings.autoBackup}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  autoBackup: e.target.checked 
                }))}
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="privacy-option">
            <div className="option-info">
              <h4>Clear Data on App Close</h4>
              <p>Automatically clear local data when you close the app (anonymous mode)</p>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={settings.clearDataOnClose}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  clearDataOnClose: e.target.checked 
                }))}
              />
              <span className="slider"></span>
            </label>
          </div>
        </div>

        {/* Data Sharing */}
        <div className="settings-section">
          <h2>Data Sharing</h2>
          
          <div className="privacy-option">
            <div className="option-info">
              <h4>Share Anonymous Data</h4>
              <p>Help improve the app by sharing completely anonymous usage data</p>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={settings.anonymousAnalytics}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  anonymousAnalytics: e.target.checked 
                }))}
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="privacy-option">
            <div className="option-info">
              <h4>Personalized Content & Ads</h4>
              <p>Allow personalized health content and relevant advertisements</p>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={settings.personalizedAds}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  personalizedAds: e.target.checked 
                }))}
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="privacy-option">
            <div className="option-info">
              <h4>Research Participation</h4>
              <p>Contribute anonymized data to women's health research (completely optional)</p>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={settings.dataSharing}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  dataSharing: e.target.checked 
                }))}
              />
              <span className="slider"></span>
            </label>
          </div>
        </div>

        {/* Data Management */}
        <div className="settings-section">
          <h2>Data Management</h2>
          
          <div className="data-actions">
            <button onClick={handleExportData} className="data-btn export">
              📤 Export All Data
            </button>
            <button onClick={handleClearData} className="data-btn clear">
              🗑️ Clear Local Data
            </button>
          </div>

          <div className="data-info">
            <h4>Your Data Rights</h4>
            <ul>
              <li>You own all your personal health data</li>
              <li>You can export your data at any time</li>
              <li>You can request permanent deletion of your account and data</li>
              <li>We never sell your personal health information</li>
            </ul>
          </div>
        </div>

        {/* Security */}
        <div className="settings-section">
          <h2>Security</h2>
          
          <div className="security-info">
            <div className="security-feature">
              <span className="feature-emoji">🔒</span>
              <div>
                <h4>End-to-End Encryption</h4>
                <p>Your data is encrypted in transit and at rest</p>
              </div>
            </div>
            
            <div className="security-feature">
              <span className="feature-emoji">📱</span>
              <div>
                <h4>Local Storage Option</h4>
                <p>Use anonymous mode to keep all data on your device only</p>
              </div>
            </div>
            
            <div className="security-feature">
              <span className="feature-emoji">👁️</span>
              <div>
                <h4>No Third-Party Tracking</h4>
                <p>We don't use third-party analytics or tracking tools</p>
              </div>
            </div>
          </div>
        </div>

        {/* Privacy Policy */}
        <div className="settings-section">
          <h2>Legal</h2>
          
          <div className="legal-links">
            <a href="/privacy-policy" className="legal-link">
              📄 Privacy Policy
            </a>
            <a href="/terms-of-service" className="legal-link">
              📄 Terms of Service
            </a>
            <a href="/data-processing" className="legal-link">
              📄 Data Processing Agreement
            </a>
          </div>
        </div>

        {/* Save Button */}
        <div className="settings-actions">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="save-settings-btn"
          >
            {isSaving ? 'Saving...' : 'Save Privacy Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}