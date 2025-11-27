import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useCyclePredictor } from '../../../hooks/useCyclePredictor';
import { useDailyLogs } from '../../../hooks/useDailyLogs';
import ArticleCard from '../../../components/ArticleCard';
import articlesData from '../../../data/articles.json';

export default function Insights() {
  const { user } = useAuth();
  const { currentCycle, predictions } = useCyclePredictor();
  const { logs } = useDailyLogs();
  const [personalizedArticles, setPersonalizedArticles] = useState([]);
  const [insights, setInsights] = useState([]);

  useEffect(() => {
    generatePersonalizedInsights();
  }, [user, currentCycle, logs]);

  const generatePersonalizedInsights = () => {
    const newInsights = [];
    const newArticles = [...articlesData.articles];

    // Cycle regularity insight
    if (currentCycle) {
      if (currentCycle.cycleLength < 25) {
        newInsights.push({
          type: 'short-cycle',
          title: 'Short Cycle',
          message: 'Your cycle is shorter than average. This is normal for some people.',
          action: 'Learn about short cycles',
          emoji: '⏱️'
        });
        newArticles.unshift({
          id: 'short-cycles',
          title: 'Understanding Short Menstrual Cycles',
          excerpt: 'What short cycles mean for your health',
          category: 'education',
          readTime: 4,
          emoji: '⏱️',
          isNew: true
        });
      }
    }

    // Symptom patterns
    const recentSymptoms = Object.values(logs)
      .slice(-7)
      .flatMap(log => log.symptoms || []);
    
    const symptomCount = recentSymptoms.reduce((acc, symptom) => {
      acc[symptom] = (acc[symptom] || 0) + 1;
      return acc;
    }, {});

    const frequentSymptoms = Object.entries(symptomCount)
      .filter(([_, count]) => count >= 3)
      .map(([symptom]) => symptom);

    if (frequentSymptoms.length > 0) {
      newInsights.push({
        type: 'symptom-pattern',
        title: 'Frequent Symptoms',
        message: `You've been experiencing ${frequentSymptoms.join(', ')} regularly.`,
        action: 'Manage symptoms',
        emoji: '📊'
      });
    }

    // Fertility window insight
    if (predictions.fertileWindow) {
      const today = new Date();
      if (today >= predictions.fertileWindow.start && today <= predictions.fertileWindow.end) {
        newInsights.push({
          type: 'fertile-window',
          title: 'High Fertility',
          message: 'You are in your fertile window. This is the best time for conception.',
          action: 'Track fertility signs',
          emoji: '🌱'
        });
      }
    }

    setInsights(newInsights);
    setPersonalizedArticles(newArticles);
  };

  const getHealthScore = () => {
    // Simple health score based on tracking consistency and symptom patterns
    let score = 75; // Base score
    
    // Bonus for regular tracking
    const loggedDays = Object.keys(logs).length;
    if (loggedDays > 7) score += 10;
    if (loggedDays > 30) score += 15;
    
    // Adjust based on symptom frequency
    const symptomDays = Object.values(logs).filter(log => log.symptoms && log.symptoms.length > 0).length;
    const symptomRatio = symptomDays / Math.max(1, loggedDays);
    if (symptomRatio > 0.7) score -= 10;
    
    return Math.min(100, Math.max(0, score));
  };

  return (
    <div className="insights-page">
      <div className="insights-header">
        <h1>Health Insights</h1>
        <p>Personalized analysis and educational content for your cycle journey</p>
      </div>

      {/* Health Overview */}
      <div className="health-overview">
        <div className="health-score">
          <h3>Health Score</h3>
          <div className="score-circle">
            <span className="score-value">{getHealthScore()}</span>
            <span className="score-label">/100</span>
          </div>
          <p>Based on your tracking consistency and patterns</p>
        </div>

        <div className="health-stats">
          <div className="health-stat">
            <span className="stat-value">{Object.keys(logs).length}</span>
            <span className="stat-label">Days Tracked</span>
          </div>
          <div className="health-stat">
            <span className="stat-value">
              {Object.values(logs).filter(log => log.symptoms && log.symptoms.length > 0).length}
            </span>
            <span className="stat-label">Symptom Days</span>
          </div>
          <div className="health-stat">
            <span className="stat-value">{currentCycle ? currentCycle.cycleLength : '--'}</span>
            <span className="stat-label">Cycle Length</span>
          </div>
        </div>
      </div>

      {/* Personalized Insights */}
      <div className="personalized-insights">
        <h2>Your Insights</h2>
        {insights.length > 0 ? (
          <div className="insights-grid">
            {insights.map((insight, index) => (
              <div key={index} className={`insight-card ${insight.type}`}>
                <div className="insight-header">
                  <span className="insight-emoji">{insight.emoji}</span>
                  <h4>{insight.title}</h4>
                </div>
                <p>{insight.message}</p>
                <button className="insight-action">{insight.action}</button>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-insights">
            <div className="no-insights-icon">🔍</div>
            <h3>No Insights Yet</h3>
            <p>Continue tracking your cycle to receive personalized insights</p>
            <a href="/calendar" className="track-more-btn">
              Start Tracking
            </a>
          </div>
        )}
      </div>

      {/* Educational Articles */}
      <div className="educational-content">
        <h2>Learn More</h2>
        <div className="articles-grid">
          {personalizedArticles.map(article => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      </div>

      {/* Cycle Patterns */}
      <div className="cycle-patterns">
        <h2>Cycle Patterns</h2>
        <div className="patterns-overview">
          <div className="pattern-card">
            <h4>📅 Cycle Regularity</h4>
            <p>
              {currentCycle ? 
                `Your current cycle is ${currentCycle.cycleLength} days long` : 
                'Track more cycles to see patterns'
              }
            </p>
          </div>
          <div className="pattern-card">
            <h4>🤒 Symptom Frequency</h4>
            <p>
              {Object.values(logs).filter(log => log.symptoms && log.symptoms.length > 0).length} 
              out of {Object.keys(logs).length} days with symptoms
            </p>
          </div>
          <div className="pattern-card">
            <h4>📊 Prediction Accuracy</h4>
            <p>Based on {Object.keys(logs).length} days of tracking</p>
          </div>
        </div>
      </div>

      {/* Action Plan */}
      <div className="action-plan">
        <h2>Recommended Actions</h2>
        <div className="actions-list">
          <div className="action-item">
            <span className="action-emoji">📝</span>
            <div>
              <h4>Continue Daily Tracking</h4>
              <p>Keep logging symptoms and cycle data for better insights</p>
            </div>
          </div>
          <div className="action-item">
            <span className="action-emoji">📚</span>
            <div>
              <h4>Learn About Your Symptoms</h4>
              <p>Read articles related to your frequently logged symptoms</p>
            </div>
          </div>
          <div className="action-item">
            <span className="action-emoji">👥</span>
            <div>
              <h4>Join Community Discussions</h4>
              <p>Connect with others experiencing similar cycle patterns</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}