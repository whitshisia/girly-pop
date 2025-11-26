import { useState } from 'react';
import { collection, addDoc, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';

const CATEGORIES = [
  { id: 'general', name: 'General Discussion', icon: '💬' },
  { id: 'advice', name: 'Advice Needed', icon: '🤔' },
  { id: 'support', name: 'Support', icon: '🤗' },
  { id: 'celebration', name: 'Celebration', icon: '🎉' },
  { id: 'question', name: 'Question', icon: '❓' },
  { id: 'experience', name: 'Share Experience', icon: '📖' },
  { id: 'pregnancy', name: 'Pregnancy', icon: '👶' },
  { id: 'symptoms', name: 'Symptoms', icon: '🤒' },
  { id: 'mental-health', name: 'Mental Health', icon: '🧠' }
];

const POPULAR_TAGS = [
  'period', 'ovulation', 'pms', 'cramps', 'pregnancy', 
  'ttc', 'birth-control', 'mental-health', 'self-care',
  'relationships', 'work', 'exercise', 'diet', 'sleep'
];

export default function CreatePostModal({ isOpen, onClose, onPostCreated }) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general',
    tags: [],
    isAnonymous: false
  });
  const [customTag, setCustomTag] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !formData.title.trim() || !formData.content.trim()) return;

    setIsSubmitting(true);
    try {
      const postData = {
        ...formData,
        authorId: user.uid,
        authorName: user.name,
        likes: [],
        likesCount: 0,
        commentsCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await addDoc(collection(db, 'community', 'posts'), postData);

      // Update category count
      const categoryRef = doc(db, 'community', 'categories', formData.category);
      await updateDoc(categoryRef, {
        postCount: increment(1)
      });

      onPostCreated?.(docRef.id);
      handleClose();
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      content: '',
      category: 'general',
      tags: [],
      isAnonymous: false
    });
    setCustomTag('');
    onClose();
  };

  const handleTagToggle = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const handleAddCustomTag = () => {
    if (customTag.trim() && !formData.tags.includes(customTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, customTag.trim().toLowerCase()]
      }));
      setCustomTag('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="create-post-modal">
        <div className="modal-header">
          <h2>Create Post</h2>
          <button onClick={handleClose} className="close-btn">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="post-form">
          <div className="form-group">
            <label>Category</label>
            <div className="category-grid">
              {CATEGORIES.map(category => (
                <button
                  key={category.id}
                  type="button"
                  className={`category-option ${formData.category === category.id ? 'selected' : ''}`}
                  onClick={() => setFormData(prev => ({ ...prev, category: category.id }))}
                >
                  <span className="category-icon">{category.icon}</span>
                  <span className="category-name">{category.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="post-title">Title</label>
            <input
              id="post-title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="What's on your mind?"
              maxLength={100}
              required
            />
            <div className="char-count">{formData.title.length}/100</div>
          </div>

          <div className="form-group">
            <label htmlFor="post-content">Content</label>
            <textarea
              id="post-content"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Share your thoughts, questions, or experiences..."
              rows="6"
              required
            />
          </div>

          <div className="form-group">
            <label>Tags</label>
            <div className="tags-section">
              <div className="popular-tags">
                {POPULAR_TAGS.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    className={`tag-option ${formData.tags.includes(tag) ? 'selected' : ''}`}
                    onClick={() => handleTagToggle(tag)}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
              
              <div className="custom-tag">
                <input
                  type="text"
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  placeholder="Add custom tag"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomTag())}
                />
                <button type="button" onClick={handleAddCustomTag}>Add</button>
              </div>

              {formData.tags.length > 0 && (
                <div className="selected-tags">
                  {formData.tags.map(tag => (
                    <span key={tag} className="selected-tag">
                      #{tag}
                      <button 
                        type="button"
                        onClick={() => handleTagToggle(tag)}
                      >✕</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.isAnonymous}
                onChange={(e) => setFormData(prev => ({ ...prev, isAnonymous: e.target.checked }))}
              />
              <span className="checkmark"></span>
              Post anonymously
            </label>
            <small>Your name and profile will be hidden</small>
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              onClick={handleClose}
              className="cancel-btn"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting || !formData.title.trim() || !formData.content.trim()}
              className="submit-btn"
            >
              {isSubmitting ? 'Posting...' : 'Create Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}