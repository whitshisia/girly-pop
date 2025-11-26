import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';

export default function CommentSection({ post, onClose }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!post) return;

    const q = query(
      collection(db, 'community', 'comments'),
      where('postId', '==', post.id),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setComments(commentsData);
    });

    return unsubscribe;
  }, [post]);

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const commentData = {
        postId: post.id,
        content: newComment.trim(),
        authorId: user.uid,
        authorName: user.name,
        isAnonymous: false, // Could make this configurable
        likes: [],
        likesCount: 0,
        parentId: replyingTo?.id || null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await addDoc(collection(db, 'community', 'comments'), commentData);

      // Update post comments count
      const postRef = doc(db, 'community', 'posts', post.id);
      await updateDoc(postRef, {
        commentsCount: (post.commentsCount || 0) + 1
      });

      setNewComment('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLikeComment = async (comment) => {
    if (!user) return;

    const commentRef = doc(db, 'community', 'comments', comment.id);
    const isLiked = comment.likes.includes(user.uid);

    try {
      if (isLiked) {
        await updateDoc(commentRef, {
          likes: arrayRemove(user.uid),
          likesCount: comment.likesCount - 1
        });
      } else {
        await updateDoc(commentRef, {
          likes: arrayUnion(user.uid),
          likesCount: comment.likesCount + 1
        });
      }
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  const handleDeleteComment = async (comment) => {
    if (!user || comment.authorId !== user.uid) return;
    if (!window.confirm('Delete this comment?')) return;

    try {
      await deleteDoc(doc(db, 'community', 'comments', comment.id));
      
      // Update post comments count
      const postRef = doc(db, 'community', 'posts', post.id);
      await updateDoc(postRef, {
        commentsCount: (post.commentsCount || 0) - 1
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const getReplies = (commentId) => {
    return comments.filter(comment => comment.parentId === commentId);
  };

  const topLevelComments = comments.filter(comment => !comment.parentId);

  return (
    <div className="comment-section">
      <div className="comment-header">
        <h3>Comments ({comments.length})</h3>
        <button onClick={onClose} className="close-btn">✕</button>
      </div>

      <div className="comments-list">
        {topLevelComments.map(comment => (
          <CommentItem
            key={comment.id}
            comment={comment}
            replies={getReplies(comment.id)}
            onLike={handleLikeComment}
            onReply={setReplyingTo}
            onDelete={handleDeleteComment}
            currentUser={user}
          />
        ))}
      </div>

      <form onSubmit={handleSubmitComment} className="comment-form">
        {replyingTo && (
          <div className="replying-to">
            Replying to {replyingTo.authorName}
            <button type="button" onClick={() => setReplyingTo(null)}>✕</button>
          </div>
        )}
        
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={replyingTo ? `Reply to ${replyingTo.authorName}...` : "Add a comment..."}
          rows="3"
          required
        />
        
        <div className="comment-actions">
          <button 
            type="submit" 
            disabled={isSubmitting || !newComment.trim()}
            className="submit-btn"
          >
            {isSubmitting ? 'Posting...' : 'Post Comment'}
          </button>
        </div>
      </form>
    </div>
  );
}

function CommentItem({ comment, replies, onLike, onReply, onDelete, currentUser }) {
  const [showReplies, setShowReplies] = useState(true);
  const isLiked = currentUser && comment.likes.includes(currentUser.uid);
  const isAuthor = currentUser && comment.authorId === currentUser.uid;

  return (
    <div className="comment-item">
      <div className="comment-header">
        <div className="comment-author">
          <span className="author-avatar">
            {comment.isAnonymous ? '👤' : '😊'}
          </span>
          <span className="author-name">
            {comment.isAnonymous ? 'Anonymous' : comment.authorName}
          </span>
          <span className="comment-time">
            {formatDistanceToNow(comment.createdAt?.toDate(), { addSuffix: true })}
          </span>
        </div>

        {isAuthor && (
          <button 
            onClick={() => onDelete(comment)}
            className="delete-comment-btn"
          >
            🗑️
          </button>
        )}
      </div>

      <div className="comment-content">
        <p>{comment.content}</p>
      </div>

      <div className="comment-actions">
        <button 
          onClick={() => onLike(comment)}
          className={`like-comment-btn ${isLiked ? 'liked' : ''}`}
          disabled={!currentUser}
        >
          ❤️ {comment.likesCount || 0}
        </button>

        <button 
          onClick={() => onReply(comment)}
          className="reply-btn"
          disabled={!currentUser}
        >
          Reply
        </button>
      </div>

      {replies.length > 0 && (
        <div className="comment-replies">
          <button 
            onClick={() => setShowReplies(!showReplies)}
            className="show-replies-btn"
          >
            {showReplies ? '▼' : '▶'} {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
          </button>

          {showReplies && (
            <div className="replies-list">
              {replies.map(reply => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  replies={[]}
                  onLike={onLike}
                  onReply={onReply}
                  onDelete={onDelete}
                  currentUser={currentUser}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}