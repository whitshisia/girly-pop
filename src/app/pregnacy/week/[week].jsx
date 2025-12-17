import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import pregnancyWeeks from '../../../data/pregnancy-weeks.json';

export default function PregnancyWeek() {
  const { week } = useParams();
  const [weekData, setWeekData] = useState(null);
  const [savedNotes, setSavedNotes] = useState('');

  useEffect(() => {
    const weekInfo = pregnancyWeeks.weeks.find(w => w.week === parseInt(week));
    setWeekData(weekInfo);

    // Load saved notes from localStorage
    const notes = localStorage.getItem(`pregnancy-week-${week}-notes`);
    if (notes) setSavedNotes(notes);
  }, [week]);

  const saveNotes = (notes) => {
    setSavedNotes(notes);
    localStorage.setItem(`pregnancy-week-${week}-notes`, notes);
  };

  if (!weekData) {
    return (
      <div className="pregnancy-week">
        <div className="loading">Loading week {week} information...</div>
      </div>
    );
  }

  return (
    <div className="pregnancy-week">
      <div className="week-header">
        <h1>Week {weekData.week}: {weekData.title}</h1>
        <div className="week-navigation">
          {weekData.week > 1 && (
            <a href={`/pregnancy/week/${parseInt(week) - 1}`} className="nav-btn">
              ← Previous Week
            </a>
          )}
          {weekData.week < 40 && (
            <a href={`/pregnancy/week/${parseInt(week) + 1}`} className="nav-btn">
              Next Week →
            </a>
          )}
        </div>
      </div>

      <div className="week-content">
        {/* Baby Development */}
        <section className="week-section">
          <h2>👶 Baby Development</h2>
          <div className="development-card">
            <p>{weekData.description}</p>
            <div className="development-details">
              <div className="detail">
                <span className="detail-label">Size:</span>
                <span className="detail-value">{weekData.babySize}</span>
              </div>
              {/* Additional development details would go here */}
            </div>
          </div>
        </section>

        {/* Your Body */}
        <section className="week-section">
          <h2>💁‍♀️ Your Body & Symptoms</h2>
          <div className="symptoms-card">
            <h4>Common Symptoms This Week:</h4>
            <ul className="symptoms-list">
              {weekData.symptoms.map((symptom, index) => (
                <li key={index}>{symptom}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* Tips & Advice */}
        <section className="week-section">
          <h2>💡 Tips & Advice</h2>
          <div className="tips-card">
            <ul className="tips-list">
              {weekData.tips.map((tip, index) => (
                <li key={index}>{tip}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* Personal Notes */}
        <section className="week-section">
          <h2>📝 Your Notes</h2>
          <div className="notes-card">
            <textarea
              value={savedNotes}
              onChange={(e) => saveNotes(e.target.value)}
              placeholder="Record your thoughts, symptoms, questions for your doctor, or anything else about this week..."
              rows="6"
            />
            <div className="notes-actions">
              <button onClick={() => saveNotes('')} className="btn-secondary">
                Clear
              </button>
              <span className="notes-saved">
                {savedNotes ? '✓ Saved' : 'Not saved'}
              </span>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="week-section">
          <h2>🎯 This Week's Actions</h2>
          <div className="actions-grid">
            <button className="action-btn">
              <span className="action-emoji">📅</span>
              <span>Schedule Appointment</span>
            </button>
            <button className="action-btn">
              <span className="action-emoji">🥗</span>
              <span>Nutrition Tips</span>
            </button>
            <button className="action-btn">
              <span className="action-emoji">🏃‍♀️</span>
              <span>Exercise Ideas</span>
            </button>
            <button className="action-btn">
              <span className="action-emoji">🛒</span>
              <span>Shopping List</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}