import { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

const GOALS = [
  { id: 'tracking', label: 'Cycle Tracking', description: 'Track periods and symptoms', emoji: '📅' },
  { id: 'ttc', label: 'Trying to Conceive', description: 'Plan for pregnancy', emoji: '👶' },
  { id: 'pregnant', label: 'Currently Pregnant', description: 'Track pregnancy journey', emoji: '🤰' },
  { id: 'contraception', label: 'Birth Control', description: 'Monitor contraception effects', emoji: '💊' },
  { id: 'health', label: 'Health Awareness', description: 'Understand body patterns', emoji: '❤️' }
];

export default function Onboarding() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    age: '',
    cycleLength: '28',
    periodLength: '5',
    goal: '',
    lastPeriod: new Date().toISOString().split('T')[0],
    notifications: true
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    try {
      await setDoc(doc(db, 'users', user.uid), {
        ...formData,
        onboardingCompleted: true,
        createdAt: new Date()
      });

      // Redirect to dashboard
      window.location.href = '/';
    } catch (error) {
      console.error('Error saving onboarding data:', error);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1: return formData.age && formData.goal;
      case 2: return formData.cycleLength && formData.periodLength;
      case 3: return formData.lastPeriod;
      default: return true;
    }
  };

  return (
    <div className="onboarding">
      <div className="onboarding-progress">
        <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>1</div>
        <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>2</div>
        <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>3</div>
      </div>

      <form onSubmit={handleSubmit} className="onboarding-form">
        {step === 1 && (
          <div className="onboarding-step">
            <h2>Tell us about yourself</h2>
            
            <div className="form-group">
              <label>Your Age</label>
              <select 
                value={formData.age} 
                onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                required
              >
                <option value="">Select age range</option>
                <option value="under-18">Under 18</option>
                <option value="18-24">18-24</option>
                <option value="25-34">25-34</option>
                <option value="35-44">35-44</option>
                <option value="45-plus">45+</option>
              </select>
            </div>

            <div className="form-group">
              <label>What's your main goal?</label>
              <div className="goal-grid">
                {GOALS.map(goal => (
                  <button
                    key={goal.id}
                    type="button"
                    className={`goal-card ${formData.goal === goal.id ? 'selected' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, goal: goal.id }))}
                  >
                    <span className="goal-emoji">{goal.emoji}</span>
                    <span className="goal-label">{goal.label}</span>
                    <span className="goal-description">{goal.description}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="onboarding-step">
            <h2>Your Cycle Details</h2>
            
            <div className="form-group">
              <label>Average Cycle Length</label>
              <div className="cycle-input">
                <input
                  type="number"
                  min="21"
                  max="45"
                  value={formData.cycleLength}
                  onChange={(e) => setFormData(prev => ({ ...prev, cycleLength: e.target.value }))}
                  required
                />
                <span>days</span>
              </div>
              <small>Typically 21-35 days</small>
            </div>

            <div className="form-group">
              <label>Average Period Length</label>
              <div className="cycle-input">
                <input
                  type="number"
                  min="2"
                  max="10"
                  value={formData.periodLength}
                  onChange={(e) => setFormData(prev => ({ ...prev, periodLength: e.target.value }))}
                  required
                />
                <span>days</span>
              </div>
              <small>Typically 3-7 days</small>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="onboarding-step">
            <h2>Last Period</h2>
            
            <div className="form-group">
              <label>When did your last period start?</label>
              <input
                type="date"
                value={formData.lastPeriod}
                onChange={(e) => setFormData(prev => ({ ...prev, lastPeriod: e.target.value }))}
                max={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.notifications}
                  onChange={(e) => setFormData(prev => ({ ...prev, notifications: e.target.checked }))}
                />
                <span className="checkmark"></span>
                Enable reminders and notifications
              </label>
            </div>
          </div>
        )}

        <div className="onboarding-actions">
          {step > 1 && (
            <button 
              type="button" 
              onClick={() => setStep(step - 1)}
              className="btn-secondary"
            >
              Back
            </button>
          )}
          
          {step < 3 ? (
            <button 
              type="button" 
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="btn-primary"
            >
              Continue
            </button>
          ) : (
            <button 
              type="submit"
              disabled={!canProceed()}
              className="btn-primary"
            >
              Complete Setup
            </button>
          )}
        </div>
      </form>
    </div>
  );
}