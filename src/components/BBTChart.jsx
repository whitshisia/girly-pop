import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function BBTChart({ cycleLength = 30 }) {
  const { user } = useAuth();
  const [bbtData, setBbtData] = useState([]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'dailyLogs', user.uid, 'logs'),
      orderBy('date', 'desc'),
      limit(cycleLength)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({
        date: doc.id,
        ...doc.data()
      })).reverse();

      setBbtData(logs.filter(log => log.bbt));
    });

    return unsubscribe;
  }, [user, cycleLength]);

  const chartData = {
    labels: bbtData.map(log => new Date(log.date).getDate()),
    datasets: [
      {
        label: 'Basal Body Temperature (°C)',
        data: bbtData.map(log => log.bbt),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
        pointBackgroundColor: bbtData.map((log, index) => 
          index > 0 && log.bbt > bbtData[index - 1].bbt ? 'red' : 'rgb(75, 192, 192)'
        )
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'BBT Chart - Look for Temperature Shift'
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `BBT: ${context.parsed.y}°C`;
          }
        }
      }
    },
    scales: {
      y: {
        min: 35.5,
        max: 38.5,
        title: {
          display: true,
          text: 'Temperature (°C)'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Cycle Day'
        }
      }
    }
  };

  const detectOvulation = () => {
    if (bbtData.length < 7) return null;
    
    // Simple ovulation detection based on temperature shift
    for (let i = 3; i < bbtData.length - 3; i++) {
      const previousAvg = bbtData.slice(i-3, i).reduce((sum, log) => sum + log.bbt, 0) / 3;
      const nextAvg = bbtData.slice(i, i+3).reduce((sum, log) => sum + log.bbt, 0) / 3;
      
      if (nextAvg - previousAvg > 0.2) {
        return new Date(bbtData[i].date);
      }
    }
    return null;
  };

  const ovulationDate = detectOvulation();

  return (
    <div className="bbt-chart">
      <div className="chart-header">
        <h3>Basal Body Temperature</h3>
        {ovulationDate && (
          <div className="ovulation-alert">
            📈 Possible ovulation detected around {ovulationDate.toLocaleDateString()}
          </div>
        )}
      </div>
      
      <div className="chart-container">
        {bbtData.length > 0 ? (
          <Line data={chartData} options={options} />
        ) : (
          <div className="no-data">
            <p>No BBT data recorded yet</p>
            <p>Start logging your temperature to see the chart</p>
          </div>
        )}
      </div>

      <div className="chart-legend">
        <div className="legend-item">
          <span className="legend-color" style={{backgroundColor: 'rgb(75, 192, 192)'}}></span>
          <span>Normal Temperature</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{backgroundColor: 'red'}}></span>
          <span>Temperature Rise (Possible Ovulation)</span>
        </div>
      </div>
    </div>
  );
}