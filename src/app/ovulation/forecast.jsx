import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useCyclePredictor } from '../../../hooks/useCyclePredictor';
import { useDailyLogs } from '../../../hooks/useDailyLogs';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

export default function OvulationForecast() {
  const { user } = useAuth();
  const { predictions, currentCycle } = useCyclePredictor();
  const { logs } = useDailyLogs();
  const [fertilitySigns, setFertilitySigns] = useState({});

  useEffect(() => {
    if (!user) return;

    // Analyze logs for fertility signs
    const analyzeFertilitySigns = () => {
      const signs = {
        cervicalMucus: {},
        libido: {},
        ovulationPain: {}
      };

      Object.entries(logs).forEach(([date, log]) => {
        if (log.symptoms) {
          if (log.symptoms.includes('egg-white-cm')) signs.cervicalMucus[date] = 'high';
          else if (log.symptoms.includes('creamy-cm')) signs.cervicalMucus[date] = 'medium';
          
          if (log.symptoms.includes('increased-libido')) signs.libido[date] = true;
          if (log.symptoms.includes('ovulation-pain')) signs.ovulationPain[date] = true;
        }
      });

      setFertilitySigns(signs);
    };

    analyzeFertilitySigns();
  }, [user, logs]);

  const getFertilityScore = (date) => {
    if (!predictions.fertileWindow) return 0;
    
    const targetDate = new Date(date);
    if (targetDate >= predictions.fertileWindow.start && targetDate <= predictions.fertileWindow.end) {
      // Calculate score based on position in fertile window
      const windowStart = predictions.fertileWindow.start;
      const windowEnd = predictions.fertileWindow.end;
      const windowLength = (windowEnd - windowStart) / (1000 * 60 * 60 * 24);
      const daysFromStart = (targetDate - windowStart) / (1000 * 60 * 60 * 24);
      
      return Math.min(100, Math.max(10, Math.round((daysFromStart / windowLength) * 100)));
    }
    return 0;
  };

  const generateForecast = () => {
    if (!predictions.fertileWindow) return [];
    
    const forecast = [];
    const startDate = new Date(predictions.fertileWindow.start);
    const endDate = new Date(predictions.fertileWindow.end);
    
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0];
      forecast.push({
        date: new Date(date),
        fertilityScore: getFertilityScore(date),
        isOvulation: date.toDateString() === predictions.ovulation?.toDateString(),
        signs: fertilitySigns.cervicalMucus[dateStr] || 'low'
      });
    }
    
    return forecast;
  };

  const forecast = generateForecast();

  return (
    <div className="ovulation-forecast">
      <div className="forecast-header">
        <h1>Ovulation Forecast</h1>
        <p>Track your fertile window and ovulation signs</p>
      </div>

      {predictions.fertileWindow ? (
        <div className="forecast-content">
          {/* Current Status */}
          <div className="current-status">
            <h3>Current Fertility Status</h3>
            <div className="status-card">
              <div className="fertility-meter">
                <div 
                  className="fertility-fill"
                  style={{ width: `${getFertilityScore(new Date())}%` }}
                ></div>
              </div>
              <div className="status-info">
                <span className="fertility-score">{getFertilityScore(new Date())}%</span>
                <span className="fertility-label">
                  {getFertilityScore(new Date()) > 50 ? 'High Fertility' : 'Low Fertility'}
                </span>
              </div>
            </div>
          </div>

          {/* Forecast Timeline */}
          <div className="forecast-timeline">
            <h3>Fertile Window Forecast</h3>
            <div className="timeline">
              {forecast.map((day, index) => (
                <div key={index} className={`timeline-day ${day.isOvulation ? 'ovulation-day' : ''}`}>
                  <div className="day-date">
                    {day.date.getDate()}
                    <small>{day.date.toLocaleDateString('en', { weekday: 'short' })}</small>
                  </div>
                  <div className="fertility-indicator">
                    <div 
                      className="fertility-bar"
                      style={{ height: `${day.fertilityScore}%` }}
                    ></div>
                  </div>
                  <div className="day-score">{day.fertilityScore}%</div>
                  {day.isOvulation && (
                    <div className="ovulation-badge">Ovulation</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Fertility Signs */}
          <div className="fertility-signs">
            <h3>Track Your Fertility Signs</h3>
            <div className="signs-grid">
              <div className="sign-card">
                <div className="sign-emoji">💧</div>
                <h4>Cervical Mucus</h4>
                <p>Egg-white consistency indicates high fertility</p>
                <div className="sign-types">
                  <span className="sign-type dry">Dry</span>
                  <span className="sign-type creamy">Creamy</span>
                  <span className="sign-type egg-white">Egg White</span>
                </div>
              </div>

              <div className="sign-card">
                <div className="sign-emoji">🌡️</div>
                <h4>Basal Body Temperature</h4>
                <p>Temperature rise confirms ovulation occurred</p>
                <a href="/ovulation/bbt-chart" className="view-chart-btn">
                  View BBT Chart
                </a>
              </div>

              <div className="sign-card">
                <div className="sign-emoji">❤️</div>
                <h4>Libido</h4>
                <p>Increased sex drive around ovulation</p>
                <div className="sign-options">
                  <button className="sign-btn">Low</button>
                  <button className="sign-btn">Normal</button>
                  <button className="sign-btn active">High</button>
                </div>
              </div>

              <div className="sign-card">
                <div className="sign-emoji">🎯</div>
                <h4>Ovulation Tests</h4>
                <p>Track LH surge with ovulation predictor kits</p>
                <a href="/ovulation/tests" className="log-test-btn">
                  Log Test Results
                </a>
              </div>
            </div>
          </div>

          {/* Prediction Details */}
          <div className="prediction-details">
            <h3>Prediction Details</h3>
            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">Next Fertile Window</span>
                <span className="detail-value">
                  {predictions.fertileWindow.start.toLocaleDateString()} - {predictions.fertileWindow.end.toLocaleDateString()}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Expected Ovulation</span>
                <span className="detail-value">
                  {predictions.ovulation?.toLocaleDateString()}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Cycle Day Today</span>
                <span className="detail-value">
                  {currentCycle ? Math.floor((new Date() - currentCycle.startDate.toDate()) / (1000 * 60 * 60 * 24)) : 'Unknown'}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="no-prediction">
          <div className="no-prediction-icon">📊</div>
          <h3>Need More Data</h3>
          <p>Track a few more cycles to get accurate ovulation predictions</p>
          <a href="/calendar" className="track-cycle-btn">
            Start Tracking
          </a>
        </div>
      )}
    </div>
  );
}