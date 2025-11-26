import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../hooks/useAuth';
import SymptomsGrid from '../../components/SymptomsGrid';

export default function DailyLog() {
  const { date } = useParams();
  const { user } = useAuth();
  const [logData, setLogData] = useState({
    flow: '',
    symptoms: [],
    mood: '',
    bbt: '',
    notes: '',
    sexualActivity: false
  });

  useEffect(() => {
    loadLogData();
  }, [date, user]);

  const loadLogData = async () => {
    if (!user) return;
    
    const logRef = doc(db, 'dailyLogs', user.uid, 'logs', date);
    const logSnap = await getDoc(logRef);
    
    if (logSnap.exists()) {
      setLogData(logSnap.data());
    }
  };

  const saveLog = async () => {
    if (!user) return;
    
    const logRef = doc(db, 'dailyLogs', user.uid, 'logs', date);
    await setDoc(logRef, {
      ...logData,
      date,
      updatedAt: new Date()
    }, { merge: true });
  };

  const handleSymptomToggle = (symptom) => {
    setLogData(prev => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptom)
        ? prev.symptoms.filter(s => s !== symptom)
        : [...prev.symptoms, symptom]
    }));
  };

  return (
    <div className="daily-log">
      <h2>Log for {new Date(date).toLocaleDateString()}</h2>
      
      <div className="log-section">
        <h3>Flow</h3>
        <div className="flow-buttons">
          {['none', 'light', 'medium', 'heavy'].map(flow => (
            <button
              key={flow}
              className={logData.flow === flow ? 'active' : ''}
              onClick={() => setLogData(prev => ({ ...prev, flow }))}
            >
              {flow}
            </button>
          ))}
        </div>
      </div>

      <div className="log-section">
        <h3>Symptoms</h3>
        <SymptomsGrid 
          selectedSymptoms={logData.symptoms}
          onSymptomToggle={handleSymptomToggle}
        />
      </div>

      <div className="log-section">
        <h3>Basal Body Temperature</h3>
        <input
          type="number"
          step="0.01"
          value={logData.bbt}
          onChange={(e) => setLogData(prev => ({ ...prev, bbt: e.target.value }))}
          placeholder="36.5"
        />
      </div>

      <button onClick={saveLog} className="save-button">
        Save Log
      </button>
    </div>
  );
}