import { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';

export default function ReminderToggle({ type, defaultEnabled = false, description }) {
  const { user } = useAuth();
  const [isEnabled, setIsEnabled] = useState(defaultEnabled);
  const [time, setTime] = useState('09:00');

  useEffect(() => {
    if (user?.settings?.reminders) {
      const userReminder = user.settings.reminders[type];
      if (userReminder) {
        setIsEnabled(userReminder.enabled);
        setTime(userReminder.time || '09:00');
      }
    }
  }, [user, type]);

  const handleToggle = async (enabled) => {
    if (!user) return;
    
    setIsEnabled(enabled);
    
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      [`settings.reminders.${type}`]: {
        enabled,
        time: enabled ? time : null
      }
    });

    // In a real app, you'd update actual push notifications here
    if (enabled) {
      console.log(`Enabled ${type} reminder at ${time}`);
    } else {
      console.log(`Disabled ${type} reminder`);
    }
  };

  const handleTimeChange = async (newTime) => {
    if (!user || !isEnabled) return;
    
    setTime(newTime);
    
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      [`settings.reminders.${type}.time`]: newTime
    });
  };

  const reminderLabels = {
    period: { emoji: '🩸', label: 'Period Start' },
    fertile: { emoji: '🌱', label: 'Fertile Window' },
    ovulation: { emoji: '🥚', label: 'Ovulation' },
    symptoms: { emoji: '🤒', label: 'Symptom Logging' },
    birthControl: { emoji: '💊', label: 'Birth Control' }
  };

  const { emoji, label } = reminderLabels[type] || { emoji: '🔔', label: type };

  return (
    <div className="reminder-toggle">
      <div className="reminder-header">
        <div className="reminder-info">
          <span className="reminder-emoji">{emoji}</span>
          <div>
            <h4>{label}</h4>
            <p>{description}</p>
          </div>
        </div>
        
        <label className="switch">
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={(e) => handleToggle(e.target.checked)}
          />
          <span className="slider"></span>
        </label>
      </div>

      {isEnabled && (
        <div className="reminder-time">
          <label>Time:</label>
          <input
            type="time"
            value={time}
            onChange={(e) => handleTimeChange(e.target.value)}
            className="time-input"
          />
        </div>
      )}
    </div>
  );
}