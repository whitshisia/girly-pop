import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

export default function CycleSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    cycleLength: 28,
    periodLength: 5,
    lutealPhase: 14,
    isIrregular: false,
    lastPeriod: '',
    typicalSymptoms: []
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user) return;

    const loadSettings = async () => {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        setSettings(prev => ({
          ...prev,
          cycleLength: userData.cycleLength || 28,
          periodLength: userData.periodLength || 5,
          lastPeriod: userData.lastPeriod || '',
          typicalSymptoms: userData.typicalSymptoms || []
        }));
      }
    };

    loadSettings();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    const userRef = doc(db, 'users', user.uid);

    try {
      await updateDoc(userRef, settings);
      // Show success message
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings');
    } finally {
      setIsSaving(false);
    }
  };

  const commonSymptoms = [
    'cramps', 'headache', 'back-pain', 'breast-tenderness', 
    'bloating', 'mood-swings', 'fatigue', 'food-cravings'
  ];

  return (
    <div className="cycle-settings">
      <div className="settings-header">
        <h1>Cycle Settings</h1>
        <p>Customize your cycle tracking and prediction preferences</p>
      </div>

      <div className="settings-content">
        {/* Basic Cycle Information */}
        <div className="settings-section">
          <h2>Basic Information</h2>
          
          <div className="form-group">
            <label>Average Cycle Length</label>
            <div className="input-with-unit">
              <input
                type="number"
                min="21"
                max="45"
                value={settings.cycleLength}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  cycleLength: parseInt(e.target.value) 
                }))}
              />
              <span className="unit">days</span>
            </div>
            <small>Typically 21-35 days. This affects period predictions.</small>
          </div>

          <div className="form-group">
            <label>Average Period Length</label>
            <div className="input-with-unit">
              <input
                type="number"
                min="2"
                max="10"
                value={settings.periodLength}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  periodLength: parseInt(e.target.value) 
                }))}
              />
              <span className="unit">days</span>
            </div>
            <small>Typically 3-7 days of bleeding.</small>
          </div>

          <div className="form-group">
            <label>Luteal Phase Length</label>
            <div className="input-with-unit">
              <input
                type="number"
                min="10"
                max="16"
                value={settings.lutealPhase}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  lutealPhase: parseInt(e.target.value) 
                }))}
              />
              <span className="unit">days</span>
            </div>
            <small>Days between ovulation and next period. Typically 12-14 days.</small>
          </div>
        </div>

        {/* Irregular Cycles */}
        <div className="settings-section">
          <h2>Cycle Regularity</h2>
          
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={settings.isIrregular}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  isIrregular: e.target.checked 
                }))}
              />
              <span className="checkmark"></span>
              I have irregular cycles
            </label>
            <small>Enable this if your cycle length varies significantly month to month.</small>
          </div>

          {settings.isIrregular && (
            <div className="irregular-notes">
              <p>
                <strong>Note:</strong> With irregular cycles, predictions may be less accurate. 
                Consider tracking additional fertility signs like BBT and cervical mucus.
              </p>
            </div>
          )}
        </div>

        {/* Typical Symptoms */}
        <div className="settings-section">
          <h2>Typical Symptoms</h2>
          <p>Select symptoms you commonly experience during your cycle:</p>
          
          <div className="symptoms-checklist">
            {commonSymptoms.map(symptom => (
              <label key={symptom} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.typicalSymptoms.includes(symptom)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSettings(prev => ({
                        ...prev,
                        typicalSymptoms: [...prev.typicalSymptoms, symptom]
                      }));
                    } else {
                      setSettings(prev => ({
                        ...prev,
                        typicalSymptoms: prev.typicalSymptoms.filter(s => s !== symptom)
                      }));
                    }
                  }}
                />
                <span className="checkmark"></span>
                {symptom.replace('-', ' ')}
              </label>
            ))}
          </div>
        </div>

        {/* Last Period */}
        <div className="settings-section">
          <h2>Last Period</h2>
          
          <div className="form-group">
            <label>Start Date of Last Period</label>
            <input
              type="date"
              value={settings.lastPeriod}
              onChange={(e) => setSettings(prev => ({ 
                ...prev, 
                lastPeriod: e.target.value 
              }))}
              max={new Date().toISOString().split('T')[0]}
            />
            <small>This helps calculate your current cycle day and predictions.</small>
          </div>
        </div>

        {/* Prediction Settings */}
        <div className="settings-section">
          <h2>Prediction Settings</h2>
          
          <div className="prediction-options">
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input type="checkbox" defaultChecked />
                <span className="checkmark"></span>
                Show fertile window predictions
              </label>
            </div>
            
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input type="checkbox" defaultChecked />
                <span className="checkmark"></span>
                Show ovulation day prediction
              </label>
            </div>
            
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input type="checkbox" defaultChecked />
                <span className="checkmark"></span>
                Adjust predictions based on logged data
              </label>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="settings-actions">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="save-settings-btn"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}