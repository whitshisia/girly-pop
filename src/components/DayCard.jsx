import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useCyclePredictor } from '../hooks/useCyclePredictor';

export default function DayCard({ date, logs = [], isCurrentMonth = true, onClick }) {
  const { user } = useAuth();
  const { predictions } = useCyclePredictor();
  const [isHovered, setIsHovered] = useState(false);

  const dateStr = date.toISOString().split('T')[0];
  const today = new Date().toDateString() === date.toDateString();
  const dayLog = logs[dateStr];

  const getDayType = () => {
    if (dayLog?.flow && dayLog.flow !== 'none') return 'period';
    
    if (predictions.fertileWindow && 
        date >= predictions.fertileWindow.start && 
        date <= predictions.fertileWindow.end) {
      return 'fertile';
    }
    
    if (predictions.ovulation && 
        date.toDateString() === predictions.ovulation.toDateString()) {
      return 'ovulation';
    }
    
    if (predictions.nextPeriod && 
        date.toDateString() === predictions.nextPeriod.toDateString()) {
      return 'predicted-period';
    }
    
    return 'normal';
  };

  const getSymptomsCount = () => {
    return dayLog?.symptoms?.length || 0;
  };

  const getFlowIcon = (flow) => {
    const flowIcons = {
      none: '',
      light: '💧',
      medium: '💦',
      heavy: '🩸'
    };
    return flowIcons[flow] || '';
  };

  const dayType = getDayType();
  const symptomsCount = getSymptomsCount();
  const hasNotes = dayLog?.notes;
  const hasSex = dayLog?.sexualActivity;

  return (
    <div
      className={`day-card ${dayType} ${today ? 'today' : ''} ${!isCurrentMonth ? 'other-month' : ''}`}
      onClick={() => onClick(date)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="day-header">
        <span className="day-number">{date.getDate()}</span>
        {today && <span className="today-indicator">Today</span>}
      </div>

      <div className="day-content">
        {dayLog && (
          <div className="day-log-summary">
            {dayLog.flow && dayLog.flow !== 'none' && (
              <span className="flow-indicator">
                {getFlowIcon(dayLog.flow)}
              </span>
            )}
            
            {symptomsCount > 0 && (
              <span className="symptoms-indicator">
                🤒{symptomsCount > 1 ? symptomsCount : ''}
              </span>
            )}
            
            {hasSex && <span className="sex-indicator">❤️</span>}
            {hasNotes && <span className="notes-indicator">📝</span>}
          </div>
        )}

        {isHovered && (
          <div className="day-tooltip">
            <strong>{date.toLocaleDateString()}</strong>
            {dayLog && (
              <>
                {dayLog.flow && <div>Flow: {dayLog.flow}</div>}
                {symptomsCount > 0 && <div>Symptoms: {symptomsCount}</div>}
                {dayLog.mood && <div>Mood: {dayLog.mood}</div>}
              </>
            )}
            <div>Click to {dayLog ? 'edit' : 'add'} log</div>
          </div>
        )}
      </div>

      <div className="day-footer">
        {dayType !== 'normal' && (
          <div className={`day-type-indicator ${dayType}`}>
            {dayType === 'period' && 'Period'}
            {dayType === 'fertile' && 'Fertile'}
            {dayType === 'ovulation' && 'Ovulation'}
            {dayType === 'predicted-period' && 'Predicted'}
          </div>
        )}
      </div>
    </div>
  );
}