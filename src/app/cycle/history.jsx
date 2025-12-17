import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { collection, query, orderBy, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { format, subMonths } from 'date-fns';

export default function CycleHistory() {
  const { user } = useAuth();
  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('all');
  const [stats, setStats] = useState(null);
  const [selectedCycle, setSelectedCycle] = useState(null);
  const [editMode, setEditMode] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const cyclesRef = collection(db, 'cycles', user.uid, 'userCycles');
    
    let q;
    const now = new Date();
    
    switch (timeRange) {
      case '3months':
        q = query(
          cyclesRef,
          where('startDate', '>=', subMonths(now, 3)),
          orderBy('startDate', 'desc')
        );
        break;
      case '6months':
        q = query(
          cyclesRef,
          where('startDate', '>=', subMonths(now, 6)),
          orderBy('startDate', 'desc')
        );
        break;
      case '1year':
        q = query(
          cyclesRef,
          where('startDate', '>=', subMonths(now, 12)),
          orderBy('startDate', 'desc')
        );
        break;
      default:
        q = query(cyclesRef, orderBy('startDate', 'desc'));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const cyclesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCycles(cyclesData);
      calculateStats(cyclesData);
      setLoading(false);
    }, (error) => {
      console.error('Error loading cycles:', error);
      setLoading(false);
    });

    return unsubscribe;
  }, [user, timeRange]);

  const calculateStats = (cyclesData) => {
    if (cyclesData.length === 0) {
      setStats(null);
      return;
    }

    const cycleLengths = cyclesData.map(cycle => cycle.cycleLength || 0);
    const periodLengths = cyclesData.map(cycle => cycle.periodLength || 0);
    
    const avgCycleLength = cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length;
    const avgPeriodLength = periodLengths.reduce((a, b) => a + b, 0) / periodLengths.length;
    
    const cycleVariability = Math.max(...cycleLengths) - Math.min(...cycleLengths);
    
    // Calculate regularity score (0-100)
    const regularityScore = Math.max(0, 100 - (cycleVariability * 5));
    
    // Find longest and shortest cycles
    const longestCycle = cyclesData.reduce((prev, current) => 
      ((prev.cycleLength || 0) > (current.cycleLength || 0)) ? prev : current
    );
    
    const shortestCycle = cyclesData.reduce((prev, current) => 
      ((prev.cycleLength || 0) < (current.cycleLength || 0)) ? prev : current
    );

    setStats({
      totalCycles: cyclesData.length,
      avgCycleLength: avgCycleLength.toFixed(1),
      avgPeriodLength: avgPeriodLength.toFixed(1),
      cycleVariability,
      regularityScore: Math.round(regularityScore),
      longestCycle: {
        length: longestCycle.cycleLength || 0,
        date: longestCycle.startDate
      },
      shortestCycle: {
        length: shortestCycle.cycleLength || 0,
        date: shortestCycle.startDate
      },
      consistency: cycleVariability <= 7 ? 'Regular' : cycleVariability <= 14 ? 'Somewhat Irregular' : 'Irregular'
    });
  };

  const handleEditCycle = (cycleId) => {
    const cycle = cycles.find(c => c.id === cycleId);
    if (cycle) {
      setEditMode(cycleId);
      setEditForm({
        cycleLength: cycle.cycleLength || 28,
        periodLength: cycle.periodLength || 5,
        notes: cycle.notes || ''
      });
    }
  };

  const handleSaveEdit = async (cycleId) => {
    try {
      const cycleRef = doc(db, 'cycles', user.uid, 'userCycles', cycleId);
      await updateDoc(cycleRef, {
        ...editForm,
        updatedAt: new Date()
      });
      setEditMode(null);
      setEditForm({});
    } catch (error) {
      console.error('Error updating cycle:', error);
      alert('Failed to update cycle. Please try again.');
    }
  };

  const handleDeleteCycle = async (cycleId) => {
    if (!window.confirm('Are you sure you want to delete this cycle? This action cannot be undone.')) {
      return;
    }

    try {
      const cycleRef = doc(db, 'cycles', user.uid, 'userCycles', cycleId);
      await deleteDoc(cycleRef);
      setSelectedCycle(null);
    } catch (error) {
      console.error('Error deleting cycle:', error);
      alert('Failed to delete cycle. Please try again.');
    }
  };

  const exportHistory = () => {
    const exportData = {
      exportDate: new Date().toISOString(),
      totalCycles: cycles.length,
      cycles: cycles.map(cycle => ({
        startDate: cycle.startDate?.toDate ? cycle.startDate.toDate().toISOString() : cycle.startDate,
        cycleLength: cycle.cycleLength || 0,
        periodLength: cycle.periodLength || 0,
        symptoms: cycle.symptoms || [],
        notes: cycle.notes || ''
      }))
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cycle-history-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getCycleTrend = () => {
    if (cycles.length < 3) return 'Not enough data';
    
    const recentCycles = cycles.slice(0, 3);
    const avgRecent = recentCycles.reduce((sum, cycle) => sum + (cycle.cycleLength || 0), 0) / recentCycles.length;
    const allAvg = cycles.reduce((sum, cycle) => sum + (cycle.cycleLength || 0), 0) / cycles.length;
    
    const difference = avgRecent - allAvg;
    
    if (Math.abs(difference) < 2) return 'Stable';
    if (difference > 2) return 'Getting longer';
    return 'Getting shorter';
  };

  const formatCycleDate = (date) => {
    if (!date) return 'Unknown date';
    
    try {
      if (date.toDate) {
        return format(date.toDate(), 'MMM d, yyyy');
      } else if (date instanceof Date) {
        return format(date, 'MMM d, yyyy');
      } else {
        return 'Invalid date';
      }
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <div className="cycle-history">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading your cycle history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cycle-history">
      <div className="history-header">
        <h1>Cycle History</h1>
        <p>Track and analyze your menstrual cycle patterns over time</p>
      </div>

      {/* Time Range Filter */}
      <div className="time-range-filter">
        <h3>Time Range</h3>
        <div className="range-buttons">
          <button 
            className={`range-btn ${timeRange === '3months' ? 'active' : ''}`}
            onClick={() => setTimeRange('3months')}
          >
            Last 3 Months
          </button>
          <button 
            className={`range-btn ${timeRange === '6months' ? 'active' : ''}`}
            onClick={() => setTimeRange('6months')}
          >
            Last 6 Months
          </button>
          <button 
            className={`range-btn ${timeRange === '1year' ? 'active' : ''}`}
            onClick={() => setTimeRange('1year')}
          >
            Last Year
          </button>
          <button 
            className={`range-btn ${timeRange === 'all' ? 'active' : ''}`}
            onClick={() => setTimeRange('all')}
          >
            All Time
          </button>
        </div>
      </div>

      {/* Statistics Overview */}
      {stats && (
        <div className="stats-overview">
          <h3>Cycle Statistics</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <h4>{stats.totalCycles}</h4>
                <p>Total Cycles Tracked</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">📅</div>
              <div className="stat-content">
                <h4>{stats.avgCycleLength} days</h4>
                <p>Average Cycle Length</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">🩸</div>
              <div className="stat-content">
                <h4>{stats.avgPeriodLength} days</h4>
                <p>Average Period Length</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">📈</div>
              <div className="stat-content">
                <h4>{stats.regularityScore}%</h4>
                <p>Regularity Score</p>
              </div>
            </div>
          </div>
          
          {/* Detailed Stats */}
          <div className="detailed-stats">
            <div className="stat-row">
              <span className="stat-label">Cycle Consistency:</span>
              <span className={`stat-value ${stats.consistency.toLowerCase().replace(' ', '-')}`}>
                {stats.consistency}
              </span>
            </div>
            
            <div className="stat-row">
              <span className="stat-label">Cycle Variability:</span>
              <span className="stat-value">{stats.cycleVariability} days</span>
            </div>
            
            <div className="stat-row">
              <span className="stat-label">Recent Trend:</span>
              <span className="stat-value">{getCycleTrend()}</span>
            </div>
            
            <div className="stat-row">
              <span className="stat-label">Longest Cycle:</span>
              <span className="stat-value">
                {stats.longestCycle.length} days ({formatCycleDate(stats.longestCycle.date)})
              </span>
            </div>
            
            <div className="stat-row">
              <span className="stat-label">Shortest Cycle:</span>
              <span className="stat-value">
                {stats.shortestCycle.length} days ({formatCycleDate(stats.shortestCycle.date)})
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Cycle History List */}
      <div className="cycles-list-section">
        <div className="section-header">
          <h3>Your Cycles</h3>
          <div className="section-actions">
            <button onClick={exportHistory} className="export-btn">
              📤 Export History
            </button>
          </div>
        </div>
        
        {cycles.length === 0 ? (
          <div className="no-cycles">
            <div className="no-cycles-icon">📅</div>
            <h4>No Cycles Tracked Yet</h4>
            <p>Start tracking your cycles to see your history and patterns</p>
            <a href="/calendar" className="start-tracking-btn">
              Start Tracking
            </a>
          </div>
        ) : (
          <div className="cycles-list">
            {cycles.map((cycle, index) => (
              <div 
                key={cycle.id} 
                className={`cycle-item ${selectedCycle?.id === cycle.id ? 'selected' : ''}`}
                onClick={() => setSelectedCycle(selectedCycle?.id === cycle.id ? null : cycle)}
              >
                <div className="cycle-summary">
                  <div className="cycle-date">
                    <span className="cycle-number">Cycle #{cycles.length - index}</span>
                    <span className="cycle-start-date">
                      {formatCycleDate(cycle.startDate)}
                    </span>
                  </div>
                  
                  <div className="cycle-details">
                    <div className="detail">
                      <span className="detail-label">Length:</span>
                      <span className="detail-value">{cycle.cycleLength || '--'} days</span>
                    </div>
                    
                    <div className="detail">
                      <span className="detail-label">Period:</span>
                      <span className="detail-value">{cycle.periodLength || '--'} days</span>
                    </div>
                    
                    {cycle.symptoms && cycle.symptoms.length > 0 && (
                      <div className="detail">
                        <span className="detail-label">Symptoms:</span>
                        <span className="detail-value">{cycle.symptoms.length}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="cycle-arrow">
                    {selectedCycle?.id === cycle.id ? '▲' : '▼'}
                  </div>
                </div>
                
                {selectedCycle?.id === cycle.id && (
                  <div className="cycle-details-expanded">
                    <div className="cycle-details-content">
                      <div className="cycle-actions">
                        <button 
                          onClick={() => handleEditCycle(cycle.id)}
                          className="edit-cycle-btn"
                        >
                          ✏️ Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteCycle(cycle.id)}
                          className="delete-cycle-btn"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                      
                      {editMode === cycle.id ? (
                        <div className="edit-cycle-form">
                          <div className="form-group">
                            <label>Cycle Length (days)</label>
                            <input
                              type="number"
                              value={editForm.cycleLength}
                              onChange={(e) => setEditForm(prev => ({
                                ...prev,
                                cycleLength: parseInt(e.target.value) || 0
                              }))}
                              min="21"
                              max="45"
                            />
                          </div>
                          
                          <div className="form-group">
                            <label>Period Length (days)</label>
                            <input
                              type="number"
                              value={editForm.periodLength}
                              onChange={(e) => setEditForm(prev => ({
                                ...prev,
                                periodLength: parseInt(e.target.value) || 0
                              }))}
                              min="2"
                              max="10"
                            />
                          </div>
                          
                          <div className="form-group">
                            <label>Notes</label>
                            <textarea
                              value={editForm.notes}
                              onChange={(e) => setEditForm(prev => ({
                                ...prev,
                                notes: e.target.value
                              }))}
                              rows="3"
                              placeholder="Add any notes about this cycle..."
                            />
                          </div>
                          
                          <div className="form-actions">
                            <button 
                              onClick={() => setEditMode(null)}
                              className="cancel-btn"
                            >
                              Cancel
                            </button>
                            <button 
                              onClick={() => handleSaveEdit(cycle.id)}
                              className="save-btn"
                            >
                              Save Changes
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {cycle.notes && (
                            <div className="cycle-notes">
                              <h4>Notes</h4>
                              <p>{cycle.notes}</p>
                            </div>
                          )}
                          
                          {cycle.symptoms && cycle.symptoms.length > 0 && (
                            <div className="cycle-symptoms">
                              <h4>Common Symptoms</h4>
                              <div className="symptoms-list">
                                {cycle.symptoms.slice(0, 5).map((symptom, idx) => (
                                  <span key={idx} className="symptom-tag">
                                    {symptom}
                                  </span>
                                ))}
                                {cycle.symptoms.length > 5 && (
                                  <span className="symptom-tag more">
                                    +{cycle.symptoms.length - 5} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                          
                          <div className="cycle-meta">
                            <div className="meta-item">
                              <span className="meta-label">Started:</span>
                              <span className="meta-value">{formatCycleDate(cycle.startDate)}</span>
                            </div>
                            
                            {cycle.createdAt && (
                              <div className="meta-item">
                                <span className="meta-label">Tracked:</span>
                                <span className="meta-value">
                                  {format(cycle.createdAt.toDate(), 'MMM d, yyyy')}
                                </span>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cycle Pattern Visualization */}
      {cycles.length >= 3 && (
        <div className="pattern-visualization">
          <h3>Cycle Length Pattern</h3>
          <div className="pattern-chart">
            <div className="chart-container">
              <div className="chart-bars">
                {cycles.slice(0, 12).map((cycle, index) => {
                  const maxLength = Math.max(...cycles.slice(0, 12).map(c => c.cycleLength || 0));
                  const height = maxLength > 0 ? ((cycle.cycleLength || 0) / maxLength) * 150 : 0;
                  
                  return (
                    <div key={cycle.id} className="chart-bar-container">
                      <div 
                        className="chart-bar"
                        style={{ height: `${height}px` }}
                        title={`Cycle ${cycles.length - index}: ${cycle.cycleLength || 0} days`}
                      >
                        <span className="bar-value">{cycle.cycleLength || 0}</span>
                      </div>
                      <span className="bar-label">
                        {cycles.length - index}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="chart-legend">
                <div className="legend-item">
                  <span className="legend-color" style={{ backgroundColor: 'var(--primary)' }}></span>
                  <span>Cycle Length (days)</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color" style={{ backgroundColor: 'var(--accent)' }}></span>
                  <span>Average: {stats?.avgCycleLength} days</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cycle Health Insights */}
      {stats && (
        <div className="health-insights">
          <h3>Health Insights</h3>
          <div className="insights-grid">
            <div className="insight-card">
              <div className="insight-icon">💡</div>
              <div className="insight-content">
                <h4>Cycle Regularity</h4>
                <p>
                  {stats.consistency === 'Regular' 
                    ? 'Your cycles are very regular! This makes predictions more accurate.'
                    : stats.consistency === 'Somewhat Irregular'
                    ? 'Your cycles show some variation. Consider tracking additional symptoms.'
                    : 'Your cycles vary significantly. This is normal for some people, but consult a doctor if concerned.'}
                </p>
              </div>
            </div>
            
            <div className="insight-card">
              <div className="insight-icon">🎯</div>
              <div className="insight-content">
                <h4>Prediction Accuracy</h4>
                <p>
                  Based on {cycles.length} tracked cycles, your prediction accuracy is 
                  approximately {Math.min(95, Math.max(70, stats.regularityScore))}%.
                  {cycles.length < 6 && ' Track more cycles to improve accuracy.'}
                </p>
              </div>
            </div>
            
            <div className="insight-card">
              <div className="insight-icon">📝</div>
              <div className="insight-content">
                <h4>Tracking Tips</h4>
                <ul>
                  <li>Log symptoms daily for better pattern recognition</li>
                  <li>Track basal body temperature for ovulation confirmation</li>
                  <li>Note lifestyle factors that might affect your cycle</li>
                  <li>Export your data before doctor's appointments</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="action-buttons">
        <a href="/cycle/insights" className="action-btn">
          📊 View Insights
        </a>
        <a href="/calendar" className="action-btn">
          📅 Go to Calendar
        </a>
        <a href="/ovulation/forecast" className="action-btn">
          🌱 Fertility Forecast
        </a>
      </div>
    </div>
  );
}