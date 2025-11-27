import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useCyclePredictor } from '../../../hooks/useCyclePredictor';
import { useDailyLogs } from '../../../hooks/useDailyLogs';
import DayCard from '../../../components/DayCard';

export default function Calendar() {
  const { user } = useAuth();
  const { predictions } = useCyclePredictor();
  const { logs } = useDailyLogs();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Previous month days
    const prevMonth = new Date(currentDate);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    const daysInPrevMonth = getDaysInMonth(prevMonth);
    
    for (let i = firstDay - 1; i >= 0; i--) {
      const date = new Date(prevMonth);
      date.setDate(daysInPrevMonth - i);
      days.push({ date, isCurrentMonth: false });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentDate);
      date.setDate(i);
      days.push({ date, isCurrentMonth: true });
    }

    // Next month days
    const totalCells = 42; // 6 weeks
    const nextMonth = new Date(currentDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    for (let i = 1; days.length < totalCells; i++) {
      const date = new Date(nextMonth);
      date.setDate(i);
      days.push({ date, isCurrentMonth: false });
    }

    return days;
  };

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const calendarDays = generateCalendarDays();

  return (
    <div className="calendar-page">
      <div className="calendar-header">
        <div className="calendar-navigation">
          <button onClick={() => navigateMonth(-1)} className="nav-btn">‹</button>
          <h2>{currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2>
          <button onClick={() => navigateMonth(1)} className="nav-btn">›</button>
        </div>

        <div className="calendar-legend">
          <div className="legend-item">
            <span className="legend-color period"></span>
            <span>Period</span>
          </div>
          <div className="legend-item">
            <span className="legend-color fertile"></span>
            <span>Fertile</span>
          </div>
          <div className="legend-item">
            <span className="legend-color ovulation"></span>
            <span>Ovulation</span>
          </div>
          <div className="legend-item">
            <span className="legend-color predicted"></span>
            <span>Predicted</span>
          </div>
        </div>
      </div>

      <div className="calendar-grid">
        {/* Weekday headers */}
        {weekdays.map(day => (
          <div key={day} className="weekday-header">{day}</div>
        ))}

        {/* Calendar days */}
        {calendarDays.map((day, index) => (
          <DayCard
            key={index}
            date={day.date}
            logs={logs}
            isCurrentMonth={day.isCurrentMonth}
            predictions={predictions}
            onClick={setSelectedDate}
          />
        ))}
      </div>

      {/* Selected Date Summary */}
      <div className="selected-date-summary">
        <h3>{selectedDate.toLocaleDateString()}</h3>
        {logs[selectedDate.toISOString().split('T')[0]] ? (
          <div className="date-log">
            <p>Log exists - <a href={`/log/${selectedDate.toISOString().split('T')[0]}`}>View/Edit</a></p>
          </div>
        ) : (
          <div className="no-log">
            <p>No log for this date</p>
            <a href={`/log/${selectedDate.toISOString().split('T')[0]}`} className="add-log-btn">
              Add Log
            </a>
          </div>
        )}
      </div>
    </div>
  );
}