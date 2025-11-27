import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import ReminderToggle from '../../../components/ReminderToggle';

export default function Notifications() {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    enabled: true,
    periodReminders: true,
    fertileWindowReminders: true,
    ovulationReminders: true,
    symptomReminders: false,
    birthControlReminders: false,
    quietHours: false,
    quietStart: '22:00',
    quietEnd: '07:00'
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user) return;

    const loadSettings = async () => {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (userData.notificationSettings) {
          setSettings(prev => ({ ...prev, ...userData.notificationSettings }));
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
        notificationSettings: settings
      });
      alert('Notification settings saved!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleAll = (enabled) => {
    setSettings(prev => ({
      ...prev,
      enabled,
      periodReminders: enabled,
      fertileWindowReminders: enabled,
      ovulationReminders: enabled,
      symptomReminders: enabled,
      birthControlReminders: enabled
    }));
  };

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <h1>Notifications</h1>
        <p>Manage reminders and alerts for your cycle tracking</p>
      </div>

      <div className="notifications-content">
        {/* Global Toggle */}
        <div className="settings-section">
          <div className="global-toggle">
            <label className="toggle-label">
              <span className="toggle-text">Enable All Notifications</span>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={settings.enabled}
                  onChange={(e) => toggleAll(e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </label>
            <small>Turn off to disable all cycle-related notifications</small>
          </div>
        </div>

        {settings.enabled && (
          <>
            {/* Reminder Types */}
            <div className="settings-section">
              <h2>Reminder Types</h2>
              
              <ReminderToggle
                type="period"
                defaultEnabled={settings.periodReminders}
                description="Get notified before and during your expected period"
              />

              <ReminderToggle
                type="fertile"
                defaultEnabled={settings.fertileWindowReminders}
                description="Alerts when your fertile window is approaching"
              />

              <ReminderToggle
                type="ovulation"
                defaultEnabled={settings.ovulationReminders}
                description="Notifications for predicted ovulation days"
              />

              <ReminderToggle
                type="symptoms"
                defaultEnabled={settings.symptomReminders}
                description="Daily reminders to log your symptoms"
              />

              <ReminderToggle
                type="birthControl"
                defaultEnabled={settings.birthControlReminders}
                description="Reminders for birth control pills or other contraception"
              />
            </div>

            {/* Quiet Hours */}
            <div className="settings-section">
              <h2>Quiet Hours</h2>
              
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.quietHours}
                    onChange={(e) => setSettings(prev => ({ 
                      ...prev, 
                      quietHours: e.target.checked 
                    }))}
                  />
                  <span className="checkmark"></span>
                  Enable quiet hours
                </label>
                <small>No notifications will be sent during these hours</small>
              </div>

              {settings.quietHours && (
                <div className="quiet-hours-settings">
                  <div className="time-inputs">
                    <div className="form-group">
                      <label>Start Time</label>
                      <input
                        type="time"
                        value={settings.quietStart}
                        onChange={(e) => setSettings(prev => ({ 
                          ...prev, 
                          quietStart: e.target.value 
                        }))}
                      />
                    </div>
                    <div className="form-group">
                      <label>End Time</label>
                      <input
                        type="time"
                        value={settings.quietEnd}
                        onChange={(e) => setSettings(prev => ({ 
                          ...prev, 
                          quietEnd: e.target.value 
                        }))}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Notification Preferences */}
            <div className="settings-section">
              <h2>Notification Methods</h2>
              
              <div className="preference-options">
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input type="checkbox" defaultChecked />
                    <span className="checkmark"></span>
                    Push Notifications
                  </label>
                </div>
                
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input type="checkbox" defaultChecked />
                    <span className="checkmark"></span>
                    Email Reminders
                  </label>
                </div>
                
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input type="checkbox" />
                    <span className="checkmark"></span>
                    SMS Alerts
                  </label>
                  <small>Standard messaging rates may apply</small>
                </div>
              </div>
            </div>

            {/* Test Notification */}
            <div className="settings-section">
              <h2>Test Notification</h2>
              <button 
                className="test-notification-btn"
                onClick={() => alert('Test notification would be sent here')}
              >
                Send Test Notification
              </button>
              <small>Check if your notifications are working properly</small>
            </div>
          </>
        )}

        {/* Save Button */}
        <div className="settings-actions">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="save-settings-btn"
          >
            {isSaving ? 'Saving...' : 'Save Notification Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}