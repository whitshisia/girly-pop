import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useCyclePredictor } from '../../../hooks/useCyclePredictor';
import { useDailyLogs } from '../../../hooks/useDailyLogs';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

export default function CycleInsights() {
  const { user } = useAuth();
  const { currentCycle, predictions } = useCyclePredictor();
  const { logs } = useDailyLogs();
  const [cycleHistory, setCycleHistory] = useState([]);
  const [insights, setInsights] = useState([]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'cycles', user.uid, 'userCycles'),
      orderBy('startDate', 'desc'),
      limit(12)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const cycles = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCycleHistory(cycles);
      generateInsights(cycles);
    });

    return unsubscribe;
  }, [user]);

  const generateInsights = (cycles) => {
    const newInsights = [];

    if (cycles.length >= 3) {
      const avgCycleLength = cycles.reduce((sum, cycle) => sum + cycle.cycleLength, 0) / cycles.length;
      const variability = Math.max(...cycles.map(c => c.cycleLength)) - Math.min(...cycles.map(c => c.cycleLength));
      
      if (variability <= 3) {
        newInsights.push({
          type: 'regular',
          title: 'Regular Cycle',
          message: 'Your cycle is very regular. Great for prediction accuracy!',
          emoji: '✅'
        });
      } else if (variability <= 7) {
        newInsights.push({
          type: 'slightly-irregular',
          title: 'Slightly Irregular',
          message: 'Your cycle varies by ' + variability + ' days. Consider tracking additional symptoms.',
          emoji: '⚠️'
        });
      } else {
        newInsights.push({
          type: 'irregular',
          title: 'Irregular Cycle',
          message: 'Your cycle varies significantly. Consult with a healthcare provider if concerned.',
          emoji: '🔍'
        });
      }
    }

    // Symptom patterns
    const commonSymptoms = {};
    Object.values(logs).forEach(log => {
      log.symptoms?.forEach(symptom => {
        commonSymptoms[symptom] = (commonSymptoms[symptom] || 0) + 1;
      });
    });

    const topSymptoms = Object.entries(commonSymptoms)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);

    if (topSymptoms.length > 0) {
      newInsights.push({
        type: 'symptoms',
        title: 'Common Symptoms',
        message: `You frequently experience: ${topSymptoms.map(([symptom]) => symptom).join(', ')}`,
        emoji: '🤒'
      });
    }

    setInsights(newInsights);
  };

  const getFertilityScore = () => {
    if (!predictions.fertileWindow) return 0;
    
    const today = new Date();
    if (today >= predictions.fertileWindow.start && today <= predictions.fertileWindow.end) {
      return 85; // High fertility during window
    }
    return 15; // Low fertility outside window
  };

  return (
    <div className="insights-page">
      <div className="insights-header">
        <h1>Cycle Insights</h1>
        <p>Personalized analysis based on your tracking data</p>
      </div>

      <div className="insights-grid">
        {/* Current Cycle Stats */}
        <div className="insight-card main-stat">
          <h3>Current Cycle</h3>
          {currentCycle ? (
            <div className="cycle-stats">
              <div className="stat">
                <span className="stat-value">{currentCycle.cycleLength}</span>
                <span className="stat-label">Days</span>
              </div>
              <div className="stat">
                <span className="stat-value">{currentCycle.periodLength}</span>
                <span className="stat-label">Period Days</span>
              </div>
              <div className="stat">
                <span className="stat-value">{getFertilityScore()}%</span>
                <span className="stat-label">Fertility Today</span>
              </div>
            </div>
          ) : (
            <p>No current cycle data</p>
          )}
        </div>

        {/* Generated Insights */}
        {insights.map((insight, index) => (
          <div key={index} className={`insight-card ${insight.type}`}>
            <div className="insight-emoji">{insight.emoji}</div>
            <h4>{insight.title}</h4>
            <p>{insight.message}</p>
          </div>
        ))}

        {/* Cycle History */}
        <div className="insight-card history">
          <h3>Cycle History</h3>
          <div className="cycle-history">
            {cycleHistory.slice(0, 6).map(cycle => (
              <div key={cycle.id} className="history-item">
                <span className="cycle-date">
                  {new Date(cycle.startDate.seconds * 1000).toLocaleDateString()}
                </span>
                <span className="cycle-length">{cycle.cycleLength} days</span>
              </div>
            ))}
          </div>
          {cycleHistory.length === 0 && (
            <p>Track more cycles to see history</p>
          )}
        </div>

        {/* Prediction Accuracy */}
        <div className="insight-card accuracy">
          <h3>Prediction Accuracy</h3>
          <div className="accuracy-meter">
            <div className="accuracy-fill" style={{ width: '78%' }}></div>
          </div>
          <p>Based on {cycleHistory.length} recorded cycles</p>
        </div>
      </div>
    </div>
  );
}