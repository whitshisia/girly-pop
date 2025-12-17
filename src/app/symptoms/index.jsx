import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useDailyLogs } from '../../hooks/useDailyLogs';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import SymptomsGrid from '../../components/SymptomsGrid';
import symptomsData from '../../data/symptoms.json';

export default function Symptoms() {
  const { user } = useAuth();
  const { todayLog, updateLog } = useDailyLogs();
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [intensity, setIntensity] = useState({});
  const [notes, setNotes] = useState('');
  const [activeTab, setActiveTab] = useState('log');

  useEffect(() => {
    if (todayLog) {
      setSelectedSymptoms(todayLog.symptoms || []);
      setIntensity(todayLog.symptomIntensity || {});
      setNotes(todayLog.notes || '');
    }
  }, [todayLog]);

  const handleSymptomToggle = (symptomId) => {
    const newSymptoms = selectedSymptoms.includes(symptomId)
      ? selectedSymptoms.filter(id => id !== symptomId)
      : [...selectedSymptoms, symptomId];
    
    setSelectedSymptoms(newSymptoms);
    saveSymptoms(newSymptoms);
  };

  const handleIntensityChange = (symptomId, value) => {
    const newIntensity = { ...intensity, [symptomId]: value };
    setIntensity(newIntensity);
    saveSymptoms(selectedSymptoms, newIntensity);
  };

  const saveSymptoms = async (symptoms = selectedSymptoms, symptomIntensity = intensity) => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    const logRef = doc(db, 'dailyLogs', user.uid, 'logs', today);

    try {
      await updateDoc(logRef, {
        symptoms,
        symptomIntensity,
        notes,
        updatedAt: new Date()
      }, { merge: true });
    } catch (error) {
      console.error('Error saving symptoms:', error);
    }
  };

  const getSymptomStats = () => {
    const stats = {};
    selectedSymptoms.forEach(symptomId => {
      const symptom = symptomsData.symptoms.find(s => s.id === symptomId);
      if (symptom) {
        stats[symptom.category] = (stats[symptom.category] || 0) + 1;
      }
    });
    return stats;
  };

  const symptomStats = getSymptomStats();

  return (
    <div className="symptoms-page">
      <div className="symptoms-header">
        <h1>Symptom Tracker</h1>
        <p>Track how you're feeling today and identify patterns over time</p>
      </div>

      <div className="symptoms-tabs">
        <button 
          className={`tab-btn ${activeTab === 'log' ? 'active' : ''}`}
          onClick={() => setActiveTab('log')}
        >
          📝 Log Symptoms
        </button>
        <button 
          className={`tab-btn ${activeTab === 'patterns' ? 'active' : ''}`}
          onClick={() => setActiveTab('patterns')}
        >
          📊 View Patterns
        </button>
        <button 
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          📅 History
        </button>
      </div>

      {activeTab === 'log' && (
        <div className="symptoms-log">
          {/* Today's Summary */}
          <div className="today-summary">
            <h3>Today's Symptoms</h3>
            {selectedSymptoms.length > 0 ? (
              <div className="selected-symptoms">
                {selectedSymptoms.map(symptomId => {
                  const symptom = symptomsData.symptoms.find(s => s.id === symptomId);
                  return symptom ? (
                    <div key={symptomId} className="selected-symptom">
                      <span className="symptom-emoji">{symptom.emoji}</span>
                      <span className="symptom-name">{symptom.name}</span>
                      <select
                        value={intensity[symptomId] || 'medium'}
                        onChange={(e) => handleIntensityChange(symptomId, e.target.value)}
                        className="intensity-select"
                      >
                        <option value="mild">Mild</option>
                        <option value="medium">Medium</option>
                        <option value="severe">Severe</option>
                      </select>
                      <button 
                        onClick={() => handleSymptomToggle(symptomId)}
                        className="remove-symptom"
                      >
                        ✕
                      </button>
                    </div>
                  ) : null;
                })}
              </div>
            ) : (
              <p className="no-symptoms">No symptoms logged for today</p>
            )}
          </div>

          {/* Symptoms Grid */}
          <div className="symptoms-selection">
            <h3>Select Symptoms</h3>
            <SymptomsGrid
              selectedSymptoms={selectedSymptoms}
              onSymptomToggle={handleSymptomToggle}
            />
          </div>

          {/* Additional Notes */}
          <div className="symptoms-notes">
            <h3>Additional Notes</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => saveSymptoms()}
              placeholder="Add any additional details about how you're feeling, triggers, relief methods, or questions for your doctor..."
              rows="4"
            />
          </div>

          {/* Quick Actions */}
          <div className="symptoms-actions">
            <button onClick={() => saveSymptoms()} className="save-btn">
              💾 Save Symptoms
            </button>
            <button 
              onClick={() => {
                setSelectedSymptoms([]);
                setIntensity({});
                setNotes('');
                saveSymptoms([], {});
              }}
              className="clear-btn"
            >
              🗑️ Clear All
            </button>
          </div>
        </div>
      )}

      {activeTab === 'patterns' && (
        <div className="symptoms-patterns">
          <h3>Symptom Patterns</h3>
          
          {/* Category Breakdown */}
          <div className="category-breakdown">
            <h4>By Category</h4>
            <div className="category-stats">
              {Object.entries(symptomStats).map(([category, count]) => (
                <div key={category} className="category-stat">
                  <span className="category-name">{category}</span>
                  <div className="stat-bar">
                    <div 
                      className="stat-fill"
                      style={{ width: `${(count / selectedSymptoms.length) * 100}%` }}
                    ></div>
                  </div>
                  <span className="stat-count">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Intensity Analysis */}
          <div className="intensity-analysis">
            <h4>Symptom Intensity</h4>
            <div className="intensity-stats">
              {Object.entries(intensity).map(([symptomId, level]) => {
                const symptom = symptomsData.symptoms.find(s => s.id === symptomId);
                return symptom ? (
                  <div key={symptomId} className="intensity-stat">
                    <span className="symptom-name">{symptom.name}</span>
                    <span className={`intensity-level ${level}`}>{level}</span>
                  </div>
                ) : null;
              })}
            </div>
          </div>

          {/* Pattern Insights */}
          <div className="pattern-insights">
            <h4>Pattern Insights</h4>
            <div className="insights-list">
              {selectedSymptoms.length >= 3 && (
                <div className="insight">
                  <span className="insight-emoji">📈</span>
                  <p>You're experiencing multiple symptoms today. Consider tracking potential triggers.</p>
                </div>
              )}
              {Object.values(intensity).includes('severe') && (
                <div className="insight">
                  <span className="insight-emoji">⚠️</span>
                  <p>Some symptoms are severe. Consider consulting with a healthcare provider.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="symptoms-history">
          <h3>Symptom History</h3>
          <p>View your symptom patterns over time in the calendar and insights pages.</p>
          <div className="history-actions">
            <a href="/calendar" className="history-btn">
              📅 View Calendar
            </a>
            <a href="/cycle/insights" className="history-btn">
              📊 View Insights
            </a>
          </div>
        </div>
      )}
    </div>
  );
}