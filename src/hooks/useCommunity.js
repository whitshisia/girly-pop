import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './useAuth';

export const useCommunity = () => {
  const { user } = useAuth();
  const [trendingPosts, setTrendingPosts] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [notifications, setNotifications] = useState([]);

  // Get trending posts (most liked in last 7 days)
  useEffect(() => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const q = query(
      collection(db, 'community', 'posts'),
      where('createdAt', '>=', oneWeekAgo),
      orderBy('likesCount', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const posts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTrendingPosts(posts);
    });

    return unsubscribe;
  }, []);

  // Get user community stats
  useEffect(() => {
    if (!user) return;

    const postsQuery = query(
      collection(db, 'community', 'posts'),
      where('authorId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
      const userPosts = snapshot.docs.map(doc => doc.data());
      
      const totalLikes = userPosts.reduce((sum, post) => sum + post.likesCount, 0);
      const totalComments = userPosts.reduce((sum, post) => sum + (post.commentsCount || 0), 0);
      
      setUserStats({
        postCount: userPosts.length,
        totalLikes,
        totalComments,
        averageLikes: userPosts.length > 0 ? Math.round(totalLikes / userPosts.length) : 0
      });
    });

    return unsubscribe;
  }, [user]);

  // Get user's post notifications (likes, comments on their posts)
  useEffect(() => {
    if (!user) return;

    // This would require a more complex setup with a notifications collection
    // For now, we'll listen to comments on user's posts
    const commentsQuery = query(
      collection(db, 'community', 'comments'),
      where('postAuthorId', '==', user.uid), // You'd need to store postAuthorId in comments
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
      const newNotifications = snapshot.docs.map(doc => ({
        id: doc.id,
        type: 'comment',
        ...doc.data()
      }));
      setNotifications(newNotifications);
    });

    return unsubscribe;
  }, [user]);

  const getUserPostStats = async (userId) => {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return userSnap.data().communityStats || {};
    }
    return {};
  };

  return {
    trendingPosts,
    userStats,
    notifications,
    getUserPostStats
  };
};