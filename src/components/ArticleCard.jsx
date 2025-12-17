import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Link } from 'react-router-dom';

export default function ArticleCard({ article, variant = 'default', featured = false }) {
  const { user } = useAuth();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Initialize bookmark and like status from user data
  useState(() => {
    if (user) {
      if (user.bookmarkedArticles?.includes(article.id)) {
        setIsBookmarked(true);
      }
      if (user.likedArticles?.includes(article.id)) {
        setIsLiked(true);
      }
    }
  }, [user, article.id]);

  const handleBookmark = async () => {
    if (!user || isProcessing) return;

    setIsProcessing(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      
      if (isBookmarked) {
        // Remove bookmark
        await updateDoc(userRef, {
          bookmarkedArticles: arrayRemove(article.id)
        });
        setIsBookmarked(false);
      } else {
        // Add bookmark
        await updateDoc(userRef, {
          bookmarkedArticles: arrayUnion(article.id)
        });
        setIsBookmarked(true);
      }
    } catch (error) {
      console.error('Error updating bookmark:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLike = async () => {
    if (!user || isProcessing) return;

    setIsProcessing(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      const articleRef = doc(db, 'articles', article.id);
      
      if (isLiked) {
        // Unlike
        await updateDoc(userRef, {
          likedArticles: arrayRemove(article.id)
        });
        await updateDoc(articleRef, {
          likes: arrayRemove(user.uid)
        });
        setIsLiked(false);
      } else {
        // Like
        await updateDoc(userRef, {
          likedArticles: arrayUnion(article.id)
        });
        await updateDoc(articleRef, {
          likes: arrayUnion(user.uid)
        });
        setIsLiked(true);
      }
    } catch (error) {
      console.error('Error updating like:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.excerpt,
        url: `/insights/article/${article.id}`,
      }).catch(console.error);
    } else {
      setShowShareMenu(!showShareMenu);
    }
  };

  const copyLink = () => {
    const link = `${window.location.origin}/insights/article/${article.id}`;
    navigator.clipboard.writeText(link).then(() => {
      alert('Link copied to clipboard!');
      setShowShareMenu(false);
    });
  };

  const shareOnPlatform = (platform) => {
    const link = `${window.location.origin}/insights/article/${article.id}`;
    const text = encodeURIComponent(`${article.title} - ${article.excerpt}`);
    
    let url = '';
    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(link)}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`;
        break;
      case 'whatsapp':
        url = `https://wa.me/?text=${text}%20${encodeURIComponent(link)}`;
        break;
      case 'telegram':
        url = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${text}`;
        break;
    }
    
    window.open(url, '_blank', 'noopener,noreferrer');
    setShowShareMenu(false);
  };

  const formatReadTime = (minutes) => {
    if (minutes < 1) return 'Quick read';
    return `${minutes} min read`;
  };

  const getCategoryColor = (category) => {
    const colors = {
      'education': 'bg-blue-100 text-blue-800',
      'fertility': 'bg-green-100 text-green-800',
      'pregnancy': 'bg-purple-100 text-purple-800',
      'symptoms': 'bg-red-100 text-red-800',
      'mental-health': 'bg-yellow-100 text-yellow-800',
      'nutrition': 'bg-indigo-100 text-indigo-800',
      'exercise': 'bg-pink-100 text-pink-800',
      'relationships': 'bg-teal-100 text-teal-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  // Different variants for different display needs
  if (variant === 'compact') {
    return (
      <div className="article-card-compact">
        <Link to={`/insights/article/${article.id}`} className="article-link">
          <div className="compact-content">
            <span className={`category-badge ${getCategoryColor(article.category)}`}>
              {article.category}
            </span>
            <h4 className="article-title">{article.title}</h4>
            <div className="article-meta">
              <span className="read-time">{formatReadTime(article.readTime)}</span>
              {article.isNew && <span className="new-badge">New</span>}
            </div>
          </div>
        </Link>
      </div>
    );
  }

  if (variant === 'featured' || featured) {
    return (
      <div className="article-card-featured">
        <div className="featured-image">
          {article.image ? (
            <img src={article.image} alt={article.title} />
          ) : (
            <div className="image-placeholder">
              <span className="placeholder-emoji">{article.emoji || '📚'}</span>
            </div>
          )}
          {article.isNew && <div className="new-badge">New</div>}
        </div>

        <div className="featured-content">
          <div className="article-header">
            <span className={`category-tag ${getCategoryColor(article.category)}`}>
              {article.category}
            </span>
            <span className="read-time">{formatReadTime(article.readTime)}</span>
          </div>

          <Link to={`/insights/article/${article.id}`}>
            <h3 className="article-title">{article.title}</h3>
          </Link>

          <p className="article-excerpt">{article.excerpt}</p>

          <div className="article-actions">
            <button 
              onClick={handleBookmark}
              disabled={isProcessing || !user}
              className={`action-btn ${isBookmarked ? 'bookmarked' : ''}`}
              title={isBookmarked ? 'Remove bookmark' : 'Bookmark article'}
            >
              {isBookmarked ? '🔖' : '📑'}
            </button>

            <button 
              onClick={handleLike}
              disabled={isProcessing || !user}
              className={`action-btn ${isLiked ? 'liked' : ''}`}
              title={isLiked ? 'Unlike article' : 'Like article'}
            >
              {isLiked ? '❤️' : '🤍'}
            </button>

            <div className="share-container">
              <button 
                onClick={handleShare}
                className="action-btn"
                title="Share article"
              >
                🔗
              </button>
              
              {showShareMenu && (
                <div className="share-menu">
                  <button onClick={copyLink} className="share-option">
                    📋 Copy Link
                  </button>
                  <button onClick={() => shareOnPlatform('twitter')} className="share-option">
                    𝕏 Twitter
                  </button>
                  <button onClick={() => shareOnPlatform('facebook')} className="share-option">
                    📘 Facebook
                  </button>
                  <button onClick={() => shareOnPlatform('whatsapp')} className="share-option">
                    💬 WhatsApp
                  </button>
                  <button onClick={() => shareOnPlatform('telegram')} className="share-option">
                    📱 Telegram
                  </button>
                </div>
              )}
            </div>

            <Link 
              to={`/insights/article/${article.id}`}
              className="read-more-btn"
            >
              Read More →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className="article-card">
      <div className="article-image">
        {article.image ? (
          <img src={article.image} alt={article.title} />
        ) : (
          <div className="image-placeholder">
            <span className="placeholder-emoji">{article.emoji || '📚'}</span>
          </div>
        )}
        {article.isNew && <div className="new-badge">New</div>}
      </div>

      <div className="article-content">
        <div className="article-header">
          <span className={`category-badge ${getCategoryColor(article.category)}`}>
            {article.category}
          </span>
          <span className="read-time">{formatReadTime(article.readTime)}</span>
        </div>

        <Link to={`/insights/article/${article.id}`}>
          <h3 className="article-title">{article.title}</h3>
        </Link>

        <p className="article-excerpt">{article.excerpt}</p>

        <div className="article-footer">
          <div className="article-actions">
            <button 
              onClick={handleBookmark}
              disabled={isProcessing || !user}
              className={`action-btn ${isBookmarked ? 'bookmarked' : ''}`}
              title={isBookmarked ? 'Remove bookmark' : 'Bookmark article'}
            >
              {isBookmarked ? '🔖' : '📑'}
            </button>

            <button 
              onClick={handleLike}
              disabled={isProcessing || !user}
              className={`action-btn ${isLiked ? 'liked' : ''}`}
              title={isLiked ? 'Unlike article' : 'Like article'}
            >
              {isLiked ? '❤️' : '🤍'}
            </button>

            <div className="share-container">
              <button 
                onClick={handleShare}
                className="action-btn"
                title="Share article"
              >
                🔗
              </button>
              
              {showShareMenu && (
                <div className="share-menu">
                  <button onClick={copyLink} className="share-option">
                    📋 Copy Link
                  </button>
                  <button onClick={() => shareOnPlatform('twitter')} className="share-option">
                    𝕏 Twitter
                  </button>
                  <button onClick={() => shareOnPlatform('facebook')} className="share-option">
                    📘 Facebook
                  </button>
                </div>
              )}
            </div>
          </div>

          <Link 
            to={`/insights/article/${article.id}`}
            className="read-more-link"
          >
            Read More →
          </Link>
        </div>
      </div>
    </div>
  );
}