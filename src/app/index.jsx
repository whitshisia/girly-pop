import { useAuth } from '../hooks/useAuth';
import { useCyclePredictor } from '../hooks/useCyclePredictor';
import { useDailyLogs } from '../hooks/useDailyLogs';
import PredictionWidget from '../components/PredictionWidget';
import SymptomsGrid from '../components/SymptomsGrid';
import DayCard from '../components/DayCard';
import ArticleCard from '../components/ArticleCard';

export default function Home() {
  const { user } = useAuth();
  const { predictions, currentCycle } = useCyclePredictor();
  const { todayLog, recentLogs } = useDailyLogs();

  if (!user) {
    return (
      <div className="auth-prompt">
        <div className="welcome-hero">
          <h1>Welcome to CycleTracker</h1>
          <p>Track your cycle, understand your body, and take control of your health</p>
          <div className="auth-buttons">
            <a href="/auth/login" className="btn-primary">Login</a>
            <a href="/auth/register" className="btn-secondary">Sign Up</a>
            <a href="/auth/anonymous" className="btn-outline">Try Anonymous Mode</a>
          </div>
        </div>
      </div>
    );
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>{getGreeting()}, {user.name}!</h1>
        <div className="quick-stats">
          {user.goal && <span className="goal-badge">{user.goal}</span>}
          {user.pregnancyDueDate && (
            <span className="pregnancy-badge">
              Week {Math.floor((new Date() - new Date(user.pregnancyStartDate)) / (7 * 24 * 60 * 60 * 1000))}
            </span>
          )}
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Predictions Section */}
        <section className="dashboard-section">
          <h2>Cycle Overview</h2>
          <PredictionWidget />
        </section>

        {/* Quick Log Section */}
        <section className="dashboard-section">
          <h2>Today's Log</h2>
          <div className="today-log-card">
            {todayLog ? (
              <div className="log-summary">
                <div className="log-stats">
                  {todayLog.flow && <span className="flow-indicator">{todayLog.flow}</span>}
                  {todayLog.symptoms?.length > 0 && (
                    <span className="symptoms-count">{todayLog.symptoms.length} symptoms</span>
                  )}
                  {todayLog.mood && <span className="mood-indicator">{todayLog.mood}</span>}
                </div>
                <a href={`/log/${new Date().toISOString().split('T')[0]}`} className="edit-log-btn">
                  Edit Log
                </a>
              </div>
            ) : (
              <div className="no-log-today">
                <p>No log for today yet</p>
                <a href={`/log/${new Date().toISOString().split('T')[0]}`} className="log-today-btn">
                  Log Today
                </a>
              </div>
            )}
          </div>
        </section>

        {/* Mini Calendar */}
        <section className="dashboard-section">
          <h2>This Week</h2>
          <div className="mini-calendar">
            {Array.from({ length: 7 }, (_, i) => {
              const date = new Date();
              date.setDate(date.getDate() - 3 + i);
              return (
                <DayCard
                  key={date.toISOString()}
                  date={date}
                  logs={recentLogs}
                  compact={true}
                />
              );
            })}
          </div>
        </section>

        {/* Symptoms Quick Add */}
        <section className="dashboard-section">
          <h2>Quick Symptoms</h2>
          <SymptomsGrid compact={true} />
        </section>

        {/* Health Insights */}
        <section className="dashboard-section">
          <h2>Health Insights</h2>
          <div className="articles-carousel">
            {articlesData.slice(0, 3).map(article => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
          <a href="/insights" className="see-all-articles">View All Articles →</a>
        </section>

        {/* Community Preview */}
        <section className="dashboard-section">
          <h2>Community Support</h2>
          <div className="community-preview">
            <p>Connect with others going through similar experiences</p>
            <a href="/community" className="community-cta">
              Join Community Discussions
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}