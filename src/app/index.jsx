import { useAuth } from '../hooks/useAuth';
import { useCyclePredictor } from '../hooks/useCyclePredictor';
import PredictionWidget from '../components/PredictionWidget';
import SymptomsGrid from '../components/SymptomsGrid';

export default function Home() {
  const { user } = useAuth();
  const { predictions, currentCycle } = useCyclePredictor();

  if (!user) {
    return <div>Please log in</div>;
  }

  return (
    <div className="dashboard">
      <h1>Welcome back, {user.name}</h1>
      
      <div className="dashboard-grid">
        <PredictionWidget predictions={predictions} />
        
        <div className="quick-actions">
          <button onClick={() => window.location.href = `/log/${new Date().toISOString().split('T')[0]}`}>
            Log Today's Symptoms
          </button>
        </div>

        <SymptomsGrid compact={true} />
        
        {user.goal === 'pregnant' && user.pregnancyData && (
          <PregnancyOverview data={user.pregnancyData} />
        )}
      </div>
    </div>
  );
}