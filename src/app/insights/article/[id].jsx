import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import articlesData from '../../../data/articles.json';

export default function ArticlePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [article, setArticle] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [relatedArticles, setRelatedArticles] = useState([]);

  useEffect(() => {
    const foundArticle = articlesData.articles.find(a => a.id === id);
    setArticle(foundArticle);

    // Find related articles
    if (foundArticle) {
      const related = articlesData.articles
        .filter(a => a.id !== id && a.category === foundArticle.category)
        .slice(0, 3);
      setRelatedArticles(related);
    }

    // Check if bookmarked
    if (user && user.bookmarkedArticles) {
      setIsBookmarked(user.bookmarkedArticles.includes(id));
    }
  }, [id, user]);

  const handleBookmark = async () => {
    if (!user || !article) return;

    const userRef = doc(db, 'users', user.uid);
    try {
      if (isBookmarked) {
        // Remove bookmark (you'd need a arrayRemove implementation)
        console.log('Remove bookmark functionality would go here');
      } else {
        await updateDoc(userRef, {
          bookmarkedArticles: arrayUnion(article.id)
        });
        setIsBookmarked(true);
      }
    } catch (error) {
      console.error('Error updating bookmarks:', error);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.excerpt,
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  if (!article) {
    return (
      <div className="article-page">
        <div className="article-not-found">
          <h1>Article Not Found</h1>
          <p>The article you're looking for doesn't exist.</p>
          <a href="/insights" className="back-to-insights">
            ← Back to Insights
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="article-page">
      <article className="article-content">
        <header className="article-header">
          <nav className="article-breadcrumb">
            <a href="/insights">Insights</a> / {article.category}
          </nav>
          
          <div className="article-meta">
            <span className="article-category">{article.category}</span>
            <span className="article-read-time">{article.readTime} min read</span>
          </div>

          <h1 className="article-title">{article.title}</h1>
          <p className="article-excerpt">{article.excerpt}</p>

          <div className="article-actions">
            <button 
              onClick={handleBookmark}
              className={`bookmark-btn ${isBookmarked ? 'bookmarked' : ''}`}
            >
              {isBookmarked ? '✅ Bookmarked' : '🔖 Bookmark'}
            </button>
            <button onClick={handleShare} className="share-btn">
              🔗 Share
            </button>
          </div>
        </header>

        <div className="article-body">
          {/* In a real app, this would be rich content from a CMS */}
          <div className="content-section">
            <h2>Understanding Your Cycle</h2>
            <p>
              Your menstrual cycle is a complex interplay of hormones that prepares your body for 
              potential pregnancy each month. Understanding the different phases can help you 
              recognize patterns and manage symptoms more effectively.
            </p>
          </div>

          <div className="content-section">
            <h2>The Four Phases</h2>
            <h3>1. Menstrual Phase (Days 1-5)</h3>
            <p>
              This phase begins on the first day of your period. The uterus sheds its lining, 
              resulting in menstrual bleeding that typically lasts 3-7 days.
            </p>

            <h3>2. Follicular Phase (Days 1-13)</h3>
            <p>
              Overlapping with the menstrual phase, this is when follicles in your ovaries mature 
              in preparation for ovulation.
            </p>

            <h3>3. Ovulation Phase (Day 14)</h3>
            <p>
              A mature egg is released from the ovary. This is your most fertile time, usually 
              occurring around day 14 of a 28-day cycle.
            </p>

            <h3>4. Luteal Phase (Days 15-28)</h3>
            <p>
              After ovulation, the empty follicle produces progesterone to prepare the uterine 
              lining for a potential pregnancy.
            </p>
          </div>

          <div className="content-section">
            <h2>Tracking Benefits</h2>
            <ul>
              <li>Predict your next period start date</li>
              <li>Identify your fertile window for family planning</li>
              <li>Recognize patterns in symptoms and mood changes</li>
              <li>Detect potential health issues early</li>
              <li>Better understand your body's natural rhythms</li>
            </ul>
          </div>

          <div className="content-section">
            <h2>When to Consult a Doctor</h2>
            <p>
              While some variation is normal, consult a healthcare provider if you experience:
            </p>
            <ul>
              <li>Cycles consistently shorter than 21 days or longer than 35 days</li>
              <li>Severe pain that interferes with daily activities</li>
              <li>Heavy bleeding that requires changing protection every 1-2 hours</li>
              <li>Sudden changes in your cycle pattern</li>
              <li>No period for 90 days or more</li>
            </ul>
          </div>
        </div>

        <footer className="article-footer">
          <div className="article-tags">
            <span className="tag">menstrual-cycle</span>
            <span className="tag">health-education</span>
            <span className="tag">womens-health</span>
          </div>
          
          <div className="article-engagement">
            <p>Was this article helpful?</p>
            <div className="feedback-buttons">
              <button className="feedback-btn">👍 Yes</button>
              <button className="feedback-btn">👎 No</button>
            </div>
          </div>
        </footer>
      </article>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <aside className="related-articles">
          <h3>Related Articles</h3>
          <div className="related-grid">
            {relatedArticles.map(relatedArticle => (
              <div key={relatedArticle.id} className="related-card">
                <a href={`/insights/article/${relatedArticle.id}`}>
                  <h4>{relatedArticle.title}</h4>
                  <p>{relatedArticle.excerpt}</p>
                  <div className="related-meta">
                    <span className="category">{relatedArticle.category}</span>
                    <span className="read-time">{relatedArticle.readTime} min</span>
                  </div>
                </a>
              </div>
            ))}
          </div>
        </aside>
      )}

      {/* Back to Insights */}
      <div className="back-navigation">
        <a href="/insights" className="back-link">
          ← Back to All Insights
        </a>
      </div>
    </div>
  );
}