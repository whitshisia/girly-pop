import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { collection, addDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { format } from 'date-fns';

export default function OvulationTests() {
  const { user } = useAuth();
  const [tests, setTests] = useState([]);
  const [showAddTest, setShowAddTest] = useState(false);
  const [newTest, setNewTest] = useState({
    date: new Date().toISOString().split('T')[0],
    time: '08:00',
    result: '',
    intensity: '',
    notes: ''
  });

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'ovulationTests', user.uid, 'tests'),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const testsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTests(testsData);
    });

    return unsubscribe;
  }, [user]);

  const handleAddTest = async (e) => {
    e.preventDefault();
    if (!user) return;

    try {
      await addDoc(collection(db, 'ovulationTests', user.uid, 'tests'), {
        ...newTest,
        createdAt: new Date(),
        datetime: new Date(`${newTest.date}T${newTest.time}`)
      });

      setNewTest({
        date: new Date().toISOString().split('T')[0],
        time: '08:00',
        result: '',
        intensity: '',
        notes: ''
      });
      setShowAddTest(false);
    } catch (error) {
      console.error('Error adding test:', error);
    }
  };

  const getResultColor = (result) => {
    switch (result) {
      case 'positive': return 'positive';
      case 'negative': return 'negative';
      case 'high': return 'high';
      case 'peak': return 'peak';
      default: return '';
    }
  };

  const getResultIcon = (result) => {
    switch (result) {
      case 'positive': return '✅';
      case 'negative': return '❌';
      case 'high': return '⚠️';
      case 'peak': return '📈';
      default: return '📊';
    }
  };

  return (
    <div className="ovulation-tests">
      <div className="tests-header">
        <h1>Ovulation Tests</h1>
        <p>Track your LH surge with ovulation predictor kits</p>
        <button 
          onClick={() => setShowAddTest(true)}
          className="add-test-btn"
        >
          + Log New Test
        </button>
      </div>

      {/* Add Test Modal */}
      {showAddTest && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Log Ovulation Test</h3>
              <button onClick={() => setShowAddTest(false)} className="close-btn">✕</button>
            </div>
            
            <form onSubmit={handleAddTest} className="test-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    value={newTest.date}
                    onChange={(e) => setNewTest(prev => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Time</label>
                  <input
                    type="time"
                    value={newTest.time}
                    onChange={(e) => setNewTest(prev => ({ ...prev, time: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Test Result</label>
                <div className="result-options">
                  {[
                    { value: 'negative', label: 'Negative', emoji: '❌' },
                    { value: 'high', label: 'High', emoji: '⚠️' },
                    { value: 'peak', label: 'Peak', emoji: '📈' },
                    { value: 'positive', label: 'Positive', emoji: '✅' }
                  ].map(option => (
                    <button
                      key={option.value}
                      type="button"
                      className={`result-option ${newTest.result === option.value ? 'selected' : ''}`}
                      onClick={() => setNewTest(prev => ({ ...prev, result: option.value }))}
                    >
                      <span className="option-emoji">{option.emoji}</span>
                      <span className="option-label">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Line Intensity (Optional)</label>
                <div className="intensity-options">
                  {['very-faint', 'faint', 'medium', 'dark', 'very-dark'].map(intensity => (
                    <button
                      key={intensity}
                      type="button"
                      className={`intensity-option ${newTest.intensity === intensity ? 'selected' : ''}`}
                      onClick={() => setNewTest(prev => ({ ...prev, intensity }))}
                    >
                      {intensity.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={newTest.notes}
                  onChange={(e) => setNewTest(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any additional notes about the test..."
                  rows="3"
                />
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setShowAddTest(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Test
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tests History */}
      <div className="tests-history">
        <h3>Test History</h3>
        
        {tests.length === 0 ? (
          <div className="no-tests">
            <div className="no-tests-icon">🧪</div>
            <p>No ovulation tests recorded yet</p>
            <p>Start tracking to detect your LH surge pattern</p>
          </div>
        ) : (
          <div className="tests-list">
            {tests.map(test => (
              <div key={test.id} className={`test-card ${getResultColor(test.result)}`}>
                <div className="test-header">
                  <div className="test-result">
                    <span className="result-emoji">{getResultIcon(test.result)}</span>
                    <span className="result-text">{test.result.toUpperCase()}</span>
                  </div>
                  <div className="test-date">
                    {format(new Date(test.datetime.toDate()), 'MMM d, yyyy')} at {test.time}
                  </div>
                </div>
                
                <div className="test-details">
                  {test.intensity && (
                    <span className="test-intensity">
                      Intensity: {test.intensity.replace('-', ' ')}
                    </span>
                  )}
                  {test.notes && (
                    <p className="test-notes">{test.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Testing Tips */}
      <div className="testing-tips">
        <h3>Ovulation Test Tips</h3>
        <div className="tips-grid">
          <div className="tip-card">
            <h4>⏰ Best Time to Test</h4>
            <p>Test between 10 AM and 8 PM. Avoid first morning urine as LH surge may not be detected yet.</p>
          </div>
          <div className="tip-card">
            <h4>💧 Reduce Fluid Intake</h4>
            <p>Limit fluids for 2 hours before testing to avoid diluting the LH concentration.</p>
          </div>
          <div className="tip-card">
            <h4>📅 When to Start</h4>
            <p>Begin testing a few days before your expected ovulation based on cycle length.</p>
          </div>
          <div className="tip-card">
            <h4>🔍 Reading Results</h4>
            <p>Test line darker than control = positive. Test line lighter = negative.</p>
          </div>
        </div>
      </div>

      {/* Testing Pattern */}
      <div className="testing-pattern">
        <h3>Your Testing Pattern</h3>
        <div className="pattern-chart">
          {/* Simple chart showing test results over time */}
          <div className="pattern-timeline">
            {tests.slice(0, 14).map((test, index) => (
              <div key={test.id} className="pattern-day">
                <div 
                  className={`pattern-dot ${getResultColor(test.result)}`}
                  title={`${test.result} - ${format(new Date(test.datetime.toDate()), 'MMM d')}`}
                ></div>
                {index < tests.length - 1 && <div className="pattern-line"></div>}
              </div>
            ))}
          </div>
          <div className="pattern-legend">
            <span className="legend-item positive">Positive</span>
            <span className="legend-item high">High</span>
            <span className="legend-item negative">Negative</span>
          </div>
        </div>
      </div>
    </div>
  );
}