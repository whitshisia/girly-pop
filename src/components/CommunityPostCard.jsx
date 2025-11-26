import { useState } from 'react';
import { doc, updateDoc, arrayUnion, arrayRemove, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';

export default function CommunityPostCard({ post, onPostUpdate, onCommentClick }) {
  const { user } = useAuth();
  const [isLiking, setIsLiking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);

  const isLiked = user && post.likes.includes(user.uid);
  const isAuthor = user && post.authorId === user.uid;

  const handleLike = async () => {
    if (!user) return;
    
    setIsLiking(true);
    const postRef = doc(db, 'community', 'posts', post.id);
    
    try {
      if (isLiked) {
        await updateDoc(postRef, {
          likes: arrayRemove(user.uid),
          likesCount: post.likesCount - 1
        });
      } else {
        await updateDoc(postRef, {
          likes: arrayUnion(user.uid),
          likesCount: post.likesCount + 1
        });
      }
      onPostUpdate?.();
    } catch (error) {
      console.error('Error liking post:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleDelete = async () => {
    if (!isAuthor || !window.confirm('Are you sure you want to delete this post?')) return;
    
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'community', 'posts', post.id));
      onPostUpdate?.();
    } catch (error) {
      console.error('Error deleting post:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const displayAuthor = post.isAnonymous ? 'Anonymous User' : post.authorName;
  const contentPreview = post.content.length > 200 && !showFullContent 
    ? post.content.substring(0, 200) + '...'
    : post.content;

  return (
    <div className="community-post-card">
      <div className="post-header">
        <div className="post-author">
          <div className="author-avatar">
            {post.isAnonymous ? '👤' : '😊'}
          </div>
          <div className="author-info">
            <span className="author-name">{displayAuthor}</span>
            <span className="post-time">
              {formatDistanceToNow(post.createdAt?.toDate(), { addSuffix: true })}
            </span>
          </div>
        </div>

        {isAuthor && (
          <div className="post-actions">
            <button 
              onClick={handleDelete}
              disabled={isDeleting}
              className="delete-btn"
            >
              {isDeleting ? '🗑️⏳' : '🗑️'}
            </button>
          </div>
        )}
      </div>

      <div className="post-category">
        <span className={`category-tag ${post.category}`}>
          {post.category}
        </span>
      </div>

      <div className="post-content">
        <h3 className="post-title">{post.title}</h3>
        <p className="post-text">
          {contentPreview}
          {post.content.length > 200 && (
            <button 
              onClick={() => setShowFullContent(!showFullContent)}
              className="show-more-btn"
            >
              {showFullContent ? 'Show less' : 'Show more'}
            </button>
          )}
        </p>
      </div>

      {post.tags && post.tags.length > 0 && (
        <div className="post-tags">
          {post.tags.map(tag => (
            <span key={tag} className="post-tag">#{tag}</span>
          ))}
        </div>
      )}

      <div className="post-stats">
        <button 
          onClick={handleLike}
          disabled={isLiking || !user}
          className={`like-btn ${isLiked ? 'liked' : ''}`}
        >
          ❤️ {post.likesCount}
        </button>

        <button 
          onClick={() => onCommentClick(post)}
          className="comment-btn"
        >
          💬 {post.commentsCount || 0}
        </button>

        <button className="share-btn">
          🔗 Share
        </button>
      </div>
    </div>
  );
}