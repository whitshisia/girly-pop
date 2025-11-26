import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../hooks/useAuth';
import CommunityPostCard from '../../components/CommunityPostCard';
import CreatePostModal from '../../components/CreatePostModal';
import CommentSection from '../../components/CommentSection';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'most-commented', label: 'Most Comments' }
];

const FILTER_OPTIONS = [
  { value: 'all', label: 'All Posts' },
  { value: 'following', label: 'Following' },
  { value: 'my-posts', label: 'My Posts' }
];

export default function CommunityPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [sortBy, setSortBy] = useState('newest');
  const [filterBy, setFilterBy] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    
    let q;
    if (filterBy === 'my-posts' && user) {
      q = query(
        collection(db, 'community', 'posts'),
        where('authorId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(
        collection(db, 'community', 'posts'),
        orderBy('createdAt', 'desc')
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      let filteredPosts = postsData;
      
      // Apply search filter
      if (searchQuery) {
        filteredPosts = filteredPosts.filter(post => 
          post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      }
      
      // Apply category filter
      if (selectedCategory !== 'all') {
        filteredPosts = filteredPosts.filter(post => post.category === selectedCategory);
      }
      
      // Apply sorting
      filteredPosts = sortPosts(filteredPosts, sortBy);
      
      setPosts(filteredPosts);
      setLoading(false);
    });

    return unsubscribe;
  }, [user, sortBy, filterBy, searchQuery, selectedCategory]);

  const sortPosts = (posts, sortType) => {
    switch (sortType) {
      case 'popular':
        return [...posts].sort((a, b) => b.likesCount - a.likesCount);
      case 'most-commented':
        return [...posts].sort((a, b) => (b.commentsCount || 0) - (a.commentsCount || 0));
      case 'newest':
      default:
        return [...posts].sort((a, b) => b.createdAt - a.createdAt);
    }
  };

  const handlePostCreated = () => {
    setIsCreateModalOpen(false);
    // Posts will update automatically via real-time listener
  };

  const filteredPosts = posts.filter(post => {
    if (filterBy === 'my-posts' && user) {
      return post.authorId === user.uid;
    }
    return true;
  });

  return (
    <div className="community-page">
      <div className="community-header">
        <div className="header-content">
          <h1>Community</h1>
          <p>Connect with others, share experiences, and find support</p>
        </div>
        
        {user && (
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="create-post-btn"
          >
            ✏️ Create Post
          </button>
        )}
      </div>

      <div className="community-controls">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search posts, tags, or categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <span className="search-icon">🔍</span>
        </div>

        <div className="filters">
          <select 
            value={filterBy} 
            onChange={(e) => setFilterBy(e.target.value)}
            className="filter-select"
          >
            {FILTER_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            {SORT_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="community-stats">
        <div className="stat-card">
          <span className="stat-number">{posts.length}</span>
          <span className="stat-label">Total Posts</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">
            {posts.reduce((sum, post) => sum + (post.commentsCount || 0), 0)}
          </span>
          <span className="stat-label">Total Comments</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">
            {posts.reduce((sum, post) => sum + post.likesCount, 0)}
          </span>
          <span className="stat-label">Total Likes</span>
        </div>
      </div>

      <div className="posts-grid">
        {loading ? (
          <div className="loading-posts">
            <div className="spinner"></div>
            <p>Loading community posts...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="no-posts">
            <div className="no-posts-icon">💬</div>
            <h3>No posts found</h3>
            <p>
              {searchQuery || selectedCategory !== 'all' || filterBy !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Be the first to start a conversation!'}
            </p>
            {user && (
              <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="create-first-post-btn"
              >
                Create First Post
              </button>
            )}
          </div>
        ) : (
          filteredPosts.map(post => (
            <CommunityPostCard
              key={post.id}
              post={post}
              onPostUpdate={() => {}} // Will refresh via real-time listener
              onCommentClick={setSelectedPost}
            />
          ))
        )}
      </div>

      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onPostCreated={handlePostCreated}
      />

      {selectedPost && (
        <div className="comments-modal">
          <div className="comments-modal-content">
            <CommentSection
              post={selectedPost}
              onClose={() => setSelectedPost(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}