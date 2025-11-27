import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import pregnancyWeeks from '../../../data/pregnancy-weeks.json';

export default function PregnancyDashboard() {
  const { user } = useAuth();
  const [pregnancyData, setPregnancyData] = useState(null);
  const [currentWeek, setCurrentWeek] = useState(1);

  useEffect(() => {
    if (!user) return;

    const loadPregnancyData = async () => {
      const pregnancyRef = doc(db, 'pregnancy', user.uid);
      const pregnancySnap = await getDoc(pregnancyRef);
      
      if (pregnancySnap.exists()) {
        const data = pregnancySnap.data();
        setPregnancyData(data);
        
        // Calculate current week
        const startDate = data.startDate.toDate();
        const today = new Date();
        const weeks = Math.floor((today - startDate) / (7 * 24 * 60 * 60 * 1000));
        setCurrentWeek(Math.max(1, Math.min(40, weeks)));
      }
    };

    loadPregnancyData();
  }, [user]);

  const startPregnancy = async () => {
    if (!user) return;

    const pregnancyRef = doc(db, 'pregnancy', user.uid);
    await updateDoc(pregnancyRef, {
      startDate: new Date(),
      dueDate: new Date(Date.now() + 280 * 24 * 60 * 60 * 1000), // 40 weeks from now
      createdAt: new Date()
    }, { merge: true });

    // Also update user profile
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      goal: 'pregnant',
      pregnancyStartDate: new Date()
    });

    window.location.reload();
  };

  const currentWeekData = pregnancyWeeks.weeks.find(w => w.week === currentWeek);

  if (!pregnancyData) {
    return (
      <div className="pregnancy-setup">
        <div className="setup-content">
          <div className="setup-icon">🤰</div>
          <h1>Pregnancy Tracking</h1>
          <p>Start tracking your pregnancy journey with weekly updates and personalized guidance</p>
          
          <div className="pregnancy-features">
            <div className="feature">
              <span className="feature-emoji">📅</span>
              <div>
                <h4>Weekly Updates</h4>
                <p>Track baby's development week by week</p>
              </div>
            </div>
            <div className="feature">
              <span className="feature-emoji">📝</span>
              <div>
                <h4>Symptom Tracking</h4>
                <p>Monitor pregnancy symptoms and changes</p>
              </div>
            </div>
            <div className="feature">
              <span className="feature-emoji">🎯</span>
              <div>
                <h4>Appointment Planner</h4>
                <p>Schedule and track medical appointments</p>
              </div>
            </div>
          </div>

          <button onClick={startPregnancy} className="start-pregnancy-btn">
            Start Pregnancy Tracking
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pregnancy-dashboard">
      <div className="pregnancy-header">
        <h1>Pregnancy Journey</h1>
        <div className="pregnancy-overview">
          <div className="overview-card">
            <span className="overview-label">Current Week</span>
            <span className="overview-value">Week {currentWeek}</span>
          </div>
          <div className="overview-card">
            <span className="overview-label">Due Date</span>
            <span className="overview-value">
              {pregnancyData.dueDate?.toDate().toLocaleDateString()}
            </span>
          </div>
          <div className="overview-card">
            <span className="overview-label">Days to Go</span>
            <span className="overview-value">
              {Math.ceil((pregnancyData.dueDate?.toDate() - new Date()) / (24 * 60 * 60 * 1000))}
            </span>
          </div>
        </div>
      </div>

      {/* Current Week */}
      {currentWeekData && (
        <div className="current-week">
          <h2>Week {currentWeek}: {currentWeekData.title}</h2>
          <div className="week-content">
            <div className="baby-development">
              <h3>👶 Baby Development</h3>
              <p>{currentWeekData.description}</p>
              <div className="baby-size">
                <span className="size-label">Baby size:</span>
                <span className="size-value">{currentWeekData.babySize}</span>
              </div>
            </div>

            <div className="symptoms-tips">
              <div className="symptoms">
                <h3>🤒 Common Symptoms</h3>
                <ul>
                  {currentWeekData.symptoms.map((symptom, index) => (
                    <li key={index}>{symptom}</li>
                  ))}
                </ul>
              </div>

              <div className="tips">
                <h3>💡 This Week's Tips</h3>
                <ul>
                  {currentWeekData.tips.map((tip, index) => (
                    <li key={index}>{tip}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="pregnancy-actions">
        <h3>Quick Actions</h3>
        <div className="actions-grid">
          <a href={`/pregnancy/week/${currentWeek}`} className="action-card">
            <span className="action-emoji">📖</span>
            <span className="action-label">Week Details</span>
          </a>
          <a href="/symptoms" className="action-card">
            <span className="action-emoji">📝</span>
            <span className="action-label">Log Symptoms</span>
          </a>
          <button className="action-card">
            <span className="action-emoji">📅</span>
            <span className="action-label">Appointments</span>
          </button>
          <button className="action-card">
            <span className="action-emoji">🥗</span>
            <span className="action-label">Nutrition</span>
          </button>
        </div>
      </div>

      {/* Pregnancy Progress */}
      <div className="pregnancy-progress">
        <h3>Pregnancy Progress</h3>
        <div className="progress-tracker">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${(currentWeek / 40) * 100}%` }}
            ></div>
          </div>
          <div className="progress-labels">
            <span>1st Trimester</span>
            <span>2nd Trimester</span>
            <span>3rd Trimester</span>
          </div>
        </div>
      </div>

      {/* Recent Symptoms */}
      <div className="recent-symptoms">
        <h3>Recent Symptoms</h3>
        {/* Would integrate with daily logs to show pregnancy-related symptoms */}
        <div className="symptoms-log">
          <p>Track your pregnancy symptoms in the daily log</p>
          <a href="/symptoms" className="log-symptoms-btn">
            Log Symptoms
          </a>
        </div>
      </div>
    </div>
  );
}