import { useCyclePredictor } from '../hooks/useCyclePredictor';

export default function PredictionWidget() {
  const { predictions, currentCycle } = useCyclePredictor();

  const getDaysUntil = (date) => {
    if (!date) return null;
    const diff = date.getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getFertilityStatus = () => {
    if (!predictions.fertileWindow) return 'unknown';
    
    const today = new Date();
    if (today >= predictions.fertileWindow.start && today <= predictions.fertileWindow.end) {
      return 'high';
    }
    return 'low';
  };

  const fertilityStatus = getFertilityStatus();

  return (
    <div className="prediction-widget">
      <h3>Your Cycle Overview</h3>
      
      <div className="prediction-cards">
        {predictions.nextPeriod && (
          <div className="prediction-card period">
            <div className="prediction-icon">🩸</div>
            <div className="prediction-info">
              <h4>Next Period</h4>
              <p>In {getDaysUntil(predictions.nextPeriod)} days</p>
              <small>{predictions.nextPeriod.toLocaleDateString()}</small>
            </div>
          </div>
        )}

        <div className={`prediction-card fertility ${fertilityStatus}`}>
          <div className="prediction-icon">🌱</div>
          <div className="prediction-info">
            <h4>Fertility</h4>
            <p>{fertilityStatus === 'high' ? 'High' : 'Low'} chance</p>
            <small>
              {fertilityStatus === 'high' ? 'Fertile window active' : 'Not in fertile window'}
            </small>
          </div>
        </div>

        {predictions.ovulation && (
          <div className="prediction-card ovulation">
            <div className="prediction-icon">🥚</div>
            <div className="prediction-info">
              <h4>Ovulation</h4>
              <p>In {getDaysUntil(predictions.ovulation)} days</p>
              <small>{predictions.ovulation.toLocaleDateString()}</small>
            </div>
          </div>
        )}
      </div>

      {currentCycle && (
        <div className="cycle-stats">
          <h4>Current Cycle</h4>
          <div className="stats-grid">
            <div className="stat">
              <span className="stat-value">{currentCycle.cycleLength}</span>
              <span className="stat-label">Days</span>
            </div>
            <div className="stat">
              <span className="stat-value">{currentCycle.periodLength}</span>
              <span className="stat-label">Period Days</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}