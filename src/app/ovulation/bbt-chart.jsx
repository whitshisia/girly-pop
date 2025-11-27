import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useDailyLogs } from '../../../hooks/useDailyLogs';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import BBTChart from '../../../components/BBTChart';

export default function BBTChartPage() {
  const { user } = useAuth();
  const { logs } = useDailyLogs();
  const [bbtData, setBbtData] = useState([]);
  const [currentBBT, setCurrentBBT] = useState('');
  const [chartPeriod, setChartPeriod] = useState(30);

  useEffect(() => {
    // Extract BBT data from logs
    const bbtLogs = Object.entries(logs)
      .filter(([_, log]) => log.bbt)
      .map(([date, log]) => ({
        date,
        temperature: log.bbt,
        ...log
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-chartPeriod);

    setBbtData(bbtLogs);
  }, [logs, chartPeriod]);

  const handleSaveBBT = async () => {
    if (!user || !currentBBT) return;

    const today = new Date().toISOString().split('T')[0];
    const logRef = doc(db, 'dailyLogs', user.uid, 'logs', today);

    try {
      await updateDoc(logRef, {
        bbt: parseFloat(currentBBT),
        updatedAt: new Date()
      }, { merge: true });
      
      setCurrentBBT('');
    } catch (error) {
      console.error('Error saving BBT:', error);
    }
  };

  const detectOvulation = () => {
    if (bbtData.length < 7) return null;

    for (let i = 3; i < bbtData.length - 3; i++) {
      const previousAvg = bbtData.slice(i-3, i).reduce((sum, log) => sum + log.temperature, 0) / 3;
      const nextAvg = bbtData.slice(i, i+3).reduce((sum, log) => sum + log.temperature, 0) / 3;
      
      if (nextAvg - previousAvg > 0.2) {
        return {
          date: bbtData[i].date,
          temperatureShift: (nextAvg - previousAvg).toFixed(2)
        };
      }
    }
    return null;
  };

  const ovulation = detectOvulation();

  return (
    <div className="bbt-chart-page">
      <div className="bbt-header">
        <h1>Basal Body Temperature Chart</h1>
        <p>Track your temperature to detect ovulation patterns</p>
      </div>

      <div className="bbt-content">
        {/* Quick BBT Entry */}
        <div className="bbt-entry-card">
          <h3>Log Today's Temperature</h3>
          <div className="bbt-input-group">
            <input
              type="number"
              step="0.01"
              value={currentBBT}
              onChange={(e) => setCurrentBBT(e.target.value)}
              placeholder="36.5"
              min="35"
              max="38"
            />
            <span className="unit">°C</span>
            <button 
              onClick={handleSaveBBT}
              disabled={!currentBBT}
              className="save-bbt-btn"
            >
              Save
            </button>
          </div>
          <small>Take your temperature first thing in the morning</small>
        </div>

        {/* Chart Controls */}
        <div className="chart-controls">
          <label>Show last:</label>
          <select 
            value={chartPeriod} 
            onChange={(e) => setChartPeriod(parseInt(e.target.value))}
          >
            <option value={14}>2 weeks</option>
            <option value={30}>1 month</option>
            <option value={60}>2 months</option>
            <option value={90}>3 months</option>
          </select>
        </div>

        {/* BBT Chart */}
        <div className="chart-container">
          <BBTChart data={bbtData} />
        </div>

        {/* Ovulation Detection */}
        {ovulation && (
          <div className="ovulation-detection">
            <h3>Ovulation Detection</h3>
            <div className="detection-result">
              <div className="result-icon">📈</div>
              <div className="result-info">
                <h4>Possible Ovulation Detected</h4>
                <p>Temperature shift of {ovulation.temperatureShift}°C around {new Date(ovulation.date).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        )}

        {/* BBT Tips */}
        <div className="bbt-tips">
          <h3>BBT Tracking Tips</h3>
          <div className="tips-grid">
            <div className="tip-card">
              <span className="tip-emoji">⏰</span>
              <h4>Consistent Timing</h4>
              <p>Take your temperature at the same time every morning, before getting out of bed</p>
            </div>
            <div className="tip-card">
              <span className="tip-emoji">😴</span>
              <h4>Minimum Sleep</h4>
              <p>Get at least 3-4 hours of uninterrupted sleep before measuring</p>
            </div>
            <div className="tip-card">
              <span className="tip-emoji">📱</span>
              <h4>Use Same Method</h4>
              <p>Stick to the same thermometer and measurement method</p>
            </div>
            <div className="tip-card">
              <span className="tip-emoji">📝</span>
              <h4>Note Factors</h4>
              <p>Record illness, alcohol, or poor sleep that might affect temperature</p>
            </div>
          </div>
        </div>

        {/* BBT Data Table */}
        <div className="bbt-data-table">
          <h3>Recent Temperature Readings</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Temperature (°C)</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {bbtData.slice(-10).reverse().map((log, index) => (
                  <tr key={index}>
                    <td>{new Date(log.date).toLocaleDateString()}</td>
                    <td className="temperature">{log.temperature}°C</td>
                    <td className="notes">
                      {log.symptoms?.includes('sick') && '🤒 '}
                      {log.symptoms?.includes('alcohol') && '🍷 '}
                      {log.symptoms?.includes('poor-sleep') && '😴 '}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}